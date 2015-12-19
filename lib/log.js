'use strict';
// # log
//
// Currently log is just a wrapper around console. Added
// in case we want to do finer grained message verboseness
// at some point.
var unused;
function dispatch(type, msg) {
  if (!Array.isArray(msg)) {
    msg = [msg];
  }
  console[type].apply(null, msg);
}

function argsToArray(args) {
  return Array.prototype.slice.call(args);
}

var Fns = {
  log: function log() {
    dispatch('log', argsToArray(arguments));
    return null;
  },
  warn: function warn() {
    dispatch('warn', argsToArray(arguments));
    return null;
  },
  fatal: function fatal() {
    dispatch('error', argsToArray(arguments));
    return null;
  }
};

Fns.error = Fns.fatal;

module.exports = Fns;
