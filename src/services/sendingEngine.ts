import { Participant, ParticipantStatus } from '../types/participant';
import { CertificateFile } from '../types/certificate';
import { EmailTemplate } from '../types/template';
import { GasResponse, SendingLogEntry } from '../types/api';
import { GasService } from './gasService';
import {
  getParticipantsByEvent,
  getCertificatesByEvent,
  saveParticipant,
  addLogEntry,
  getGasSettings,
} from './db';

export interface SendingProgress {
  total: number;
  processed: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  remainingQuota: number;
  currentParticipant?: Participant;
  isSending: boolean;
  isPaused: boolean;
  isQuotaExhausted: boolean;
  message?: string;
}

export type ProgressCallback = (progress: SendingProgress) => void;

export class SendingEngine {
  private static instance: SendingEngine | null = null;

  private isRunning: boolean = false;
  private shouldPause: boolean = false;
  private currentProgress: SendingProgress = {
    total: 0,
    processed: 0,
    sentCount: 0,
    failedCount: 0,
    skippedCount: 0,
    remainingQuota: 100,
    isSending: false,
    isPaused: false,
    isQuotaExhausted: false,
  };

  public static getInstance(): SendingEngine {
    if (!SendingEngine.instance) {
      SendingEngine.instance = new SendingEngine();
    }
    return SendingEngine.instance;
  }

  public getProgress(): SendingProgress {
    return { ...this.currentProgress };
  }

  public pause(): void {
    if (this.isRunning) {
      this.shouldPause = true;
      this.currentProgress.isPaused = true;
      this.currentProgress.message = 'Sending paused by user.';
    }
  }

