'use strict';
// # Step
//
// Like its friend `Task`, Step is just a data structure
// set up to be chainable. It must have a `run` function, and
// may optionally have an `error` function that will handle
// any thrown or triggered errors from the `run` function.
//
// Step should normally not be included directly, and instead
// accessed through the 'easyb#Step' reference.

function Step(runFn) {
  if (!(this instanceof Step)) {
    return new Step(runFn);
  }
  if (runFn) {
    this.run(runFn);
  }
  return this;
}

Step.prototype = {
  run: function run(fn) {
    this._run = fn;
    return this;
  },

  error: function error(fn) {
    this._error = fn;
    return this;
  },

  getRunFn: function getRunFn() {
    return this._run;
  },

  getErrorFn: function getErrorFn() {
    return this._error;
  }
};

module.exports = Step;
