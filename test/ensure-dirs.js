var assert = require('chai').assert;
var exec = require('child_process').exec;
var path = require('path');
var fs = require('fs');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');
var ensureDirs = require(path.join(__dirname, '../')).ensureDirs;

var tempDir = path.join(__dirname, 'temp');

var dir1 = path.join(tempDir, 'dir1');
var dir2 = path.join(tempDir, 'dir1/dir2');
var dir3 = path.join(tempDir, 'dir1/dir3');

var dirList = [dir3, dir2, dir1, dir3];

function dirsExist() {
  fs.statSync(dir1);
  fs.statSync(dir2);
  fs.statSync(dir3);
}


describe('changed', function() {
  describe('sync', function() {
    beforeEach(function(){
      rimraf.sync(tempDir);
    });
    it('should create directories', function(){
      ensureDirs.sync(dirList)
      dirsExist();
    });
  });
  describe('async', function() {
    beforeEach(function(){
      rimraf.sync(tempDir);
    });
    it('should create directories', function(done){
      ensureDirs(dirList, function(err) {
        assert.isNull(err);
        dirsExist();
        done();
      });
    });
  });
});