  /**
   * Start bulk sending for pending records of an event
   */
  public async startSending(
    eventId: string,
    eventName: string,
    template: EmailTemplate,
    onProgressUpdate: ProgressCallback,
    options?: { retryOnlyFailed?: boolean }
  ): Promise<void> {
    if (this.isRunning) {
      console.warn('SendingEngine is already running.');
      return;
    }

    this.isRunning = true;
    this.shouldPause = false;

    try {
      const allParticipants = await getParticipantsByEvent(eventId);
      const allCertificates = await getCertificatesByEvent(eventId);
      const certMap = new Map<string, CertificateFile>(allCertificates.map((c) => [c.id, c]));

      // Filter targets
      let targets: Participant[] = [];
      if (options?.retryOnlyFailed) {
        targets = allParticipants.filter((p) => p.status === 'FAILED');
      } else {
        targets = allParticipants.filter(
          (p) => p.status === 'PENDING' || p.status === 'SENDING'
        );
      }

      const settings = await getGasSettings();

      this.currentProgress = {
        total: targets.length,
        processed: 0,
        sentCount: 0,
        failedCount: 0,
        skippedCount: 0,
        remainingQuota: settings.remainingQuota || 100,
        isSending: true,
        isPaused: false,
        isQuotaExhausted: false,
        message: `Starting send queue for ${targets.length} participants...`,
      };
      onProgressUpdate({ ...this.currentProgress });

      for (let i = 0; i < targets.length; i++) {
        if (this.shouldPause) {
          this.currentProgress.isSending = false;
          this.currentProgress.isPaused = true;
          this.currentProgress.message = 'Sending process paused.';
          onProgressUpdate({ ...this.currentProgress });
          break;
        }

        const participant = targets[i];
        this.currentProgress.currentParticipant = participant;
        this.currentProgress.message = `Sending certificate to ${participant.name} (${participant.email})...`;
        onProgressUpdate({ ...this.currentProgress });

        // Pre-flight checks
        if (!participant.email || participant.status === 'INVALID') {
          await this.updateParticipantStatus(participant, 'INVALID', 'Invalid or missing email address');
          this.currentProgress.skippedCount++;
          this.currentProgress.processed++;
          onProgressUpdate({ ...this.currentProgress });
          continue;
        }

        const certFile = participant.matchedCertificateId
          ? certMap.get(participant.matchedCertificateId)
          : undefined;

        if (!certFile) {
          await this.updateParticipantStatus(participant, 'NO_CERTIFICATE', 'No matched PDF certificate file');
          this.currentProgress.skippedCount++;
          this.currentProgress.processed++;
          onProgressUpdate({ ...this.currentProgress });
          continue;
        }

        // Convert PDF binary blob to base64 if needed
        let pdfBase64 = certFile.base64Data;
        if (!pdfBase64 && certFile.blobData) {
          pdfBase64 = await this.blobToBase64(certFile.blobData);
        }

        // Set status to SENDING
        await this.updateParticipantStatus(participant, 'SENDING');

        // Dispatch via GasService
        const res: GasResponse = await GasService.sendSingleEmail({
          eventId,
          participantId: participant.id,
          name: participant.name,
          email: participant.email,
          certificateId: participant.certificateId,
          registrationId: participant.registrationId,
          eventName: participant.eventName || eventName,
          subject: template.subject,
          bodyHtml: template.bodyHtml,
          fromName: template.fromName,
          replyTo: template.replyTo,
          pdfBase64,
          pdfFilename: certFile.filename,
          attemptCount: participant.attempts,
        });

        // Quota check & response handling
        if (res.status === 'QUOTA_EXHAUSTED' || (res.quota !== undefined && res.quota <= 0)) {
          await this.updateParticipantStatus(participant, 'PENDING', 'Quota limit reached. Paused for next window.');
          
          this.currentProgress.isSending = false;
          this.currentProgress.isQuotaExhausted = true;
          this.currentProgress.remainingQuota = 0;
          this.currentProgress.message =
            'Daily email quota reached! Pending certificates saved for next sending window.';
          onProgressUpdate({ ...this.currentProgress });
          break;
        }

        if (res.success && res.status === 'SENT') {
          await this.updateParticipantStatus(participant, 'SENT');
          this.currentProgress.sentCount++;
        } else {
          const errorMsg = res.message || 'Unknown sending failure';
          await this.updateParticipantStatus(participant, 'FAILED', errorMsg);
          this.currentProgress.failedCount++;
        }

        if (typeof res.quota === 'number') {
          this.currentProgress.remainingQuota = res.quota;
        }

        this.currentProgress.processed++;
        onProgressUpdate({ ...this.currentProgress });

        // Throttle delay between requests
        const delay = settings.batchDelayMs || 1200;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      this.currentProgress.isSending = false;
      this.currentProgress.currentParticipant = undefined;
      if (!this.currentProgress.isQuotaExhausted && !this.currentProgress.isPaused) {
        this.currentProgress.message = `Bulk sending completed! Sent: ${this.currentProgress.sentCount}, Failed: ${this.currentProgress.failedCount}, Skipped: ${this.currentProgress.skippedCount}`;
      }
      onProgressUpdate({ ...this.currentProgress });
    } catch (err: any) {
      console.error('Bulk sending error:', err);
      this.currentProgress.isSending = false;
      this.currentProgress.message = `Error in sending loop: ${err.message || err}`;
      onProgressUpdate({ ...this.currentProgress });
    } finally {
      this.isRunning = false;
    }
  }

  private async updateParticipantStatus(
    participant: Participant,
    status: ParticipantStatus,
    errorMsg?: string
  ): Promise<void> {
    const updated: Participant = {
      ...participant,
      status,
      attempts: status === 'SENDING' ? participant.attempts + 1 : participant.attempts,
      lastSentAt: status === 'SENT' ? new Date().toISOString() : participant.lastSentAt,
      lastError: errorMsg || (status === 'SENT' ? '' : participant.lastError),
    };

    await saveParticipant(updated);

    // Save log entry
    const logEntry: SendingLogEntry = {
      id: `LOG_${Date.now()}_${participant.id}`,
      timestamp: new Date().toISOString(),
      eventId: participant.eventId,
      participantId: participant.id,
      participantName: participant.name,
      email: participant.email,
      certificateId: participant.certificateId,
      status,
      attemptNumber: updated.attempts,
      errorMessage: errorMsg || '',
    };

    await addLogEntry(logEntry);
  }

  private blobToBase64(blobData: ArrayBuffer | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const blob = blobData instanceof Blob ? blobData : new Blob([blobData], { type: 'application/pdf' });
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1] || '';
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
