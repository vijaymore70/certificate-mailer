import { Participant, MatchStatus } from '../types/participant';
import { CertificateFile, MatchingStrategy, MatchingSummary } from '../types/certificate';

export class MatchingService {
  /**
   * Run matching algorithm on participants against certificate files
   */
  static matchCertificates(
    participants: Participant[],
    certificates: CertificateFile[],
    strategy: MatchingStrategy = 'CERTIFICATE_ID'
  ): { updatedParticipants: Participant[]; updatedCertificates: CertificateFile[]; summary: MatchingSummary } {
    // Reset matches
    const certsMap = new Map<string, CertificateFile>();
    const filenameMap = new Map<string, CertificateFile[]>();

    certificates.forEach((c) => {
      certsMap.set(c.id, { ...c, matchedParticipantId: undefined });
      
      const cleanName = this.normalizeString(c.filename.replace(/\.pdf$/i, ''));
      const list = filenameMap.get(cleanName) || [];
      list.push(c);
      filenameMap.set(cleanName, list);
    });

    const participantMatches = new Map<string, { certId: string; certFilename: string; status: MatchStatus }>();
    const certUsageCount = new Map<string, number>();

    participants.forEach((p) => {
      if (p.status === 'INVALID') {
        participantMatches.set(p.id, {
          certId: '',
          certFilename: '',
          status: 'MISSING_ID',
        });
        return;
      }

      let matchedFile: CertificateFile | undefined;

      if (strategy === 'CERTIFICATE_ID') {
        if (!p.certificateId) {
          participantMatches.set(p.id, { certId: '', certFilename: '', status: 'MISSING_ID' });
          return;
        }
        const targetClean = this.normalizeString(p.certificateId);
        const candidates = filenameMap.get(targetClean);

        if (candidates && candidates.length > 0) {
          if (candidates.length === 1) {
            matchedFile = candidates[0];
          } else {
            // Duplicate PDF filenames found
            participantMatches.set(p.id, { certId: '', certFilename: '', status: 'DUPLICATE' });
            return;
          }
        }
      } else if (strategy === 'NAME') {
        if (!p.name) {
          participantMatches.set(p.id, { certId: '', certFilename: '', status: 'MISSING_ID' });
          return;
        }
        const targetClean = this.normalizeString(p.name);
        const candidates = filenameMap.get(targetClean);

        if (candidates && candidates.length > 0) {
          if (candidates.length === 1) {
            matchedFile = candidates[0];
          } else {
            participantMatches.set(p.id, { certId: '', certFilename: '', status: 'DUPLICATE' });
            return;
          }
        }
      } else {
        // Custom / hybrid rule (Try cert_id first, then name)
        const certIdClean = this.normalizeString(p.certificateId);
        const nameClean = this.normalizeString(p.name);

        const certIdCandidates = filenameMap.get(certIdClean);
        const nameCandidates = filenameMap.get(nameClean);

        if (certIdCandidates && certIdCandidates.length === 1) {
          matchedFile = certIdCandidates[0];
        } else if (nameCandidates && nameCandidates.length === 1) {
          matchedFile = nameCandidates[0];
        }
      }

      if (matchedFile) {
        const usage = (certUsageCount.get(matchedFile.id) || 0) + 1;
        certUsageCount.set(matchedFile.id, usage);

        if (usage > 1) {
          // Multiple participants matched the same single PDF
          participantMatches.set(p.id, {
            certId: matchedFile.id,
            certFilename: matchedFile.filename,
            status: 'DUPLICATE',
          });
        } else {
          participantMatches.set(p.id, {
            certId: matchedFile.id,
            certFilename: matchedFile.filename,
            status: 'MATCHED',
          });
        }
      } else {
        participantMatches.set(p.id, {
          certId: '',
          certFilename: '',
          status: 'NOT_FOUND',
        });
      }
    });

    // Apply updates to participants
    const updatedParticipants = participants.map((p) => {
      const match = participantMatches.get(p.id);
      if (!match) return p;

      let newStatus = p.status;
      if (match.status === 'NOT_FOUND' || match.status === 'MISSING_ID') {
        if (p.status !== 'SENT') {
          newStatus = 'NO_CERTIFICATE';
        }
      } else if (match.status === 'MATCHED') {
        if (p.status === 'NO_CERTIFICATE' || p.status === 'INVALID') {
          newStatus = 'PENDING';
        }
      }

      return {
        ...p,
        matchedCertificateId: match.certId || undefined,
        matchedCertificateFilename: match.certFilename || undefined,
        matchStatus: match.status,
        status: newStatus,
      };
    });

    // Apply updates to certificates
    const updatedCertificates = certificates.map((c) => {
      const matchedP = updatedParticipants.find((p) => p.matchedCertificateId === c.id);
      return {
        ...c,
        matchedParticipantId: matchedP ? matchedP.id : undefined,
      };
    });

    // Compute summary statistics
    let matchedCount = 0;
    let unmatchedCount = 0;
    let duplicateCount = 0;
    let missingIdCount = 0;

    updatedParticipants.forEach((p) => {
      if (p.matchStatus === 'MATCHED') matchedCount++;
      else if (p.matchStatus === 'NOT_FOUND') unmatchedCount++;
      else if (p.matchStatus === 'DUPLICATE') duplicateCount++;
      else if (p.matchStatus === 'MISSING_ID') missingIdCount++;
    });

    const summary: MatchingSummary = {
      totalParticipants: updatedParticipants.length,
      matchedCount,
      unmatchedCount,
      duplicateCount,
      missingIdCount,
    };

    return { updatedParticipants, updatedCertificates, summary };
  }

  /**
   * Helper to normalize string for comparison (removes underscores, hyphens, spaces, uppercase)
   */
  public static normalizeString(str: string): string {
    if (!str) return '';
    return str
      .trim()
      .toLowerCase()
      .replace(/[\_\-\s\.\,]/g, '');
  }
}
