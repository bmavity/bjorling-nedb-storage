return 
var storage = require('../')
	, errors = require('../errors')
	, dbPath = './testdb/initialization'
	, eb = require('./eb')
require('./shouldExtensions')

describe('bjorling level storage, when initialized with a valid location, and the location does not contain an existing leveldb instance', function() {
	var db = null

	before(function(done) {
		var s = storage(dbPath, true)

		function openDb() {
			level(dbPath, { createIfMissing: false }, function(err, newdb) {
				if(err) return done(err)
				db = newdb
				done()
			})
		}

		s._db.on('ready', function() {
			s._db.close(openDb)
		})
	})

	after(function(done) {
		db.close(function() {
			leveldown.destroy(dbPath, done)
		})
	})

	it('should create a leveldb instance in that location', function() {
		db.should.not.be.null
	})
})

describe('bjorling level storage, when initialized with a valid location, and the location contains an existing leveldb instance', function() {
	var db = null
		, initialValue = { val: 1 }
		, getResult

	function putInitialValue(cb) {
		level(dbPath, { valueEncoding: 'json' }, function(err, initialDb) {
			if(err) return cb(err)
			initialDb.put('key1', initialValue)
			initialDb.close(cb)
		})
	}

	function getInitialValue(cb) {
		level(dbPath, { valueEncoding: 'json' }, function(err, currentDb) {
			if(err) return cb(err)
			currentDb.get('key1', function(err, result) {
				if(err) return cb(err)
				currentDb.close(function(err) {
					if(err) return cb(err)
					cb(null, result)
				})
			})
		})
	}

	before(function(done) {
		putInitialValue(function(err) {
			if(err) return done(err)

			var s = storage(dbPath, true)

			s._db.on('ready', function() {
				s._db.close(function(err) {
					if(err) return done(err)
					getInitialValue(function(err, result) {
						if(err) return done(err)
						getResult = result
						done()
					})
				})
			})
		})
	})

	after(function(done) {
		leveldown.destroy(dbPath, done)
	})

	it('should use the existing db', function() {
		getResult.should.eql(initialValue)
	})
})

describe('bjorling level storage, when initialized without a location', function() {
	var thrownError

	before(function() {
		try {
			storage(null, 'theKey')
		}
		catch(ex) {
			thrownError = ex
		}
	})

	it('should cause an InitializationError', function() {
		thrownError.should.be.instanceOf(errors.InitializationError)
	})

	it('should cause an error message indicating the problem', function() {
		thrownError.message.should.include('location')
	})
})
