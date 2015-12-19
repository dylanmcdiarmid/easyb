'use strict';
var assert = require('chai').assert;
var easyb = require('../');
var Step = easyb.Step;
var errorHandler = function(e) {
  throw new Error(e);
};

// version should match package version

// Step error should be triggered when exception is thrown
// Task error should be triggered when exception is thrown from Step.run if there is no step.error
// Task.error should be triggered when exception is thrown from Step.error
// System error should be triggered when exception is thrown from Step.urn if there is no step.error and no task.error

// Step should accept a run function
// Step should error if we try to redefine
// Task should be halted

// change async/sync should detect the change / lack of change between two files

// N.B. Errors thrown in steps will be caught and handled automatically by the task system,
// so ensure that you do your asserts outside of step run functions 
// (error functions or the exit function should be fine)
describe('task running', function() {
  beforeEach(function() {
    easyb.reset();
  });
  it('should error when running a non-existent task', function(done) {
    easyb.setExitFn(function(errcode) {
      assert.equal(errcode, 1);
      done();
    });
    easyb.trigger('no-task');
  });
  it('should error when running a task with no steps', function(done) {
    easyb.setExitFn(function(errcode) {
      assert.equal(errcode, 1);
      done();
    });
    easyb.task('test-task');
    easyb.trigger('test-task');
  });
  it('should run a task of a single step, then exit', function(done) {
    easyb.setExitFn(function(errcode) {
      assert.equal(errcode, 0);
      done();
    });
    easyb.task('test-task').step(Step(function(next) {
      next();
    }));
    easyb.trigger('test-task');
  });
  it('should run a two step task, then exit', function(done) {
    var tasksRun = 0;
    easyb.setExitFn(function(errcode) {
      assert.equal(tasksRun, 2);
      assert.equal(errcode, 0);
      done();
    });
    easyb.task('test-task')
      .step(Step(function(next) {
        tasksRun += 1;
        next();
      }))
      .step(Step(function(next) {
        tasksRun += 1;
        next();
      }));
    easyb.trigger('test-task');
  });
  it('should halt when next is passed `easyb.HALT`', function(done) {
    var tasksRun = 0;
    easyb.setExitFn(function(errcode) {
      assert.equal(tasksRun, 1);
      assert.equal(errcode, 0);
      done();
    });
    easyb.task('test-task')
      .step(Step(function(next) {
        tasksRun += 1;
        next(easyb.HALT);
      }))
      .step(Step(function(next) {
        tasksRun += 1;
        next();
      }));
    easyb.trigger('test-task');
  });
  it('should pass options from one step to the next', function(done) {
    var tests = {};
    easyb.setExitFn(function(errcode) {
      assert.equal(tests.foo, 'bar');
      assert.equal(errcode, 0);
      done();
    });
    easyb.task('test-task')
      .step(Step(function(next) {
        next({ foo: 'bar' });
      }))
      .step(Step(function(next, options) {
        tests.foo = options.foo;
        next();
      }));
    easyb.trigger('test-task');
  });
  it('should assign default options to a step', function(done) {
    var tests = {};
    easyb.setExitFn(function(errcode) {
      assert.equal(tests.foo, 'bar');
      assert.equal(tests.spam, 'eggs');
      assert.equal(errcode, 0);
      done();
    });
    easyb.task('test-task')
      .step(Step(function(next) {
        next({ foo: 'bar' });
      }))
      .step(Step(function(next, options) {
        tests.foo = options.foo;
        tests.spam = options.spam;
        next();
      }), { foo: 'baz', spam: 'eggs'});
    easyb.trigger('test-task');
  });
  it('when an error is thrown, and no step or task error function is set, the task should still exit', function(done) {
    var tests = {};
    easyb.setExitFn(function(errcode) {
      assert.equal(errcode, 0);
      assert.equal(tests.testMessage, 1);
      done();
    });
    var errorTest = function(e) {
      tests.testMessage = e.testMessage;
    };
    easyb.task('test-task')
      .step(Step(function(next) {
        var e = new Error("Error test");
        e.testMessage = 1;
        throw e;
      }))
      .error(errorTest);
    easyb.trigger('test-task');
  });
  it('when an error is thrown, it should trigger a step error if it is assigned', function(done) {
    var tests = {};
    easyb.setExitFn(function(errcode) {
      assert.equal(errcode, 0);
      assert.equal(tests.testMessage, 1);
      done();
    });
    var errorTest = function(e) {
      tests.testMessage = e.testMessage;
    };
    var wrongError = function(e) {
      throw new Error("Wrong error function called");
    };
    easyb.task('test-task')
      .step(Step(function(next) {
        var e = new Error("Error test");
        e.testMessage = 1;
        throw e;
      }).error(errorTest)).error(wrongError);
    easyb.trigger('test-task');
  });
  it('when an error is thrown, it should trigger a task error if it is assigned, and no step error is assigned', function(done) {
    var tests = {};
    easyb.setExitFn(function(errcode) {
      assert.equal(errcode, 0);
      assert.equal(tests.testMessage, 1);
      done();
    });
    var errorTest = function(e) {
      tests.testMessage = e.testMessage;
    };
    easyb.task('test-task')
      .step(Step(function(next) {
        var e = new Error("Error test");
        e.testMessage = 1;
        throw e;
      }))
      .error(errorTest);
    easyb.trigger('test-task');
  });
  it('when an error is passed to next, it should trigger a step error if it is assigned', function(done) {
    var tests = {};
    easyb.setExitFn(function(errcode) {
      assert.equal(errcode, 0);
      assert.equal(tests.testMessage, 1);
      done();
    });
    var errorTest = function(e) {
      tests.testMessage = e.testMessage;
    };
    easyb.task('test-task')
      .step(Step(function(next) {
        var e = new Error("Error test");
        e.testMessage = 1;
        next(easyb.ERROR, e);
      }).error(errorTest));
    easyb.trigger('test-task');
  });
});
