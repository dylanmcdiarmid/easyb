'use strict';
// # mute console
//
// A sledehammer solution for quieting the console.
// Calling `muteConsole` or `unmuteConsole` will affect the global state.
var consoleCache;
var isMuted = false;
var consoleMethods = ['assert', 'dir', 'error', 'info', 'log', 'time', 'timeEnd', 'trace', 'warn'];

function noop() {}
function muteConsole() {
  if (isMuted) {
    return null;
  }
  consoleCache = {};
  consoleMethods.forEach(function noopConsoleMethods(v) {
    console[v] = noop;
  });
  return null;
}

function unmuteConsole() {
  if (!isMuted) {
    return null;
  }
  Object.keys(consoleCache).foreach(function restoreConsoleMethods(key) {
    console[key] = consoleCache[key];
  });
  return null;
}

module.exports = {
  muteConsole: muteConsole,
  unmuteConsole: unmuteConsole
};
