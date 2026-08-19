/**
 * Config.gs - Configuration and Sheet initialization helpers
 */

var CONFIG = {
  SHEET_NAME_PARTICIPANTS: 'Participants',
  SHEET_NAME_LOGS: 'Sending_Logs',
  DEFAULT_BATCH_SIZE: 10,
  APP_TITLE: 'Certificate Mailer'
};

function getOrCreateSheet(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    // If running stand-alone script without active spreadsheet, create one or log warning
    return null;
  }
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    initializeSheetHeaders(sheet, sheetName);
  }
  return sheet;
}

function initializeSheetHeaders(sheet, sheetName) {
  if (sheetName === CONFIG.SHEET_NAME_LOGS) {
    sheet.appendRow([
      'Timestamp',
      'Event ID',
      'Record ID',
      'Participant Name',
      'Email',
      'Certificate ID',
      'Status',
      'Attempt Count',
      'Error Message'
    ]);
    sheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#0f172a').setFontColor('#ffffff');
  } else if (sheetName === CONFIG.SHEET_NAME_PARTICIPANTS) {
    sheet.appendRow([
      'Event ID',
      'Participant ID',
      'Name',
      'Email',
      'Certificate ID',
      'Registration ID',
      'Status',
      'Matched Certificate File',
      'Last Updated'
    ]);
    sheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#0f172a').setFontColor('#ffffff');
  }
}
