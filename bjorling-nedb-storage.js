var Datastore = require('nedb')
	, errors = require('./errors')
	, existingStorage = {}

module.exports = createNeDbStorage


function createNeDbStorage(location) {
	var db = existingStorage[location] = existingStorage[location] || new Datastore({
		filename: location
	, autoload: true
	})

	return function(projectionName, key) {
		return new NeDbProjection(db, projectionName, key)
	}
}

function NeDbStorage(location, key) {
	if(!(this instanceof NeDbStorage)) {
		return new NeDbStorage(location)
	}

	if(!location) throw new errors.InitializationError('Bjorling NeDb Storage requires a location to be initialized.')
}

function NeDbProjection(db, projectionName, key) {
	this._db = db
	this._projectionName = projectionName
	this._key = key
	this._indexes = []
}

NeDbProjection.prototype.addIndex = function(index, cb) {
	this._indexes.push(index)
	setImmediate(function() {
		cb && cb()
	})
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
		this._db.findOne(query, cb)
	} else {
		setImmediate(function() {
			cb(null, null)
		})
	}
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

function isUndefined(val) {
	return typeof(val) === 'undefined'
}

NeDbProjection.prototype.save = function(val, cb) {
	var keyVal = this.getKeyValue(val)
	console.log(keyVal)
	//console.log('saving', this._projectionName, this._key, keyVal)
	this._db.update(keyVal, val, { upsert: true }, cb)
}

/*
var levelup = require('levelup')
	, sub = require('level-sublevel')
	, levelQuery = require('level-queryengine')
	, deleteStream = require('level-delete-stream')
	, engine = require('jsonquery-engine')
	, errors = require('./errors')



function isUndefined(val) {
	return typeof(val) === 'undefined'
}

function BjorlingLevelProjectionStorage(db, projectionName, key) {
	this._db = levelQuery(db)
	this._db.query.use(engine())

	this._key = key
	this._projectionName = projectionName

	this._indexes = []
}

BjorlingLevelProjectionStorage.prototype.getKeyValue = function(obj) {
	var key = this._key
		, parts = Array.isArray(key) ? key.map(getVal) : [getVal(key)]

	function getVal(keyPart) {
		return obj[keyPart]
	}

	if(parts.some(isUndefined)) return null

	return parts.join('')
}

BjorlingLevelProjectionStorage.prototype.get = function(queryObj, cb) {
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

BjorlingLevelProjectionStorage.prototype.reset = function(cb) {
	var db = this._db
	db.createKeyStream()
		.pipe(deleteStream(db, cb))
}

BjorlingLevelProjectionStorage.prototype.save = function(val, cb) {
	var keyVal = this.getKeyValue(val)
	//console.log('saving', this._projectionName, this._key, keyVal)
	this._db.put(keyVal, val, cb)
}



function getArgs(arrayLike) {
	return Array.prototype.slice.call(arrayLike, 0)
}

module.exports = function(location, key) {
	var s = new LevelStorage(location, key)
		, __bjorling = s._db.sublevel('__bjorling')
		, a = function(projectionName, key, cb) {
				if(!projectionName) {
					var err = new errors.ProjectionInitializationError('Bjorling Level Projection Storage requires a projection name to be initialized.')
					if(cb) {
						return cb(err)
					}
					throw err
				}
				if(!key) {
					var err = new errors.ProjectionInitializationError('Bjorling Level Projection Storage requires a key to be initialized.')
					if(cb) {
						return cb(err)
					}
					throw err
				}

				var db = s._db.sublevel(projectionName)
					, p = new BjorlingLevelProjectionStorage(db, projectionName, key)
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