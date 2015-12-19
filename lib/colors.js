'use strict';
// # colors
//
// Just some shortcuts to chalk colors, organized by usage.
var chalk = require('chalk');

var Colors = {
  fatal: chalk.red,
  error: chalk.red,
  file: chalk.cyan,
  log: chalk.reset,
  success: chalk.green,
  title: chalk.magenta,
  normal: chalk.reset,
  highlight: chalk.bold
};

module.exports = Colors;
