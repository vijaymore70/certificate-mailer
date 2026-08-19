import { GasResponse, GasSettings } from '../types/api';
import { getGasSettings, saveGasSettings } from './db';

/**
 * GasService manages API requests to the Google Apps Script Web App.
 */

export class GasService {
  /**
   * Ping GAS Backend to verify URL and get remaining daily quota
   */
  static async testConnection(url?: string): Promise<{ success: boolean; quota: number; message: string }> {
    const settings = await getGasSettings();
    const targetUrl = url || settings.webAppUrl;

    if (!targetUrl || !targetUrl.trim()) {
      return {
        success: false,
        quota: 100,
        message: 'No Google Apps Script Web App URL configured. Operating in browser local simulation mode.',
      };
    }

    try {
      const cleanUrl = targetUrl.trim();
      const fetchUrl = `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}action=ping&_t=${Date.now()}`;
      
      const response = await fetch(fetchUrl, {
        method: 'GET',
        redirect: 'follow',
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const data: GasResponse = await response.json();

      const quota = typeof data.quota === 'number' ? data.quota : (data.remainingQuota || 100);
      const isOk = data.success === true;

      // Update settings
      await saveGasSettings({
        ...settings,
        webAppUrl: cleanUrl,
        connected: isOk,
        lastTestedAt: new Date().toISOString(),
        remainingQuota: quota,
      });

      return {
        success: isOk,
        quota,
        message: data.message || (isOk ? 'Connected successfully to Google Apps Script!' : 'Apps Script returned failure status.'),
      };
    } catch (err: any) {
      console.warn('GAS Connection check failed:', err);
      return {
        success: false,
        quota: settings.remainingQuota || 100,
        message: `Failed to connect to Google Apps Script: ${err.message || 'CORS or Network error'}. Make sure the Web App is deployed as "Anyone" access.`,
      };
    }
  }

  /**
   * Send Test Email
   */
  static async sendTestEmail(params: {
    testEmail: string;
    fromName: string;
    replyTo?: string;
    subject: string;
    bodyHtml: string;
    pdfBase64?: string;
    pdfFilename?: string;
    eventName?: string;
  }): Promise<GasResponse> {
    const settings = await getGasSettings();

    if (!settings.webAppUrl || !settings.webAppUrl.trim()) {
      // Local demo mode response
      console.log('Simulating test email dispatch (no GAS URL set):', params);
      await new Promise((r) => setTimeout(r, 800));
      return {
        success: true,
        status: 'SENT',
        message: `[LOCAL DEMO] Test email simulated for ${params.testEmail}. Configure Apps Script Web App URL in Settings to send real emails!`,
        quota: settings.remainingQuota,
      };
    }

    return this.postRequest('sendTestEmail', params);
  }

  /**
   * Send Single Participant Email
   */
  static async sendSingleEmail(payload: {
    eventId: string;
    participantId: string;
    name: string;
    email: string;
    certificateId: string;
    registrationId?: string;
    eventName?: string;
    subject: string;
    bodyHtml: string;
    fromName: string;
    replyTo?: string;
    pdfBase64?: string;
    pdfFilename?: string;
    attemptCount?: number;
  }): Promise<GasResponse> {
    const settings = await getGasSettings();

    if (!settings.webAppUrl || !settings.webAppUrl.trim()) {
      // Simulation mode
      await new Promise((r) => setTimeout(r, 500));
      const simulatedRemaining = Math.max(0, settings.remainingQuota - 1);
      await saveGasSettings({ ...settings, remainingQuota: simulatedRemaining });
      
      return {
        success: true,
        status: 'SENT',
        message: `[LOCAL SIMULATION] Sent to ${payload.email}`,
        recordId: `${payload.eventId}_${payload.participantId}`,
        quota: simulatedRemaining,
      };
    }

    const response = await this.postRequest('sendSingleEmail', payload);

    if (typeof response.quota === 'number') {
      await saveGasSettings({ ...settings, remainingQuota: response.quota });
    } else if (typeof response.remainingQuota === 'number') {
      await saveGasSettings({ ...settings, remainingQuota: response.remainingQuota });
    }

    return response;
  }

  /**
   * Generic POST request helper to Apps Script endpoint
   */
  private static async postRequest(action: string, data: any): Promise<GasResponse> {
    const settings = await getGasSettings();
    const url = settings.webAppUrl.trim();

    try {
      const payload = { action, ...data };
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', // Prevents CORS preflight issues with GAS
        },
        body: JSON.stringify(payload),
        redirect: 'follow',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const resData: GasResponse = await response.json();
      return resData;
    } catch (error: any) {
      return {
        success: false,
        status: 'FAILED',
        message: error.message || 'Network error communicating with Google Apps Script backend.',
      };
    }
  }
}
