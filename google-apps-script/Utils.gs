/**
 * Utils.gs - JSON formatting, string manipulation and response helpers
 */

var Utils = {
  jsonResponse: function(data) {
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  },

  substituteVariables: function(templateStr, dataMap) {
    if (!templateStr) return '';
    var result = templateStr;
    for (var key in dataMap) {
      if (dataMap.hasOwnProperty(key)) {
        var val = dataMap[key] != null ? dataMap[key] : '';
        var placeholder = new RegExp('{{\\s*' + key + '\\s*}}', 'gi');
        result = result.replace(placeholder, val);
      }
    }
    return result;
  },

  sanitizeFilename: function(name) {
    return (name || '').replace(/[^a-zA-Z0-9_\-\.]/g, '_');
  },

  generateUniqueRecordId: function(eventId, participantId, certificateId) {
    return (eventId || 'EVT') + '_' + (participantId || 'PAR') + '_' + (certificateId || 'CERT');
  }
};
