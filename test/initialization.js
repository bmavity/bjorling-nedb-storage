var storage = require('../')
	, fs = require('fs')
	, errors = require('../errors')
	, eb = require('./eb')
	, Datastore = require('nedb')

require('./shouldExtensions')

describe('bjorling nedb storage, when initialized with a valid location, and the location does not contain an existing nedb instance', function() {
	var dbPath = './testdb/initialization1.db'

	before(function(done) {
		storage(dbPath)
		setTimeout(done, 250)
	})

	after(function(done) {
		fs.unlink(dbPath, done)
	})

	it('should create a nedb instance in that location', function() {
		fs.existsSync(dbPath).should.be.true
	})
})

describe('bjorling nedb storage, when initialized with a valid location, and the location contains an existing nedb instance', function() {
	var dbPath = './testdb/initialization2.db'
		, initialValue = { val: 1 }
		, getResult

	function putInitialValue(cb) {
		var initialDb = new Datastore({
					filename: dbPath
				, autoload: true
				})
		initialDb.update(initialValue, initialValue, { upsert: true }, cb)
	}

	before(function(done) {
		putInitialValue(function(err) {
			if(err) return done(err)

			var s = storage(dbPath)('valid', 'val')
			s.get(initialValue, function(err2, result) {
				if(err2) return done(err2)


				getResult = result
				done()
			})
		})
	})

	after(function(done) {
		fs.unlink(dbPath, done)
	})

	it('should use the existing db', function() {
		getResult.should.eql(initialValue)
	})
})

describe('bjorling nedb storage, when initialized without a location', function() {
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
