var cmdargs = require ('../utils/cmdargs');
var listen = require ('../utils/listener-utils').listen;
var mkdirp = require('mkdirp');

var fs = require('fs');
var q = require ('q');
var path = require ('path');

var options = cmdargs.parse ({
	correlationProperties: ['correlation_id', 'pid', 'directory',
		'source_path', 'source_file', 'destination_path', 'destination_file'
	],
	listenqueue: 'alto-requests',
	replyqueue: 'alto-replies',
});

function ensureValidRequest (data) {
	var valid = ('source_path' in data) && ('source_file' in data)
		&& ('destination_path' in data) && ('destination_file' in data);
	if ( ! valid ) { throw 'Missing properties for successful copy'; }
}

listen (options, function (ch, data, response) {
	ensureValidRequest (data);

	var fromFileName = path.join (data.source_path, data.source_file);
	var toFileName = path.join (data.destination_path, data.destination_file);

	mkdirp.sync (data.destination_path)

	var deferred = q.defer ();

	var fromFile = fs.createReadStream (fromFileName, { autoClose: true });
	fromFile.on ('error', function (err) { deferred.reject (err); });

	var toFile = fs.createWriteStream (toFileName, { autoClose: true });
	toFile.on ('error', function (err) { deferred.reject (err); });
	toFile.on ('close', function () { deferred.resolve (response); } )

	fromFile.pipe (toFile);

	return deferred.promise
});
