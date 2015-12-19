// This mock is used to test if the local version of easyb is being
// loaded instead of whichever version was used to call the cli
var localVersion = require("./package.json").version;
module.exports = {
  start: function() {
    console.log(localVersion);
    process.exit(0);
  },
  version: localVersion
}
