export type ParticipantStatus =
  | 'PENDING'
  | 'SENDING'
  | 'SENT'
  | 'FAILED'
  | 'SKIPPED'
  | 'INVALID'
  | 'NO_CERTIFICATE';

export type MatchStatus =
  | 'MATCHED'
  | 'NOT_FOUND'
  | 'DUPLICATE'
  | 'MISSING_ID';

export interface Participant {
  id: string;
  eventId: string;
  name: string;
  email: string;
  certificateId: string;
  registrationId?: string;
  eventName?: string;
  status: ParticipantStatus;
  matchedCertificateId?: string; // Links to CertificateFile.id
  matchedCertificateFilename?: string;
  matchStatus: MatchStatus;
  attempts: number;
  lastSentAt?: string;
  lastError?: string;
  extraFields?: Record<string, string>;
}

export interface ParticipantValidationError {
  rowNumber: number;
  participantId?: string;
  name: string;
  email: string;
  certificateId: string;
  type: 'MISSING_NAME' | 'INVALID_EMAIL' | 'DUPLICATE_EMAIL' | 'DUPLICATE_CERT_ID' | 'MISSING_CERT_ID';
  message: string;
}

export interface ColumnMapping {
  name: string;
  email: string;
  certificateId: string;
  registrationId?: string;
  eventName?: string;
  [key: string]: string | undefined;
}
