import { EmailTemplate } from './template';
import { MatchingStrategy } from './certificate';

export interface Event {
  id: string;
  name: string;
  description?: string;
  eventDate?: string;
  createdAt: string;
  updatedAt: string;
  matchingStrategy: MatchingStrategy;
  emailTemplate: EmailTemplate;
}

export interface EventStats {
  totalParticipants: number;
  matchedCertificates: number;
  unmatchedCertificates: number;
  sentCount: number;
  pendingCount: number;
  failedCount: number;
  skippedCount: number;
  invalidCount: number;
  noCertCount: number;
}
