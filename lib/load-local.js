'use strict';
// # load local
//
// `loadLocal` is designed to find and load the local version of easyb.
// This is necessary because commonly easyb will be installed as a
// global module for ease of calling from the command line.
var path = require('path');
var findModuleDir = require('./find-module-dir');

// Checks if the given path `p` is the easyb module
function isEasybPackage(v) {
  try {
    var pack = require(v);
    return pack.name === 'easyb';
  } catch (e) {
    return false;
  }
}

// This function does two checks. First we look for node_modules,
// and try to require the package 'easyb' from it. Next we check
// to see if we are working easyb itself, and load that version
// if we are.
//
// `dir` is an optional string of the path to the directory to
// start the search for the module directory
function loadLocal(dir) {
  var localEasyb;
  var moduleDir = findModuleDir(dir);
  try {
    localEasyb = require(path.join(moduleDir, 'easyb'));
  } catch (err0) {
    if (isEasybPackage(path.join(moduleDir, '../package.json'))) {
      try {
        localEasyb = require(path.join(moduleDir, '../'));
      } catch (err1) {
        throw new Error('Detected local package as easyb, but failed to load it.');
      }
    } else {
      throw new Error('Unable to load local version of easyb.');
    }
  }
  return localEasyb;
}

module.exports = loadLocal;
