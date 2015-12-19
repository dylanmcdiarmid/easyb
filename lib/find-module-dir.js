'use strict';
// # find module dir
//
// Looks for the `node_modules` directory.
// A convenience layer wrapping the `findUp`.
var findUp = require('./find-up');
var DEFAULT_MODULE_DIR = 'node_modules';

// Most of the interesting code is in `find-up.js`.
module.exports = function findModuleDir(dir) {
  return findUp(DEFAULT_MODULE_DIR, dir);
};
