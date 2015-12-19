'use strict';
// # find up
//
// Walk up a directory tree looking for something.
var path = require('path');
var fs = require('fs');
var colors = require('./colors');
var tildify = require('tildify');

// Max amount of 'up' moves before we quit
var MAX_ITERATION = 20;

// Searches for a file. Only `fileName` is required.
//
// * `fileName` - (string) The name of the file to look for.
// * `dir` - (string, optional) The starting directory. Defaults to
//   `process.cwd()`.
// * `lastDir` - (string, don't use) This is used by the recursive
//   process to keep track of the previous directory in the process.
// * `iterationCount` - (string, don't use) This is used by the
//   recursive process to prevent infinite loops.
var findUp = function findUp(fileName, dir, lastDir, iterationCount) {
  var err;
  if (!dir) {
    dir = process.cwd();
  }
  if (!lastDir) {
    lastDir = null;
  }
  if (!iterationCount) {
    iterationCount = 0;
  }
  // If moving us upward took us to the same directory, it's time to stop
  if (lastDir && lastDir === dir) {
    err = new Error('Unable to find path.');
    err.formattedMessage = colors.fatal('Unable to find ' + colors.file(fileName) + '.');
    throw err;
  }

  // I don't know file systems well enough to prove it's impossible to get caught in a loop
  // while attempting to traverse upwards, so we'll force a failure after a set amount of iterations.
  if (iterationCount > MAX_ITERATION) {
    err = new Error('Unable to find path');
    err.formattedMessage = colors.fatal('Abandoned search for ') + colors.file(fileName) +
      colors.fatal(' after looking through ') +
      colors.normal(MAX_ITERATION) +
      colors.fatal(' directories.');
    throw err;
  }

  var cpath = path.join(dir, fileName);
  try {
    if (fs.existsSync(cpath)) {
      return cpath;
    }
  } catch (e) {
    e.formattedMessage = colors.error('Error checking path existence while searching for ') +
      colors.file(tildify(cpath));
    throw e;
  }

  return findUp(fileName, path.resolve(dir, '../'), dir, iterationCount + 1);
};

module.exports = findUp;
