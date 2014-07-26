return
var storage = require('../')
	, errors = require('../errors')
	, dbPath = './testdb/projectionInitialization'
	, eb = require('./eb')
	, level = require('levelup')
	, sub = require('level-sublevel')

describe('bjorling level projection storage, when properly initialized', function() {
	var db
		, projectionStorage = null

	before(function(done) {
		var s = storage(dbPath)
		db = s._db
		s('aProjection', 'aKey', eb(done, function(p) {
			projectionStorage = p
			done()
		}))
	})

	after(function(done) {
		db.close(function() {
			leveldown.destroy(dbPath, done)
		})
	})

	it('should create a Projection instance', function() {
		projectionStorage.should.not.be.null
	})
})

describe('bjorling level projection storage, when properly initialized for the first time', function() {
	var db
		, __bjorling
		, bjorlingEntry = null

	function getBjorling(done) {
		db = sub(level(dbPath))
		__bjorling = db.sublevel('__bjorling')
		__bjorling.get('aProjection', function(err, result) {
			if(err) return done(err)
			bjorlingEntry = result
			done()
		})
	}

	before(function(done) {
		var s = storage(dbPath)
		s('aProjection', 'aKey', function() {
			s._db.close(function(err) {
				if(err) return done(err)
				getBjorling(done)
			})
		})
	})

	after(function(done) {
		db.close(function() {
			leveldown.destroy(dbPath, done)
		})
	})

	it('should create an entry in __bjorling', function() {
		bjorlingEntry.should.not.be.null
	})
})

describe('bjorling level projection storage, when initialized without a projection name', function() {
	var db
		, thrownError

	before(function(done) {
		s = storage(dbPath)
		db = s._db
		s(null, 'key', function(err, p) {
			thrownError = err
			done()
		})
	})

	after(function(done) {
		db.close(function() {
			leveldown.destroy(dbPath, done)
		})
	})

	it('should cause an ProjectionInitializationError', function() {
		thrownError.should.be.instanceOf(errors.ProjectionInitializationError)
	})

	it('should cause an error message indicating the problem', function() {
		thrownError.message.should.include('projection name')
	})
})

describe('bjorling level projection storage, when initialized without a key', function() {
	var db
		, thrownError

	before(function(done) {
		s = storage(dbPath)
		db = s._db
		s('projection', null, function(err, p) {
			thrownError = err
			done()
		})
	})

	after(function(done) {
		db.close(function() {
			leveldown.destroy(dbPath, done)
		})
	})

	it('should cause an ProjectionInitializationError', function() {
		thrownError.should.be.instanceOf(errors.ProjectionInitializationError)
	})

	it('should cause an error message indicating the problem', function() {
		thrownError.message.should.include('key')
	})
})
