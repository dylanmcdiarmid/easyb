'use strict';
var log = require('./lib/log');
var colors = require('./lib/colors');
var formatException = require('./lib/format-exception');
var Task = require('./lib/task');
var Step = require('./lib/step');
var version = require('./lib/local-version');
var _ = require('lodash');
var consoleUtil = require('./lib/mute-console');
var muteConsole = consoleUtil.muteConsole;
var unmuteConsole = consoleUtil.unmuteConsole;

var changed = require('./lib/changed');
var ensureDirs = require('./lib/ensure-dirs');
var mkdirp = require('mkdirp');

// Stateful variables
//
// * exitFn - holds a custom exit function, mainly used for tests
// * tasksRunning - a counter to prevent early exiting if tasks are triggered from other tasks
// * tasks - `'task-name' => TaskInstance`
// * easyb - container for the exported interface
var exitFn = null;
var tasksRunning = 0;
var tasks = {};
var easyb = {};

// `fail` is a general way to quit when a fatal error has occurred.  If
// `exitFn` hasn't been set, it will simply do a `process.exit`.
function fail(errcode) {
  if (typeof(errcode) === 'undefined') {
    errcode = 1;
  }
  if (exitFn) {
    exitFn(errcode);
  } else {
    process.exit(errcode);
  }
  return null;
}

// For detecting whether easyb.HALT has been passed to prevent moving to the
// next step.
function isHaltDirective(v) {
  return (v && (typeof(v) === 'object') && v.__IS_EASYB_HALT === true);
}

// For detecting whether easyb.HALT has been passed to prevent moving to the
// next step.
function isErrorDirective(v) {
  return (v && (typeof(v) === 'object') && v.__IS_EASYB_ERROR === true);
}

// `maybeHalt` is a composition that decreases the `tasksRunning` counter then
// sees if it is an ok time to exit
function maybeHalt() {
  taskEnding();
  maybeExit();
  return null;
}

// The primary workhorse of the task system.
//
// * `taskName` - (string) the name of the task to be run, * `initialOptions` -
// (object, optional) meant for the value you'd like to be passed to the first
// step function's second argument.
//
// `easyb#trigger` is the public interface to this function.
function runTask(taskName, initialOptions) {
  var task = tasks[taskName];
  var currentStep = 0;
  if (!task) {
    log.error(colors.fatal('Non-existent task requested: ') + colors.normal(taskName));
    fail();
    return null;
  }
  var steps = task.getSteps();
  var stepDefaults = task.getStepDefaults();
  if (!steps[0]) {
    log.error(colors.fatal('Task ') + colors.normal(taskName) +
              colors.fatal(' has no steps assigned.'));
    fail();
    return null;
  }
  taskStarting();
  // `next` is the function that will be passed as the first argument to the
  // step function.  It gets it's first trigger from `runTask`, but then it is
  // up to each step function to call it (unless you never want the process to
  // exit, which may sometimes be the case, for instance when you want to
  // monitor files)
  //
  // In addition to providing next with options, it also accepts two
  // directives, `easyb.HALT` or `easyb.ERROR`.
  var next = function next(opts) {
    // Passing next the `easyb.HALT` value will result in early termination of
    // the task.
    if (isHaltDirective(opts)) {
      maybeHalt();
      return null;
    }
    // If `easyb.ERROR` has been passed, the second argument should be the
    // error.  This is a way to force an error to trigger if you aren't in a
    // position to throw an error (for example, if you get the error in an
    // async operation)
    if (isErrorDirective(opts)) {
      // We the step will have been incremented at this point, so we'll need to
      // backup to the previous step
      var errorStep = steps[currentStep - 1];
      handleNextError(errorStep, task, arguments[1]);
      return null;
    }
    // Load steps from the task and set option defaults.
    var step = steps[currentStep];
    var stepDefault = stepDefaults[currentStep];
    var options = _.defaultsDeep({}, opts, stepDefault);
    // If there are no more steps left, we're done with the task.
    if (!step) {
      log.log(colors.success('Task ') + colors.normal(taskName) +
              colors.success(' complete.'));
      maybeHalt();
      return null;
    }
    currentStep += 1;
    // This block tries to run the step, and
    try {
      step.getRunFn()(next, options);
    } catch (e) {
      handleNextError(step, task, e, currentStep);
    }
  };
  next(initialOptions);
  return null;
}

