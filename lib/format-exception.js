'use strict';
// # format exception
//
// A convenience function for printing colored exception messages.
var colors = require('./colors');
function formatException(e) {
  var msg = colors.normal(e.message);
  if (e.stack) {
    msg = '\n' + colors.normal(e.stack);
  }
  return colors.fatal('Exception Message: ') + msg;
}
module.exports = formatException;
