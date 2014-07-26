var storage = require('../')
	, bjorling = require('bjorling')
	, fs = require('fs')
	, dbPath = './testdb/bjorlingIntegration.db'
	, eb = require('./eb')

describe('bjorling storage integration, when retrieving projection state by id', function() {
	var state

	before(function(done) {
		var s = storage(dbPath + '1')
			, b = bjorling(__filename, {
					storage: s
				, key: 'storageId'
				})

		b.when({
			'$new': function(e) {
				return {
					storageId: e.storageId
				, count: 0
				, ids: []
				}
			}
		, 'FirstEvent': function(s, e) {
				s.count += 1
				s.ids.push(e.eventId)
			}
		, 'SecondEvent': function(s, e) {
				s.count += 2
				s.ids.push(e.eventId)
			}
		})

		function getEntry() {
			b.get('abcdef', function(err, val) {
				if(err) return done(err)
				state = val
				done()
			})
		}

		function addEvent(evt, cb) {
			b.processEvent(evt, cb)
		}

		setImmediate(function() {
			addEvent({
				__type: 'SecondEvent'
			, data: {
					storageId: 'abcdef'
				, eventId: 1
				}
			}, function() {
				addEvent({
					__type: 'FirstEvent'
				, data: {
						storageId: 'abcdef'
					, eventId: 3
					}
				}, getEntry)
			})
		})
	})

	after(function(done) {
		fs.unlink(dbPath + '1', done)
	})

  it('should have the proper count', function() {
  	state.count.should.equal(3)
  })

  it('should contain the first event id', function() {
  	state.ids.should.include(3)
  })

  it('should contain the second event id', function() {
  	state.ids.should.include(1)
  })
})

describe('bjorling storage integration, when retrieving projection state by an index', function() {
	var state

	before(function(done) {
		var s = storage(dbPath + '2')
			, b = bjorling(__filename, {
					storage: s
				, key: 'storageId'
				})
		
		b.addIndex('lockerId')
		b.when({
			'$new': function(e) {
				return {
					storageId: e.storageId
				, count: 0
				, ids: []
				}
			}
		, 'FirstEvent': function(s, e) {
				s.count += 1
				s.ids.push(e.eventId)
			}
		, 'SecondEvent': function(s, e) {
				s.count += 2
				s.lockerId = e.lockerId
				s.ids.push(e.eventId)
			}
		, 'ThirdEvent': function(s, e) {
				s.count += 3
				s.ids = []
			}
		})

		function getEntry() {
			b.get({ lockerId: 178 }, function(err, val) {
				if(err) return done(err)
				state = val
				done()
			})
		}

		function addEvent(evt, cb) {
			b.processEvent(evt, cb)
		}

		setImmediate(function() {
			var e1 = {
						__type: 'FirstEvent'
					, data: {
							storageId: 'abcdef'
						, eventId: 3
						}
					}
				, e2 = {
						__type: 'SecondEvent'
					, data: {
							storageId: 'abcdef'
						, lockerId: 178
						, eventId: 1
						}
					}
				, e3 = {
						__type: 'ThirdEvent'
					, data: {
							lockerId: 178
						}
					}
			addEvent(e1, function() {
				addEvent(e2, function() {
					addEvent(e3, getEntry)
				})
			})
		})
	})

	after(function(done) {
		fs.unlink(dbPath + '2', done)
	})

  it('should have the proper count', function() {
  	state.count.should.equal(6)
  })

  it('should not contain the first event id', function() {
  	state.ids.should.not.include(3)
  })

  it('should contain the second event id', function() {
  	state.ids.should.not.include(1)
  })
})
