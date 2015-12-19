'use strict';
var repeat = require('./repeat');
// # word wrap
//
// Wraps line length for nice console output.
//
// Adapted and simplified from https://github.com/substack/node-wordwrap
//
// Probably not very robust.
//
// * `len` - (int) the maximum length of the line
// * `indent` - (int) how many characters to indent each line
// * `text` - (string) the string to wrap
//
function wordwrap(len, indent, text) {
  var re = /(\S+\s+)/;
  var chunks = text.toString().split(re);
  var indentStr = '';
  indent = indent ? indent : 0;
  if (indent) {
    indentStr = repeat(' ', indent);
  } else {
    indent = 0;
  }

  return chunks.reduce(function (lines, rawChunk) {
    if (rawChunk === '') {
      return lines;
    }
    var chunk = rawChunk.replace(/\t/g, '    ');
    function indentAndTrim(c) {
      lines.push(indentStr + c.replace(/^\s+/, ''));
    }

    var i = lines.length - 1;
    if (lines[i].length + chunk.length > (len - indent)) {
      lines[i] = lines[i].replace(/\s+$/, '');
      chunk.split(/\n/).forEach(indentAndTrim);
    } else if (chunk.match(/\n/)) {
      var xs = chunk.split(/\n/);
      lines[i] += xs.shift();
      xs.forEach(indentAndTrim);
    } else {
      lines[i] += chunk;
    }

    return lines;
  }, [indentStr]).join('\n');
}

module.exports = wordwrap;
