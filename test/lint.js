'use strict';
var assert = require('chai').assert;
var fs = require('fs');
var path = require('path');
var glob = require('glob');
var jshintOpts = JSON.parse(fs.readFileSync(path.join(__dirname, '../.jshintrc')).toString());
var jshint = require('jshint');
var jscsOpts = JSON.parse(fs.readFileSync(path.join(__dirname, '../.jscsrc')).toString());
var Jscs = require('jscs');
var jscs = new Jscs();
jscs.registerDefaultRules();
jscs.configure(jscsOpts);
var baseDir = path.join(__dirname, '../');
var lintPaths = ['lib/**/*.js', 'index.js', 'bin/**/*.js', 'assets/**/*.js'];
var lintTargets = lintPaths.reduce(function(accu, v) {
  glob.sync(path.join(baseDir, v)).forEach(function(p) {
    accu.push(p);
  });
  return accu;
}, []);
var lintTargetMap = lintTargets.reduce(function(accu, filepath) {
  accu[filepath] = fs.readFileSync(filepath).toString();
  return accu;
}, {});


function eachSource(fn) {
  lintTargets.forEach(function(filename) {
    return fn(lintTargetMap[filename], filename);
  });
}

describe('lint', function() {
  it('should not have any errors', function() {
    eachSource(function(src, filename) {
      var errors = jscs.checkString(src).getErrorList();
      try {
        assert.equal(errors.length, 0);
      } catch (e) {
        throw new Error(path.basename(filename) + " failed jscs with " +
                       errors.length + " errors.");
      }
    });
  });
});

describe('hint', function() {
  it('should not have any errors', function() {
    eachSource(function(src, filename) {
      jshint.JSHINT(src, jshintOpts);
      try {
        assert.equal(jshint.JSHINT.errors.length, 0);
      } catch (e) {
        throw new Error(path.basename(filename) + " failed jshint with " +
                       jshint.JSHINT.errors.length + " errors.");
      }
    });
  });
});
