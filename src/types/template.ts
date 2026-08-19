export interface EmailTemplate {
  id: string;
  eventId: string;
  fromName: string;
  replyTo?: string;
  subject: string;
  bodyHtml: string;
  updatedAt: string;
}

export const DEFAULT_TEMPLATE: Omit<EmailTemplate, 'id' | 'eventId' | 'updatedAt'> = {
  fromName: 'Refresh Technology',
  replyTo: '',
  subject: 'Your Participation Certificate – {{event_name}}',
  bodyHtml: `Dear {{name}},
Thank you for participating in {{event_name}}.
Please find your participation certificate attached to this email.
Certificate Details:
Certificate ID: {{certificate_id}}
Registration ID: {{registration_id}}
Regards,
Refresh Technology`,
};
