#!/usr/bin/env node
'use strict';
var mkdirp = require('mkdirp');
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var rootDir = path.join(__dirname, '../');
var doccoConfigPath = path.join(rootDir, 'docco.json');
var doccoPath = path.resolve(rootDir, 'node_modules/docco/bin/docco');
var docPath = path.join(rootDir, 'docs');
var libPath = path.join(rootDir, 'lib');
var binPath = path.join(rootDir, 'bin');
var assetsPath = path.join(rootDir, 'assets');
var libDocPath = path.join(docPath, 'lib');
var binDocPath = path.join(docPath, 'bin');
var assetsDocPath = path.join(docPath, 'assets');
mkdirp.sync(libDocPath);
mkdirp.sync(binPath);
mkdirp.sync(assetsPath);
var libDocFiles = fs.readdirSync(libPath)
  .filter(function (v) {
    return (path.extname(v) === '.js');
  })
  .map(function (v) {
    return path.join(libPath, v);
});
var binFiles = [path.join(binPath, 'easyb.js')];
var rootFiles = [path.join(rootDir, 'index.js')];
var assetFiles = [path.join(assetsPath, 'template.js')];

function execDocco(files, dir, cb) {
  var cmd = doccoPath + " " + files.join(" ") + " -m " + doccoConfigPath + " -o " + dir;
  exec(cmd, function(err, stdin, stderr) {
    if (err) {
      console.log("Error:", err);
    }
    if (stdin) {
      console.log(stdin);
    }
    if (stderr) {
      console.log("Error:", stderr);
    }
    cb();
  });
}

execDocco(libDocFiles, libDocPath, function() {
  execDocco(binFiles, binDocPath, function() {
    execDocco(assetFiles, assetsDocPath, function() {
      execDocco(rootFiles, docPath, function() {
        process.exit(0);
      })
    })
  })
});
process.stdin.resume();
