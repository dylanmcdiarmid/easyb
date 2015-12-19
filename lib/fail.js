'use strict';
// # fail
// Quick wrapper around `process.exit`, designed to be used with `bin/easyb.js`
function fail(errcode) {
  if (typeof errcode === 'undefined') {
    errcode = 1;
  }
  process.exit(errcode);
}

module.exports = fail;
