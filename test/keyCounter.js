function keyCounter(db, cb) {
	var count = 0
	db.createKeyStream()
		.on('data', function() {
			console.log(arguments)
			count += 1
		})
		.on('end', function() {
			cb(null, count)
		})
		.on('error', cb)
}


module.exports = keyCounter