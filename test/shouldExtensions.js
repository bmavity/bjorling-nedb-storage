var Assertion = require('should').Assertion

Assertion.prototype.aFunction = function() {
  var isFunction = Object.prototype.toString.call(this.obj) == '[object Function]'
  this.assert(
  	isFunction
	, function() { return 'expected ' + this.inspect + ' to be a function' }
	, function() { return 'expected ' + this.inspect + ' to not be a function' }
	)

  return this;
};