var storage = require('../')
	, dbPath = './testdb/reset.db'
	, eb = require('./eb')
	, fs = require('fs')

describe('bjorling nedb projection storage, when reset', function() {
	var originalValue = {
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
			projectionStorage._db.count({}, eb(done, completeCount))
		}

		function resetStorage() {
			projectionStorage.reset(getKeyCount)
		}

		function performSave(p) {
			projectionStorage = p
			projectionStorage.save(originalValue, eb(done, resetStorage))
		}
		
		performSave(storage(dbPath)('spec 1', 'theKey'))
	})

	after(function(done) {
		fs.unlink(dbPath, done)
	})

  it('should remove all keys for projection, but not bjorling entry', function() {
  	retrievedCount.should.eql(0)
  })
})
