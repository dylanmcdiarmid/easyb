'use strict';
// # find config
//
// Looks for the `easyb.js` local config file.
// A convenience layer wrapping `findUp`.
var findUp = require('./find-up');
var DEFAULT_CONFIG_NAME = 'easyb.js';

// Most of the interesting code is in `find-up.js`.
module.exports = function findConfig(configFileName, dir) {
  if (!configFileName) {
    configFileName = DEFAULT_CONFIG_NAME;
  }
  return findUp(configFileName, dir);
};
