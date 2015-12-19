'use strict';
// # help
//
// Creates a nicely formatted help file, with a list of tasks and their
// descriptions if a local config file is found.
var chalk = require('chalk');
var repeat = require('./repeat');
var localVersion = require('./local-version');
var wordwrap = require('./wordwrap');
var findConfig = require('./find-config');
var loadLocal = require('./load-local');
var tildify = require('tildify');
var path = require('path');
// `COL_WIDTH` - How wide to make columns (for drawing single column rows).
var COL_WIDTH = 60;
// `COL_INDENT` How many spaces to indent columns.
var COL_INDENT = 2;
// `WRAP_LENGTH` - When to wrap text.
var WRAP_LENGTH = 70;
// `WRAP_LENGTH` - How much to indent text.
var WRAP_INDENT = 4;
// `CORNER_CHAR` - Which character to draw in the corners of rows.
var CORNER_CHAR = '-';
// `finalHelp` is used to store a cached version of the generated help
var finalHelp;
var l = [];

// The list of command line options, used by `makeCliHelp`
var cliOptions = [
  ['<task name> [<flags>]', 'Run a locally defined build task, e.g. "easyb build --development"'],
  ['-h, --help', 'Print this help.'],
  ['-s', '--silent', 'No console output.'],
  ['-v, --version', 'Print current version.']
];

// This ascii font was kind of a pain, we have to escape each
// backslash character. This is 'Graffiti' from
// http://patorjk.com/software/taag/.
l[0] = '                                ___.    ';
l[1] = '  ____  _____     ______ ___.__.\\_ |__  ';
l[2] = '_/ __ \\ \\__  \\   /  ___/<   |  | | __ \\ ';
l[3] = '\\  ___/  / __ \\_ \\___ \\  \\___  | | \\_\\ \\';
l[4] = ' \\___  >(____  //____  > / ____| |___  /';
l[5] = '     \\/      \\/      \\/  \\/          \\/ ';

// Hardcoded ranges for each character, used to specify
// individual colors for each character.
var ranges = {
  e: [0, 8],
  a: [8, 16],
  s: [16, 24],
  y: [24, 32],
  b: [32, 40]
};

var colors = {
  e: chalk.magenta,
  a: chalk.magenta,
  s: chalk.magenta,
  y: chalk.magenta,
  b: chalk.cyan
};

// Adds color to individual characters in the ascii font logo
function colorizer(accu, v) {
  var line = Object.keys(ranges).map(function lettersMap(letter) {
    var range = ranges[letter];
    return colors[letter](v.slice(range[0], range[1]));
  });
  accu.push(line.join(''));
  return accu;
}

// Draws a line.
//
// * `w` - (integer) How many columns of line to produce
// * `borderColor` - (function) usually the chalk function to call
// * `cornerChar` - (string) *optional* - the character to use for
// the leftmost and rightmost column of the line.
function makeBorder(w, borderColor, cornerChar) {
  var corner = cornerChar || CORNER_CHAR;
  return borderColor(corner + repeat('-', w - 2) + corner);
}

// `makeRow` actually takes an array that looks like
// `[[color1, textItem1], [color2, textItem2]]` for its first
// argument `textList`. This was to make it easier to get an accurate letter count
// while still having the option for color.
//
// Only two options are available, and both
// are boolean. `tr` means give it a top border, `br` means give it
// a bottom border.
function makeRow(textList, opts) {
  var ret = [];
  var borderColor = opts.borderColor || chalk.reset;

  var texts = textList.reduce(function rowReducer(accu, v) {
    accu.unstyled += v[1];
    accu.styled += chalk[v[0]](v[1]);
    return accu;
  }, {styled: '', unstyled: ''});

  if (opts.tr) {
    ret.push(makeBorder(COL_WIDTH, borderColor));
  }

  var colBorder = borderColor('|');
  var rightSpace = Math.max(COL_WIDTH - texts.unstyled.length - COL_INDENT - 2, 0);

  ret.push(colBorder + repeat(' ', COL_INDENT) + texts.styled + repeat(' ', rightSpace) + colBorder);

  if (opts.br) {
    ret.push(makeBorder(COL_WIDTH, borderColor));
  }
  return ret.join('\n');
}

// `wrap` - A wrapper for the `wordwrap` module. Constrains `txt`.
function wrap(txt) {
  return wordwrap(WRAP_LENGTH, WRAP_INDENT, txt);
}

// `makeCliHelp` - Formats a list that looks like `[['-e, --example', 'Prints an example']]`
function makeCliHelp(cmds) {
  return cmds.map(function addCliLine(v) {
    return wrap(v[0] + ': ' + v[1]);
  }).join('\n\n');
}

// `getHelp` colorizes and prepares the logo, searches
// for a local config, gathering tasks from if it exists,
// and
function getHelp() {
  var colorLines = l.reduce(colorizer, []);
  var logo = colorLines.join('\n');
  var mottoRow = makeRow([['reset', 'The low investment build tool.']], {br: true, tr: true});
  var versionRow = makeRow([['cyan', 'Version: '], ['green', localVersion]], {br: true});

  var localConfigPath = null;
  var configInfo = [];
  try {
    localConfigPath = findConfig();
  } catch (ignore) {}

  if (!localConfigPath) {
    configInfo.push(chalk.red('No local config found.'));
  } else {
    // Try to load the local version of easydb
    // Then try and load the local config file and grab the tasks
    try {
      var localEasyb = loadLocal(path.dirname(localConfigPath));
      var localConfig = require(localConfigPath);
      configInfo.push(chalk.green('Using config ') + chalk.cyan(tildify(localConfigPath)) + '\n');
      configInfo.push(chalk.bold('LOCAL TASKS'));
      var tasks = localEasyb.getTaskNamesAndDescriptions().map(function helpTaskMap(v) {
        console.log(v);
        return wrap(v.name + ' - ' + v.description);
      });
      if (tasks.length) {
        configInfo.push(tasks.join('\n\n'));
      }
    } catch (e) {
      console.log('Exception: ', e.stack);
      configInfo.push(chalk.red('Unable to load local config: ' + chalk.cyan(tildify(localConfigPath)) + '\n'));
    }
  }
  return [logo, mottoRow, versionRow, '\n', configInfo.join('\n'),
          chalk.bold('USAGE'), makeCliHelp(cliOptions), '\n'].join('\n');
}

// `print` is just a simple wrapper for outputting the generated help
function print() {
  console.log(getHelp());
  return null;
}

module.exports = {
  getHelp: getHelp,
  print: print
};
