var Datastore = require('nedb')
	, errors = require('./errors')
	, existingStorage = {}

module.exports = createNeDbStorage


function createNeDbStorage(location) {
	if(!location) throw new errors.InitializationError('Bjorling NeDb Storage requires a location to be initialized.')

	var db = existingStorage[location] = existingStorage[location] || new Datastore({
		filename: location
	, autoload: true
	})

	return function(projectionName, key) {
		return new NeDbProjection(db, projectionName, key)
	}
}

function NeDbProjection(db, projectionName, key) {
	if(!projectionName) {
		throw new errors.ProjectionInitializationError('Bjorling NeDb Projection Storage requires a projection name to be initialized.')
	}
	if(!key) {
		throw new errors.ProjectionInitializationError('Bjorling NeDb Projection Storage requires a key to be initialized.')
	}

	this._db = db
	this._projectionName = projectionName
	this._key = key
	this._indexes = []

	//this._verifyStatus()
}

NeDbProjection.prototype._verifyStatus = function() {
	var projectionName = this._projectionName
		, db = this._db
	this._db.findOne({ __bjorling: projectionName }, function(err, status) {
		if(err) throw err
		if(!status) {
			status = {
				__bjorling: projectionName
			, status: { lastProcessedEvent: 0 }
			}
			db.insert(status)
		}
	})
}

NeDbProjection.prototype.addIndex = function(index, cb) {
	this._indexes.push(index)
	this._db.ensureIndex({ fieldName: index }, cb)
}

NeDbProjection.prototype.get = function(queryObj, cb) {
	var db = this._db
		, keyVal = this.getKeyValue(queryObj)
		, indexVals = this._indexes
				.map(function(index) {
					return {
						name: index
					, val: queryObj[index]
					}
				})
				.filter(function(map) {
					return typeof(map.val) !== 'undefined'
				})
		, query

	if(keyVal) {
		query = keyVal
	}

	if(!query && indexVals.length) {
		query = {
			$and: indexVals.reduce(function(and, indexVal) {
				var part = {}
				part[indexVal.name] = indexVal.val
				and.push(part)
				return and
			}, [])
		}
	}

	if(query) {
		this._db.findOne(query, function(err, record) {
			if(err) return cb(err)

			if(record) {
				delete record._id
			}
			cb(null, record)
		})
	} else {
		setImmediate(function() {
			cb(null, null)
		})
	}
}

NeDbProjection.prototype.getAll = function(cb) {
	this._db.find({}, cb)
}

NeDbProjection.prototype.getKeyValue = function(obj) {
	var key = this._key
		, parts = Array.isArray(key) ? key : [key]
		, keyObj = parts.reduce(function(all, keyPart) {
				var val = obj[keyPart]
				
				if(val) {
					all[keyPart] = val
				}
				return all
			}, {})

	function getVal(keyPart) {
		return obj[keyPart]
	}

	return Object.keys(keyObj).length ? keyObj : null
}

NeDbProjection.prototype.getStatus = function(cb) {
	this._db.findOne({ __bjorling: this._projectionName }, function(err, result) {
		if(err) return cb(err)
		if(!result) return cb(new Error('Projection does not have __bjorling status'))

		cb(null, result.status)
	})
}

function isUndefined(val) {
	return typeof(val) === 'undefined'
}

NeDbProjection.prototype.reset = function(cb) {
	this._db.remove({}, cb)
}

NeDbProjection.prototype.save = function(val, cb) {
	var keyVal = this.getKeyValue(val)
	//console.log('saving', this._projectionName, this._key, keyVal)
	this._db.update(keyVal, val, { upsert: true }, cb)
}

/*
BjorlingNeDbProjectionStorage.prototype.get = function(queryObj, cb) {
	var db = this._db
		, keyVal = this.getKeyValue(queryObj)
		, isRawQuery = !!queryObj.$and

	function respond(err, result) {
		if(err) {
			if(err.notFound) return cb(null, null)
			return cb(err)
		}
		cb(null, result)
	}

	if(keyVal) {
		db.get(keyVal, respond)
		return
	}

	function getIndexVal(index) {
		return {
			name: index
		, val: queryObj[index]
		}
	}

	function hasIndexVal(map) {
		return typeof(map.val) !== 'undefined'
	}

	var indexVals = this._indexes
				.map(getIndexVal)
				.filter(hasIndexVal)

	if(!indexVals.length && !isRawQuery) {
		return setImmediate(function() {
			cb(null, null)
		})
	}

	var q = {}

	function createQueryObj(map) {
		var qObj = {}
		qObj[map.name] = map.val
		return qObj
	}

	function performQuery() {
		var result = null
			, hasMultiple = false

		db.query(q)
			.on('data', function(r) {
				if(isRawQuery) {
					result = result || []
					result.push(r)
				} else {
					hasMultiple = !!result
					result = r
				}
			})
			.on('stats', function(stats) {
				//console.log(stats)
			})
			.on('end', function() {
				if(hasMultiple) return cb(new Error('multiple results'))
				cb(null, result)
			})
			.on('error', cb)
	}

	if(indexVals.length === 1) {
		q = createQueryObj(indexVals[0])
	} else if(queryObj.$and) {
		q = queryObj
	} else {
		q.$and = indexVals.map(createQueryObj)
	}

	return performQuery()
}

function getArgs(arrayLike) {
	return Array.prototype.slice.call(arrayLike, 0)
}

module.exports = function(location, key) {
	var s = new NeDbStorage(location, key)
		, __bjorling = s._db.sublevel('__bjorling')
		, a = function(projectionName, key, cb) {
				if(!projectionName) {
					var err = new errors.ProjectionInitializationError('Bjorling NeDb Projection Storage requires a projection name to be initialized.')
					if(cb) {
						return cb(err)
					}
					throw err
				}
				if(!key) {
					var err = new errors.ProjectionInitializationError('Bjorling NeDb Projection Storage requires a key to be initialized.')
					if(cb) {
						return cb(err)
					}
					throw err
				}

				var db = s._db.sublevel(projectionName)
					, p = new BjorlingNeDbProjectionStorage(db, projectionName, key)
				__bjorling.put(projectionName, {}, function(err) {
					if(err &&  cb) return cb(err)
					cb && cb(null, p)
				})
				return p
			}
	a._db = s._db
	a._key = s._key
	a._indexes = s._indexes
	a.get = function() {
		return s.get.apply(s, getArgs(arguments))
	}
	a.save = function() {
		return s.save.apply(s, getArgs(arguments))
	}
	a.addIndex = function() {
		return s.addIndex.apply(s, getArgs(arguments))
	}
	return a
}
*/