// Error handling is broken out into it's own closure, so it can be called from
// either a thrown error or from an error directive from `next`.
function handleNextError(step, task, err, currentStep) {
  var stepError = step.getErrorFn();
  var taskError = task.getErrorFn();
  if (stepError) {
    stepError(err);
  } else if (taskError) {
    taskError(err);
  } else {
    // Default error handling behavior occurs if no step level or task level error handler
    // has been assigned.
    log.warn(colors.error('Uncaught error running step ' + currentStep + ' in task ') +
             colors.normal(task.getName()));
    if (err.message) {
      log.warn(colors.error('Error Message: ') + colors.normal(err.message));
    }
  }
  maybeHalt();
  return null;
}

// Increases the state variable `tasksRunning`
function taskStarting() {
  tasksRunning += 1;
  return null;
}

// Decreases the state variable `tasksRunning`
function taskEnding() {
  tasksRunning -= 1;
  return null;
}

// Will exit if their are no tasks still running
function maybeExit() {
  if (tasksRunning > 1) {
    return null;
  }
  if (exitFn) {
    exitFn(0);
  } else {
    process.exit(0);
  }
}

// ## easyb interface

// `easyb.task` is for setting up a new task in the system. Give it a name and
// optional description, and you'll get back an instance of the `Task` data
// structure.
easyb.task = function task(name, description) {
  if (tasks[name] !== undefined) {
    log.fatal(colors.fatal('Task name ' + name + ' has already been defined.'));
    fail();
  }
  tasks[name] = new Task(name);
  if (description) {
    tasks[name].description(description);
  }
  return tasks[name];
};

easyb.Step = Step;

// `start` is the interface into easyb designed to be called by the CLI. If you
// are using easyb programatically, you probably won't need this function.
//
// If you do need to use it, three things may be set in the `options` object,
// `taskName`, `silent`, and `argv`. `taskName` (required) is the name of the
// task you want to trigger after the `configPath` has been required, and
// `argv` contains the options that will be passed to the first step of the
// specified task. `silent` mutes any console output (including from running
// tasks).
easyb.start = function start(configPath, options) {
  // Loading the config will usually modify the local state.
  try {
    require(configPath);
  } catch (e) {
    log.fatal(colors.fatal('Error reading local config file: ') + colors.file(configPath));
    log.fatal(formatException(e));
    fail();
  }
  runTask(options.task, options.argv);
};

// Setter for the private `exitFn` variable. Primarily for test
// suites or other programatic usages.
easyb.setExitFn = function setExitFn(fn) {
  exitFn = fn;
  return null;
};

// Returns just the names and descriptions from all registered tasks.
easyb.getTaskNamesAndDescriptions = function getTaskNamesAndDescriptions() {
  return (Object.keys(tasks)).map(function taskNameAndDescMap(key) {
    return {
      name: tasks[key].getName(),
      description: tasks[key].getDescription()
    };
  });
};

// Trigger a task. Acts as the interface to the private function `runTask`.
easyb.trigger = function trigger(taskName, opts) {
  runTask(taskName, opts);
};

// Resets all local state variables. Primarily added for testing.
easyb.reset = function reset() {
  exitFn = null;
  tasksRunning = 0;
  tasks = {};
  return null;
};

// Shortcut to `require('./package').version`
easyb.version = version;

// Definition of the HALT directive, used to stop a task from continuing.
easyb.HALT = {__IS_EASYB_HALT: true};

// Definition of the ERROR directive, used to trigger a step or task error when
// throwing an error isn't possible.
easyb.ERROR = {__IS_EASYB_ERROR: true};

// Utility and library access
easyb.changed = changed;
easyb.ensureDirs = ensureDirs;
easyb.mkdirp = mkdirp;
easyb.colors = colors;
easyb.log = log;
easyb.muteConsole = muteConsole;
easyb.unmuteConsole = unmuteConsole;

module.exports = easyb;
