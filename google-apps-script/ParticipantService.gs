/**
 * ParticipantService.gs - Handles participant storage and status logging in Google Sheets
 */

var ParticipantService = {
  importParticipants: function(payload) {
    try {
      var eventId = payload.eventId || 'DEFAULT';
      var participants = payload.participants || [];
      var sheet = getOrCreateSheet(CONFIG.SHEET_NAME_PARTICIPANTS);

      if (!sheet) {
        return {
          success: true,
          status: 'WARNING',
          message: 'Stand-alone mode: Participants imported to local session (no active spreadsheet connected).',
          count: participants.length
        };
      }

      var rows = [];
      var now = new Date().toISOString();
      for (var i = 0; i < participants.length; i++) {
        var p = participants[i];
        rows.push([
          eventId,
          p.id || ('P_' + (i + 1)),
          p.name || '',
          p.email || '',
          p.certificateId || p.certificate_id || '',
          p.registrationId || p.registration_id || '',
          p.status || 'PENDING',
          p.matchedCertificateFile || '',
          now
        ]);
      }

      if (rows.length > 0) {
        sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 9).setValues(rows);
      }

      return {
        success: true,
        status: 'IMPORTED',
        message: 'Successfully recorded ' + participants.length + ' participants in Google Sheet.',
        count: participants.length
      };
    } catch (e) {
      return {
        success: false,
        status: 'FAILED',
        message: 'Error writing to Google Sheet: ' + e.toString()
      };
    }
  },

  logSendingResult: function(logObj) {
    try {
      var sheet = getOrCreateSheet(CONFIG.SHEET_NAME_LOGS);
      if (!sheet) return;

      sheet.appendRow([
        new Date().toISOString(),
        logObj.eventId || 'DEFAULT',
        logObj.recordId || '',
        logObj.participantName || '',
        logObj.email || '',
        logObj.certificateId || '',
        logObj.status || 'PENDING',
        logObj.attemptCount || 1,
        logObj.errorMessage || ''
      ]);
    } catch (e) {
      Logger.log("Failed to write to logs sheet: " + e.toString());
    }
  },

  getSendingHistory: function(eventId) {
    try {
      var sheet = getOrCreateSheet(CONFIG.SHEET_NAME_LOGS);
      if (!sheet) return { success: true, history: [] };

      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) return { success: true, history: [] };

      var history = [];
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        if (!eventId || row[1] === eventId) {
          history.push({
            timestamp: row[0],
            eventId: row[1],
            recordId: row[2],
            participantName: row[3],
            email: row[4],
            certificateId: row[5],
            status: row[6],
            attemptCount: row[7],
            errorMessage: row[8]
          });
        }
      }

      return { success: true, history: history };
    } catch (e) {
      return { success: false, message: e.toString(), history: [] };
    }
  }
};
