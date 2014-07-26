var createError = require('errno').create
	, BjorlingNeDbStorageError = createError('BjorlingNeDbStorageError')

module.exports = {
	BjorlingNeDbStorageError: BjorlingNeDbStorageError
, InitializationError: createError('InitializationError', BjorlingNeDbStorageError)
, ProjectionInitializationError: createError('ProjectionInitializationError', BjorlingNeDbStorageError)
}