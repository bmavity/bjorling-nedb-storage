var storage = require('../')
	, fs = require('fs')
	, errors = require('../errors')
	, eb = require('./eb')

describe('bjorling nedb projection storage, when properly initialized', function() {
	var dbPath = './testdb/projectionInitialization1.db'
		, projectionStorage = null

	before(function(done) {
		projectionStorage = storage(dbPath)('aProjection', 'aKey')
		process.nextTick(done)
	})

	after(function(done) {
		fs.unlink(dbPath, function(err) {
			done()
		})
	})

	it('should create a Projection instance', function() {
		projectionStorage.should.not.be.null
	})
})
/*
describe('bjorling nedb projection storage, when properly initialized for the first time', function() {
	var dbPath = './testdb/projectionInitialization2.db'
		, currentStatus

	before(function(done) {
		var projection = storage(dbPath)('aProjection', 'aKey')
		projection.getStatus(function(err, status) {
			if(err) return done(err)

			currentStatus = status
			done(null)
		})
	})

	after(function(done) {
		fs.unlink(dbPath, function(err) {
			done()
		})
	})

	it('should have last processed event of 0', function() {
		currentStatus.lastProcessedEvent.should.equal(0)
	})
})
*/
describe('bjorling nedb projection storage, when initialized without a projection name', function() {
	var dbPath = './testdb/projectionInitialization3.db'
		, thrownError

	before(function(done) {
		try {
			storage(dbPath)(null, 'key') 
		}
		catch (err) {
			thrownError = err
			done()
		}
	})

	after(function(done) {
		fs.unlink(dbPath, function(err) {
			done()
		})
	})

	it('should cause an ProjectionInitializationError', function() {
		thrownError.should.be.instanceOf(errors.ProjectionInitializationError)
	})

	it('should cause an error message indicating the problem', function() {
		thrownError.message.should.include('projection name')
	})
})

describe('bjorling nedb projection storage, when initialized without a key', function() {
	var dbPath = './testdb/projectionInitialization4.db'
		, thrownError

	before(function(done) {
		try {
			storage(dbPath)('projection', null) 
		}
		catch (err) {
			thrownError = err
			setTimeout(done, 100)
		}
	})

	after(function(done) {
		fs.unlink(dbPath, function(err) {
			done()
		})
	})

	it('should cause an ProjectionInitializationError', function() {
		thrownError.should.be.instanceOf(errors.ProjectionInitializationError)
	})

	it('should cause an error message indicating the problem', function() {
		thrownError.message.should.include('key')
	})
})
