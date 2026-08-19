/**
 * QuotaService.gs - Checks Google MailApp remaining daily sending quota
 */

var QuotaService = {
  getRemainingQuota: function() {
    try {
      var quota = MailApp.getRemainingDailyQuota();
      return typeof quota === 'number' ? quota : 100;
    } catch (e) {
      Logger.log("Error getting quota: " + e.toString());
      return 0;
    }
  },

  hasAvailableQuota: function(minRequired) {
    var min = minRequired || 1;
    return this.getRemainingQuota() >= min;
  }
};
