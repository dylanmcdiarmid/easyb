'use strict';
// # ensure dirs
//  Ensures directories have been created, creating them if they don't exist. Really just
//  a small convenience layer on top of `mkdirp`.
//
//  Designed to take a list of directories (probably grabbed using `path.dirname`
//  from a list of file destinations). Async and sync variations available.
//
//  Usage:
//  ```javascript
//    ensureDirs(['./dir1', './dir2'], function(err) {
//      if (err) {
//        console.log("Some dirs created, but there were problems.");
//       }
//      console.log("All non-existent directories have been created");
//    });
//  ```

var _ = require('lodash');
var mkdirp = require('mkdirp');
var fs = require('fs');
// List should be a list of directory paths (don't hand it paths to files).
// `cb` will receive either a list of errors, or null.
function ensureDirs(list, cb) {
  if (!list || !list.length) {
    return cb(null);
  }
  // Removes duplicates
  var uniqueList = _.uniq(list);
  var errors = [];
  // We'll keep track of errors, and make sure
  // that each item of the list is processed before
  // we callback.
  var doneCount = uniqueList.length;
  var itemsProcessed = 0;
  function maybeDone() {
    if (itemsProcessed >= doneCount) {
      if (errors.length) {
        cb(errors);
      } else {
        cb(null);
      }
    }
  }
  uniqueList.forEach(function processDirs(v) {
    // Stat each file to check for it's existence, increment
    // items processed counter, then check to see if we
    // can callback yet.
    fs.stat(v, function existsCb(err, pathExists) {
      if (err || !pathExists) {
        mkdirp(v, function mkdirpCb(err) {
          itemsProcessed += 1;
          if (err) {
            errors.push(err);
          }
          maybeDone();
        });
      } else {
        maybeDone();
      }
    });
  });
  return null;
}

// The sync version will throw `fs` or `mkdirp` errors.
ensureDirs.sync = function ensureDirsSync(list) {
  if (!list || !list.length) {
    return null;
  }
  var uniqueList = _.uniq(list);
  uniqueList.forEach(function processDirs(v) {
    // We are using sync just as an existence test.
    try {
      fs.statSync(v);
    } catch (e) {
      mkdirp.sync(v);
    }
  });
  return null;
};

module.exports = ensureDirs;
