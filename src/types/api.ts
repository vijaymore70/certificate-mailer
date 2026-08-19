export interface GasResponse<T = any> {
  success: boolean;
  status?: string;
  message?: string;
  quota?: number;
  remainingQuota?: number;
  recordId?: string;
  data?: T;
  results?: Array<{
    success: boolean;
    status: string;
    message: string;
    recordId?: string;
  }>;
}

export interface GasSettings {
  webAppUrl: string;
  connected: boolean;
  lastTestedAt?: string;
  remainingQuota: number;
  batchDelayMs: number;
}

export interface SendingLogEntry {
  id: string;
  timestamp: string;
  eventId: string;
  participantId: string;
  participantName: string;
  email: string;
  certificateId: string;
  status: string;
  attemptNumber: number;
  errorMessage?: string;
}
