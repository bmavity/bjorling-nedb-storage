return

var storage = require('../')
	, dbPath = './testdb/reset'
	, eb = require('./eb')
	, counter = require('./keyCounter')
	, fs = require('fs')

describe('bjorling level projection storage, when reset', function() {
	var db
		, originalValue = {
				theKey: '552230234'
			, aVal: 'hiya'
			}
		, retrievedCount
		, projectionStorage

	before(function(done) {
		function completeCount(count) {
			retrievedCount = count
			done()
		}

		function getKeyCount() {
			counter(projectionStorage._db, eb(done, completeCount))
		}

		function resetStorage() {
			projectionStorage.reset(getKeyCount)
		}

		function performSave(p) {
			projectionStorage = p
			projectionStorage.save(originalValue, eb(done, resetStorage))
		}
		
		var s = storage(dbPath)
		db = s._db
		s('spec 1', 'theKey', eb(done, performSave))
	})

	after(function(done) {
		return done()
		db.close(function(err) {
			if(err) done()
			leveldown.destroy(dbPath, done)
		})
	})

  it('should remove all keys for projection, but not bjorling entry', function() {
  	retrievedCount.should.eql(0)
  })
})
