function errback(eb, cb) {
	return function(err, val) {
		if(err) return eb(err)
		if(cb) cb(val)
	}
}

module.exports = errback
