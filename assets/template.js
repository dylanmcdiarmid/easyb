'use strict';
// # template
//
// This is some example code that aims to cover most of what a JavaScript build
// script needs.
//
// * watch for file changes when developing
// * sort different files into groups for specific processing
// * create file destinations
// * run a file through a command line tool and save the output or report the
// error
// * see if a file has been changed
var fs = require('fs');
var easyb = require('easyb');
var exec = require('child_process').exec;
var Step = easyb.Step;
var changed = easyb.changedSync;
var chokidar = require('chokidar');
var path = require('path');
var mkdirp = require('mkdirp');
var glob = require('glob');
var rimraf = require('rimraf');

var buildPath = path.join(__dirname, './build');
var projectPath = path.absolute('./');

var paths = {
  coffee: ['lib/**/*.coffee', 'index.coffee', '!lib/ignore-me.coffee'],
  stylus: ['css/**/*.styl']
};

function ensureOutputDirs(files) {
  easyb.ensureDirsSync(files.map(function fileMap(v) {
    path.dirname(v.dest);
  }));
  return null;
}

// Takes an array of file paths, and returns an array of objects with
// origin and destination.
function getDestinations(fileList) {
  var ret = [];
  fileList.map(function (v) {
    return {origin: v, dest: path.join(buildPath, v.replace(projectPath, ''))};
  });
  return ret;
}

function writeFile(text, dest) {
  mkdirp.sync(path.dirname(dest));
  fs.writeFileSync(dest, text);
  return null;
}

var watchFiles = Step(function () {
  var coffeeWatcher = chokidar.watch(paths.coffee);
  var buildCoffeeTrigger = function (filePath) {
    easyb.triggerTask('build-coffee', {filePath: filePath});
  };
  coffeeWatcher
    .on('add', buildCoffeeTrigger)
    .on('change', buildCoffeeTrigger)
    .on('remove', function (filePath) {
      easyb.triggerTask('clean', {filePath: filePath});
    });
});

function makeExtensionFilter(extensionList) {
  return function filterExtensions(v) {
    return extensionList.indexOf(path.extname(v)) > -1;
  };
}
var clean = Step(function clean(next, opts) {
  rimraf.sync(buildPath);
  next(opts);
});

var shouldCompile = Step(function shouldCompile(next, opts) {
  var files;
  var compileList = [];
  if (!opts) {
    opts = {};
  }
  if (opts.filePath) {
    files = [opts.filePath];
  } else {
    files = glob.sync(paths.coffee).concat(glob.sync(paths.stylus));
  }
  var fileList = getDestinations(files);
  fileList.forEach(function (v) {
    if (changed(v.origin, v.dest)) {
      compileList.push(v);
    }
  });
  if (!compileList.length) {
    next(easyb.HALT);
  } else {
    next({files: compileList});
  }
});

function compileError(err) {
  var logOutput = [err.message];
  if (err.fileName) {
    logOutput.push('Error compiling file: ' + err.fileName);
  }
  if (err.details) {
    logOutput.push(err.details);
  }
  console.log(logOutput.join('\n'));
}

// You may prefer to use a library programatically when possible instead of
// using the command line (and I usually do), but for simplicity in this
// example, both the coffescript compilation and the stylus compilation below
// use `exec`.
var compileCoffee = Step(function (next, opts) {
  if (!opts.files || !opts.files.length) {
    next(opts);
  }
  var files = opts.files.filter(makeExtensionFilter(['coffee']));
  ensureOutputDirs(files);
  var compileCount = files.length;
  var itemsProcessed = 0;
  var maybeDone = function () {
    if (itemsProcessed >= compileCount) {
      return next(opts);
    }
  };
  files.forEach(function (v) {
    // Command format: coffee -c -o /out/dir /in/dir/file.coffee
    exec('coffee -c -o ' + path.dirname(v.dest) + ' ' + v.origin, function compileCoffeeCb(err, stdout, stderr) {
      itemsProcessed += 1;
      if (stderr) {
        console.log('Error compiling ' + v.origin, stderr);
      } else {
        console.log('Compiled: ' + v.origin);
      }
      maybeDone();
    });
  });
});

compileCoffee.error(compileError);

var compileStylus = Step(function (next, opts) {
  if (!opts.files || !opts.files.length) {
    next(opts);
  }
  var files = opts.files.filter(makeExtensionFilter(['styl']));
  ensureOutputDirs(files);
  var compileCount = files.length;
  var itemsProcessed = 0;
  var maybeDone = function () {
    if (itemsProcessed >= compileCount) {
      return next(opts);
    }
  };
  files.forEach(function (v) {
    // Command format: coffee -c -o /out/dir /in/dir/file.coffee
    exec('stylus -c -o ' + path.dirname(v.dest) + ' ' + v.origin, function compileStylusCb(err, stdout, stderr) {
      itemsProcessed += 1;
      if (stderr) {
        console.log('Error compiling ' + v.origin, stderr);
      } else {
        console.log('Compiled: ' + v.origin);
      }
      maybeDone();
    });
  });
});

compileStylus.error(compileError);

easyb.task('watch', 'Watches files for changes and build them when found.')
  .step(watchFiles);
easyb.task('build-coffee', 'Builds a single or all coffee files.')
  .step(shouldCompile)
  .step(compileCoffee);
easyb.task('build-stylus', 'Builds a single or all stylus files.')
  .step(shouldCompile)
  .step(compileStylus);
easyb.task('build', 'Builds all files')
  .step(shouldCompile)
  .step(compileCoffee)
  .step(compileStylus);
easyb.task('clean', 'Removes the build directory')
  .step(clean);
