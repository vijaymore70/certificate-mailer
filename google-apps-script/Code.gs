/**
 * Certificate Mailer - Google Apps Script Backend
 * Main Router & Request Handler
 */

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    var params = e && e.parameter ? e.parameter : {};
    var action = params.action;
    var postData = {};

    if (e && e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
        if (postData.action && !action) {
          action = postData.action;
        }
      } catch (err) {
        // Fallback for form-encoded or raw parameters
      }
    }

    if (!action) {
      action = 'ping';
    }

    var result = {};

    switch (action) {
      case 'ping':
        result = {
          success: true,
          status: 'CONNECTED',
          message: 'Certificate Mailer API is operational.',
          quota: QuotaService.getRemainingQuota(),
          timestamp: new Date().toISOString()
        };
        break;

      case 'getQuota':
        result = {
          success: true,
          quota: QuotaService.getRemainingQuota(),
          timestamp: new Date().toISOString()
        };
        break;

      case 'sendTestEmail':
        result = EmailService.sendTestEmail(postData);
        break;

      case 'sendSingleEmail':
        result = EmailService.sendSingleEmail(postData);
        break;

      case 'sendBatchEmails':
        result = EmailService.sendBatchEmails(postData);
        break;

      case 'importParticipants':
        result = ParticipantService.importParticipants(postData);
        break;

      case 'getSendingHistory':
        result = ParticipantService.getSendingHistory(postData.eventId);
        break;

      default:
        result = {
          success: false,
          status: 'ERROR',
          message: 'Unknown action: ' + action
        };
    }

    return Utils.jsonResponse(result);
  } catch (error) {
    return Utils.jsonResponse({
      success: false,
      status: 'FAILED',
      message: error.toString(),
      stack: error.stack
    });
  }
}
