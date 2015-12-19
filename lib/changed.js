'use strict';
// # changed
//  Compare two files, the destination and the origin. If the destination exists and
//  has a modified time that is greater than the origin file, `false` will
//  be returned. Otherwise, `true`. The asynchronous variation
//  callback takes a node style `(err, result)`
//
//  Usage: ```javascript
//  changed('my/new/file.js', 'my/old/file.coffee', function(err, result) {
//    if (result) {
//      console.log('file.coffee is newer than file.js');
//    }
//  })
//  ```
//
//  Has sync and async variations.
var fs = require('fs');

// Both `origin` and `dest` should be paths to files.
function changed(origin, dest, cb) {
  var completed = false;
  // If the destination doesn't exist, we can safely return true. Otherwise
  // we need to compare their mtimes (which is done in `maybeComplete`).
  fs.stat(dest, function changedStatDestCb(err0, destStat) {
    if (err0) {
      // We'll take an error being returned as a sign of non-existence
      return cb(null, true);
    }
    fs.stat(origin, function changedStatOrigCb(err1, originStat) {
      if (err1) {
        return cb(err1);
      }
      return cb(null, (originStat.mtime > destStat.mtime));
    });
  });
  return null;
}

// The synchronous version operates similarly, but
// will throw errors if `existsSync` or `statSync` are
// given bad values.
changed.sync = function changedSync(origin, dest) {
  // This try block is an existence check, now that exists has been
  // deprecated.
  var destStat;
  try {
    destStat = fs.statSync(dest);
  } catch (ignore) {
    return true;
  }
  var originStat = fs.statSync(origin);
  return (originStat.mtime > destStat.mtime);
};

module.exports = changed;
