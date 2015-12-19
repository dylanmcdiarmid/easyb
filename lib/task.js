'use strict';
// # Task
//
// The Task data structure may hold a name, description, list of steps (in order),
// default values to pass to the steps (in order), and an error function.
//
// Task should not be used directly, instead use `easyb#task`

var Task = function Task(name, description) {
  if (!(this instanceof Task)) {
    return new Task(name, description);
  }
  this.name(name);
  this.description(description);
  this._steps = [];
  this._stepDefaults = [];
};

Task.prototype = {
  name: function name(v) {
    this._name = v;
    return this;
  },

  description: function description(v) {
    this._description = v;
    return this;
  },

  step: function step(v, defaults) {
    this._steps.push(v);
    this._stepDefaults.push(defaults);
    return this;
  },

  error: function error(v) {
    this._error = v;
    return this;
  },

  getName: function getName() {
    return this._name;
  },

  getDescription: function getDescription() {
    return this._description;
  },

  getSteps: function getSteps() {
    return this._steps;
  },

  getStepDefaults: function getStepDefaults() {
    return this._stepDefaults;
  },

  getErrorFn: function getErrorFn() {
    return this._error;
  }
};

module.exports = Task;
