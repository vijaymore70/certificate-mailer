/**
 * EmailService.gs - Handles test and bulk certificate email dispatches
 */

var EmailService = {
  sendTestEmail: function(payload) {
    try {
      var recipient = payload.testEmail || payload.email;
      if (!recipient) {
        return { success: false, status: 'INVALID', message: 'Test email recipient is missing.' };
      }

      var remainingQuota = QuotaService.getRemainingQuota();
      if (remainingQuota <= 0) {
        return {
          success: false,
          status: 'QUOTA_EXHAUSTED',
          message: 'Daily email sending quota exhausted.',
          remainingQuota: 0
        };
      }

      var sampleData = {
        name: payload.name || 'Sample Participant',
        email: recipient,
        certificate_id: payload.certificate_id || 'CERT-SAMPLE-001',
        event_name: payload.event_name || 'Sample Conference 2026',
        registration_id: payload.registration_id || 'REG-1001'
      };

      var subject = Utils.substituteVariables(payload.subject || 'Your Participation Certificate - {{event_name}}', sampleData);
      var htmlBody = Utils.substituteVariables(payload.bodyHtml || payload.body || 'Dear {{name}},\n\nPlease find attached your certificate for {{event_name}}.\n\nCertificate ID: {{certificate_id}}', sampleData);
      
      // Format text body from HTML
      var textBody = htmlBody.replace(/<[^>]+>/g, '');

      var attachments = [];
      if (payload.pdfBase64) {
        var pdfBytes = Utilities.base64Decode(payload.pdfBase64);
        var fileName = payload.pdfFilename || (Utils.sanitizeFilename(sampleData.name) + '_Certificate.pdf');
        var pdfBlob = Utilities.newBlob(pdfBytes, 'application/pdf', fileName);
        attachments.push(pdfBlob);
      }

      var mailOptions = {
        to: recipient,
        subject: '[TEST] ' + subject,
        body: textBody,
        htmlBody: htmlBody,
        name: payload.fromName || 'Certificate Mailer',
        attachments: attachments
      };

      if (payload.replyTo) {
        mailOptions.replyTo = payload.replyTo;
      }

      MailApp.sendEmail(mailOptions);

      return {
        success: true,
        status: 'SENT',
        message: 'Test email successfully sent to ' + recipient,
        remainingQuota: QuotaService.getRemainingQuota()
      };
    } catch (err) {
      return {
        success: false,
        status: 'FAILED',
        message: err.toString(),
        stack: err.stack
      };
    }
  },

  sendSingleEmail: function(payload) {
    try {
      var email = payload.email;
      var name = payload.name;
      var eventId = payload.eventId || 'DEFAULT';
      var participantId = payload.participantId || payload.id;
      var certId = payload.certificateId || payload.certificate_id;
      var recordId = Utils.generateUniqueRecordId(eventId, participantId, certId);

      if (!email || !email.trim()) {
        return { success: false, status: 'INVALID', message: 'Missing participant email address.', recordId: recordId };
      }

      var remainingQuota = QuotaService.getRemainingQuota();
      if (remainingQuota <= 0) {
        return {
          success: false,
          status: 'QUOTA_EXHAUSTED',
          message: 'Daily email quota reached. Execution paused.',
          remainingQuota: 0,
          recordId: recordId
        };
      }

      var dataMap = {
        name: name || '',
        email: email || '',
        certificate_id: certId || '',
        event_name: payload.eventName || payload.event_name || 'Event',
        registration_id: payload.registrationId || payload.registration_id || ''
      };

      var subject = Utils.substituteVariables(payload.subject || 'Your Participation Certificate - {{event_name}}', dataMap);
      var bodyHtml = Utils.substituteVariables(payload.bodyHtml || payload.body || 'Dear {{name}},\n\nPlease find attached your certificate.\n\nRegards,', dataMap);
      var bodyText = bodyHtml.replace(/<[^>]+>/g, '');

      var attachments = [];
      if (payload.pdfBase64) {
        var pdfBytes = Utilities.base64Decode(payload.pdfBase64);
        var filename = payload.pdfFilename || (Utils.sanitizeFilename(name || 'Certificate') + '.pdf');
        if (!filename.toLowerCase().endsWith('.pdf')) {
          filename += '.pdf';
        }
        var pdfBlob = Utilities.newBlob(pdfBytes, 'application/pdf', filename);
        attachments.push(pdfBlob);
      } else if (payload.driveFileId) {
        try {
          var driveFile = DriveApp.getFileById(payload.driveFileId);
          attachments.push(driveFile.getBlob());
        } catch (driveErr) {
          return {
            success: false,
            status: 'NO_CERTIFICATE',
            message: 'Could not retrieve PDF from Google Drive ID: ' + payload.driveFileId,
            recordId: recordId
          };
        }
      }

      if (attachments.length === 0 && payload.requireAttachment !== false) {
        return {
          success: false,
          status: 'NO_CERTIFICATE',
          message: 'No PDF certificate attachment provided.',
          recordId: recordId
        };
      }

      var options = {
        to: email,
        subject: subject,
        body: bodyText,
        htmlBody: bodyHtml,
        name: payload.fromName || 'Certificate Mailer',
        attachments: attachments
      };

      if (payload.replyTo) {
        options.replyTo = payload.replyTo;
      }

      MailApp.sendEmail(options);
      var newQuota = QuotaService.getRemainingQuota();

      // Log to Sheet if active
      ParticipantService.logSendingResult({
        eventId: eventId,
        recordId: recordId,
        participantName: name,
        email: email,
        certificateId: certId,
        status: 'SENT',
        attemptCount: (payload.attemptCount || 0) + 1,
        errorMessage: ''
      });

      return {
        success: true,
        status: 'SENT',
        message: 'Certificate sent successfully to ' + email,
        recordId: recordId,
        remainingQuota: newQuota
      };
    } catch (err) {
      var errMessage = err.toString();
      ParticipantService.logSendingResult({
        eventId: payload.eventId || 'DEFAULT',
        recordId: recordId,
        participantName: payload.name,
        email: payload.email,
        certificateId: payload.certificateId,
        status: 'FAILED',
        attemptCount: (payload.attemptCount || 0) + 1,
        errorMessage: errMessage
      });

      return {
        success: false,
        status: 'FAILED',
        message: errMessage,
        recordId: recordId,
        remainingQuota: QuotaService.getRemainingQuota()
      };
    }
  },

  sendBatchEmails: function(payload) {
    var items = payload.items || [];
    var results = [];
    var sentCount = 0;
    var failedCount = 0;
    var quotaExhausted = false;

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      // Merge parent template settings
      if (payload.subject) item.subject = payload.subject;
      if (payload.bodyHtml) item.bodyHtml = payload.bodyHtml;
      if (payload.fromName) item.fromName = payload.fromName;
      if (payload.replyTo) item.replyTo = payload.replyTo;
      if (payload.eventName) item.eventName = payload.eventName;
      if (payload.eventId) item.eventId = payload.eventId;

      var res = this.sendSingleEmail(item);
      results.push(res);

      if (res.status === 'SENT') {
        sentCount++;
      } else if (res.status === 'QUOTA_EXHAUSTED') {
        quotaExhausted = true;
        break;
      } else {
        failedCount++;
      }
    }

    return {
      success: !quotaExhausted,
      status: quotaExhausted ? 'QUOTA_EXHAUSTED' : 'COMPLETED',
      sentCount: sentCount,
      failedCount: failedCount,
      results: results,
      remainingQuota: QuotaService.getRemainingQuota()
    };
  }
};
