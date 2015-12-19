'use strict';
var assert = require('chai').assert;
var exec = require('child_process').exec;
var path = require('path');
var fs = require('fs');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');
var rootDir = path.join(__dirname, '../');
var tempDir = path.join(__dirname, 'temp')
var localVersion = require(path.join(rootDir, 'package.json')).version;
var unusedDir = path.join(__dirname, 'unused');
var simpleTaskConfigFixture = path.join(__dirname, 'fixtures/easyb-simple-tasks.js');
var mockEasybFixture = path.join(__dirname, 'fixtures/easyb-mock.js');
var ebBin = path.join(rootDir, "bin", "easyb.js");
var mockVersion = "99.0.0";
var mockModulePath = path.join(tempDir, 'node_modules', 'easyb');
var mockPackagePath = path.join(mockModulePath, 'package.json');

function cpSync(inFile, outFile) {
  fs.writeFileSync(outFile, fs.readFileSync(inFile));
  return null;
}

function ebcmd(str) {
  return ebBin + " " + str;
}

function create() {
  try {
    fs.mkdirSync(tempDir);
    fs.mkdirSync(unusedDir);
    cpSync(simpleTaskConfigFixture, path.join(tempDir, 'easyb.js'));
  } catch(ignore) {}
}

function cleanup() {
  rimraf.sync(tempDir);
  rimraf.sync(unusedDir);
}

function createLocalModuleMocks() {
  var pack = require(path.join(__dirname, 'fixtures/easyb-mock-package'));
  mkdirp.sync(mockModulePath);
  cpSync(mockEasybFixture, path.join(mockModulePath, 'index.js'));
  pack.version = mockVersion;
  fs.writeFileSync(mockPackagePath, JSON.stringify(pack), 'utf8');
}

function cleanupLocalModuleMocks() {
  fs.unlinkSync(mockPackagePath);
  rimraf.sync(mockModulePath);
}

describe('cli', function() {
  before(function beforeCli(done){
    create();
    done();
  });
  after(function afterCli(done){
    cleanup();
    done();
  });
  it('should error, when running a task without a local config', function(done) {
    exec(ebcmd("task1"), { cwd: path.resolve(unusedDir) }, function execCb(err, stdout, stderr) {
      assert.isDefined(err.code);
      assert.equal(err.code, 1);
      done()
    });
  });
  it('should error silently, when running a task without a local config and --silent directive', function(done) {
    exec(ebcmd("task1 --silent"), { cwd: path.resolve(unusedDir) }, function execCb(err, stdout, stderr) {
      assert.isDefined(err.code);
      assert.equal(stdout.trim(), "");
      assert.equal(stderr.trim(), "");
      assert.equal(err.code, 1);
      done()
    });
  });
  it('should show help, when run without a local config', function(done) {
    exec(ebcmd("--help"), { cwd: path.resolve(unusedDir) }, function execCb(err, stdout, stderr) {
      assert.isNull(err);
      assert.isTrue(stdout.search(/No\slocal\sconfig\sfound/) > -1)
      assert.ok(stdout);
      done();
    });
  });
  it('should show task help, when run with a local config', function(done) {
    exec(ebcmd("--help"), { cwd: path.resolve(tempDir) }, function execCb(err, stdout, stderr) {
      assert.isNull(err);
      assert.ok(stdout);
      assert.equal(stdout.search(/No\slocal\sconfig\sfound/), -1)
      assert.isTrue(stdout.search(/Prints\sfoo/) > -1)
      done();
    });
  });
  it('should run a defined task', function(done) {
    exec(ebcmd("foo"), { cwd: path.resolve(tempDir) }, function execCb(err, stdout, stderr) {
      assert.isNull(err);
      assert.equal(stdout.split("\n")[1], "foo");
      done();
    });
  });
  it('should error when running an undefined task', function(done) {
    exec(ebcmd("undefined-task"), { cwd: path.resolve(tempDir) }, function execCb(err, stdout, stderr) {
      assert.isDefined(err.code);
      assert.equal(err.code, 1);
      done();
    });
  });
  describe("local easyb module loading", function() {
    before(function beforeModuleLoading(done) {
      createLocalModuleMocks();
      done();
    });
    after(function afterModuleLoading(done) {
      cleanupLocalModuleMocks();
      done();
    });
    it('should load the local copy of easyb to run the local config', function(done) {
      // The actual command sent doesn't matter here because the local version we are
      // trying to load will just output the mockVersion above no matter what is called.
      exec(ebcmd("ignore"), { cwd: path.resolve(tempDir) }, function execCb(err, stdout, stderr) {
        assert.isNull(err);
        assert.equal(stdout.split("\n")[1], mockVersion);
        done();
      });
    });
  })
});
