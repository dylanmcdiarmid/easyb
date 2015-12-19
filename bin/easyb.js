#!/usr/bin/env node
'use strict';
// # easyb bin
//
// This script will normally be run from a globally installed version,
// and try to load a project local version and config. It also handles
// command line arguments, but will hand off to `easyb#start` when
// running a task.
var tildify = require('tildify');
var log = require('../lib/log');
var colors = require('../lib/colors');
var fail = require('../lib/fail');
var muteConsole = require('../lib/mute-console').muteConsole;
var minimist = require('minimist');
var path = require('path');
var semver = require('semver');
var fs = require('fs');
var findConfig = require('../lib/find-config');
var loadLocal = require('../lib/load-local');
var formatException = require('../lib/format-exception');
var cliPackage = require('../package');
var configFileName = 'easyb.js';
var currentVersion = require('../package.json').version;

var configPath;
var localEasyb;
var localVersion;

// Handle global arguments
//
// * `--version, -v` - Print the version of the global file.
// * `--help, -h` - Show help (also the default when no tasks are called)
// * --silent, -s` - Silence output
var aliases = {
  h: 'help',
  v: 'version',
  s: 'silent'
};
var booleanOptions = ['h', 'help', 'v', 'version', 's', 'silent'];

var argv = minimist(process.argv.slice(2), {alias: aliases, boolean: booleanOptions});

// `muteConsole` takes a sledgehammer approach to silencing console output.
if (argv.silent) {
  muteConsole();
}

// If there are no tasks specified, check to see if --version
// has been passed. If it hasn't, show help and exit.
if (argv._.length === 0) {
  if (argv.version) {
    log.log(currentVersion);
    process.exit(0);
  } else {
    var help = require('../lib/help');
    help.print();
    process.exit(0);
  }
}

// Find the local config file
try {
  configPath = findConfig();
} catch (e) {
  if (e.formattedMessage) {
    log.fatal(e.formattedMessage);
  } else {
    log.fatal(colors.fatal('Unexpected error while searching for config file.'));
    log.fatal(formatException(e));
  }
  fail();
}

log.log(colors.success('Using config: ') + colors.file(tildify(configPath)));

// Switch to the directory
process.chdir(path.dirname(configPath));

// Load local version of easyb
try {
  localEasyb = loadLocal();
} catch (e) {
  log.fatal(colors.fatal('Error loading local version of easyb. To run easyb in a project, install a local version: ' +
            colors.normal('npm install --save-dev easyb')));
  log.fatal(formatException(e));
  fail();
}

// Ensure the cli version isn't newer than the local version
if (semver.gt(cliPackage.version, localEasyb.version)) {
  log.fatal(colors.fatal('Version mismatch between local version') +
            colors.normal(localEasyb.version) +
            colors.fatal(' and global version ') +
            colors.normal(cliPackage.version));
  fail();
}

// Gather the rest of the command line arguments and pass them as arguments to whatever task is being called
// We have to reparse the arguments so the aliases for the global tool don't interfere with task arguments
argv = minimist(process.argv.slice(2));
var options = {
  task: argv._[0],
  silent: argv.silent,
  argv: {_: argv._.slice(1)}
};

for (var k in argv) {
  if (k === '_' || k === 's' || k === 'silent') {
    continue;
  }
  options.argv[k] = argv[k];
}

localEasyb.start(configPath, options);
