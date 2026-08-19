export type MatchingStrategy = 'CERTIFICATE_ID' | 'NAME' | 'CUSTOM_RULE';

export interface CertificateFile {
  id: string;
  eventId: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  blobData?: ArrayBuffer | Blob;
  base64Data?: string;
  matchedParticipantId?: string;
  uploadedAt: string;
}

export interface MatchingSummary {
  totalParticipants: number;
  matchedCount: number;
  unmatchedCount: number;
  duplicateCount: number;
  missingIdCount: number;
}
