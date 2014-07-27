var storage = require('../')
	, fs = require('fs')
	, eb = require('./eb')

describe('bjorling nedb projection storage, when the key is a single value and the get parameter contains a value for the key', function() {
	var dbPath = './testdb/singleProjectionAccess1.db'
		, originalValue = {
				theKey: '552230234'
			, aVal: 'hiya'
			}
		, retrievedVal
		, projectionStorage

	before(function(done) {
		function completeGet(val) {
			retrievedVal = val
			done()
		}

		function performGetValue() {
	  	projectionStorage.get({
	  		theKey: '552230234'
	  	, anotherVal: 'part of the event'
	  	}, eb(done, completeGet))
		}

		function performSave(p) {
			projectionStorage = p
			projectionStorage.save(originalValue, eb(done, performGetValue))
		}
		
		performSave(storage(dbPath)('spec 1', 'theKey'))
	})

	after(function(done) {
		fs.unlink(dbPath, done)
	})

  it('should retrieve the proper state', function() {
  	retrievedVal.should.eql(originalValue)
  })
})

describe('bjorling nedb projection storage, when the key is an array and the get parameter contains a value for both elements of the key', function() {
	var dbPath = './testdb/singleProjectionAccess2.db'
		, originalValue = {
	  		keyPart1: '552230234'
	  	, keyPart2: 'ppuupp'
			, aVal: 'hiya'
			}
		, retrievedVal
		, projectionStorage

	before(function(done) {
		function completeGet(val) {
			retrievedVal = val
			done()
		}

		function performGetValue() {
	  	projectionStorage.get({
	  		keyPart1: '552230234'
	  	, keyPart2: 'ppuupp'
	  	, anotherVal: 'part of the event'
	  	}, eb(done, completeGet))
		}

		function performSave(p) {
			projectionStorage = p
			projectionStorage.save(originalValue, eb(done, performGetValue))
		}
		
		performSave(storage(dbPath)('spec 1', ['keyPart1', 'keyPart2']))
	})

	after(function(done) {
		fs.unlink(dbPath, done)
	})

  it('should retrieve the proper state', function() {
  	retrievedVal.should.eql(originalValue)
  })
})

describe('bjorling nedb projection storage, when the key is not found', function() {
	var dbPath = './testdb/singleProjectionAccess3.db'
		, originalValue = {
	  		aKey: 'keyval'
			, aVal: 'hiya'
			}
		, retrievedVal
		, projectionStorage

	before(function(done) {
		function completeGet(val) {
			retrievedVal = val
			done()
		}

		function performGetValue() {
	  	projectionStorage.get({
	  		aKey: 'keyVal2'
	  	, anotherVal: 'part of the event'
	  	}, eb(done, completeGet))
		}

		function performSave(p) {
			projectionStorage = p
			projectionStorage.save(originalValue, eb(done, performGetValue))
		}
		
		performSave(storage(dbPath)('spec 1', 'aKey'))
	})

	after(function(done) {
		fs.unlink(dbPath, done)
	})

  it('should result in a null value', function() {
  	(retrievedVal === null).should.be.true
  })
})

describe('bjorling nedb projection storage, when retrieving state with an event that does not contain a value for the key, but matches an index', function() {
	var dbPath = './testdb/singleProjectionAccess4.db'
		, val1 = {
				theKey: 'key1'
			, aVal: 'val 1'
			}
		, retrievedVal
		, projectionStorage


	before(function(done) {
		function completeGet(val) {
			retrievedVal = val
			done()
		}

		function performGetValue() {
			var evt1
	  	projectionStorage.get({
	  	  anotherVal: 'part of the event'
	  	, aVal: 'val 1'
	  	}, eb(done, completeGet))
		}

		projectionStorage = storage(dbPath)('proj 2', 'theKey')
		projectionStorage.addIndex('aVal', function() {
			projectionStorage.save(val1, eb(done, performGetValue))
		})
	})

	after(function(done) {
		fs.unlink(dbPath, done)
	})

  it('should allow retrieval of value by key', function() {
  	retrievedVal.should.eql(val1)
  })
})

describe('bjorling nedb projection storage, when there are multiple indexes and the get parameter contains a value for both indexes, but not a value for the key', function() {
	var dbPath = './testdb/singleProjectionAccess5.db'
		, faker = {
				theKey: 'key1'
			, indexPart1: 'billy'
			, indexPart2: 'the punk'
			}
		, real = {
				theKey: 'key2'
			, indexPart1: 'billy'
			, indexPart2: 'the kid'
			}
		, retrievedVal
		, projectionStorage


	before(function(done) {
		function completeGet(val) {
			retrievedVal = val
			done()
		}

		function performGetValue() {
			var evt1
	  	projectionStorage.get({
	  	  indexPart1: 'billy'
	  	, indexPart2: 'the kid'
	  	}, eb(done, completeGet))
		}

		projectionStorage = storage(dbPath)('proj 2', 'theKey')
		projectionStorage.addIndex('indexPart1', function() {
			projectionStorage.addIndex('indexPart2', function() {
				projectionStorage.save(real, eb(done, function() {
					projectionStorage.save(faker, eb(done, performGetValue))
				}))
			})
		})
	})

	after(function(done) {
		fs.unlink(dbPath, done)
	})

  it('should retrieve value that contains both matching index values', function() {
  	retrievedVal.should.eql(real)
  })
})

describe('bjorling nedb projection storage, when retrieving state with an event that does not contain a value for the key, but matches an index in an array', function() {
	var dbPath = './testdb/singleProjectionAccess6.db'
		, val1 = {
				theKey: 'key1'
			, aVal: ['val 1', 'val 3']
			}
		, retrievedVal
		, projectionStorage


	before(function(done) {
		function completeGet(val) {
			retrievedVal = val
			done()
		}

		function performGetValue() {
			var evt1
	  	projectionStorage.get({
	  	  anotherVal: 'part of the event'
	  	, aVal: 'val 3'
	  	}, eb(done, completeGet))
		}

		projectionStorage = storage(dbPath)('proj 2', 'theKey')
		projectionStorage.addIndex('aVal', function() {
			projectionStorage.save(val1, eb(done, performGetValue))
		})
	})

	after(function(done) {
		fs.unlink(dbPath, done)
	})

  it('should allow retrieval of value by key', function() {
  	retrievedVal.should.eql(val1)
  })
})
