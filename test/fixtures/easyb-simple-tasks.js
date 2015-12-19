var easyb = require('../../');
var Step = easyb.Step;
var fooStep = Step(function(next) {
  console.log("foo")
  next();
})

easyb.task("foo", "Prints foo")
  .step(fooStep);
