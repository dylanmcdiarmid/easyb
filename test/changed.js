'use strict';
var assert = require('chai').assert;
var exec = require('child_process').exec;
var path = require('path');
var fs = require('fs');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');
var changed = require('../').changed;

var tempDir = path.join(__dirname, 'temp');
var destDir = path.join(tempDir, 'dest');
var originDir = path.join(tempDir, 'origin');
var destPath = path.join(destDir, 'dest.txt');
var originPath = path.join(originDir, 'origin.txt');
var fileCreationDelay = 1000;

function makeOrigin() {
  fs.writeFileSync(originPath, "foo");
}
function makeDest() {
  fs.writeFileSync(destPath, "foo");
}
function cleanup() {
  rimraf.sync(tempDir);
}

describe('changed', function() {
  describe('sync', function() {
    beforeEach(function(){
      rimraf.sync(tempDir);
      mkdirp.sync(destDir);
      mkdirp.sync(originDir);
    });
    after(function() {
      cleanup();
    });
    it('should report change as true when comparing between origin and non-existent file', function() {
      makeOrigin();
      assert.isTrue(changed.sync(originPath, destPath));
    });
    it('should report change as true when comparing between old dest file and new origin file', function(done) {
      makeDest();
      setTimeout(function() {
        makeOrigin();
        assert.isTrue(changed.sync(originPath, destPath));
        done();
      }, fileCreationDelay);
    });
    it('should report change as false when comparing between new dest file and old origin file', function (done){
      makeOrigin();
      setTimeout(function() {
        makeDest();
        assert.isFalse(changed.sync(originPath, destPath));
        done();
      }, fileCreationDelay);
    });
  });

  describe('async', function() {
    beforeEach(function(){
      rimraf.sync(tempDir);
      mkdirp.sync(destDir);
      mkdirp.sync(originDir);
    });
    after(function() {
      cleanup();
    });
    it('should report change as true when comparing between origin and non-existent file', function(done) {
      makeOrigin();
      changed(originPath, destPath, function(err, result) {
        assert.isNull(err);
        assert.isTrue(result);
        done();
      });
    });
    it('should report change as true when comparing between old dest file and new origin file', function(done) {
      makeDest();
      setTimeout(function() {
        makeOrigin();
        changed(originPath, destPath, function(err, result) {
          assert.isNull(err);
          assert.isTrue(result);
          done();
        });
      }, fileCreationDelay);
    });
    it('should report change as false when comparing between new dest file and old origin file', function (){
      makeOrigin();
      makeDest();
      changed(originPath, destPath, function() {
        assert.isNull(err);
        assert.isFalse(result);
        done();
      });
    });
  });
});
