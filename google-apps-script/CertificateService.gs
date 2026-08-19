/**
 * CertificateService.gs - Handles Google Drive certificate file storage and retrieval
 */

var CertificateService = {
  getDriveFolder: function(folderName) {
    try {
      var folders = DriveApp.getFoldersByName(folderName || 'Certificate_Mailer_Files');
      if (folders.hasNext()) {
        return folders.next();
      }
      return DriveApp.createFolder(folderName || 'Certificate_Mailer_Files');
    } catch (e) {
      Logger.log("Error getting drive folder: " + e.toString());
      return null;
    }
  },

  uploadCertificateToDrive: function(payload) {
    try {
      var folder = this.getDriveFolder(payload.folderName);
      if (!folder) {
        return { success: false, message: 'Google Drive access unconfigured or unavailable.' };
      }

      var filename = payload.filename || 'certificate.pdf';
      var pdfBytes = Utilities.base64Decode(payload.pdfBase64);
      var blob = Utilities.newBlob(pdfBytes, 'application/pdf', filename);

      var file = folder.createFile(blob);
      return {
        success: true,
        fileId: file.getId(),
        fileUrl: file.getUrl(),
        filename: filename
      };
    } catch (e) {
      return {
        success: false,
        message: 'Drive upload error: ' + e.toString()
      };
    }
  }
};
