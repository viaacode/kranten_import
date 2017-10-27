var cmdargs = require ('../utils/cmdargs');
var listen = require ('../utils/listener-utils').listen;

var fUtils = require ('../utils/file-utils');

var options = cmdargs.parse ({
	listenqueue: 'dir-listing-requests',
	replyqueue: 'dir-listing-replies',
	excludes: []
});

listen (options, function (ch, data, response) {
	response.files = fUtils.findDirectories(data.directory, {  depth: data.depth || 1 }).filter (function (path) {
		for ( var i = 0; i < options.excludes.length; i++ ) {
			if ( path.indexOf (options.excludes[i]) !== -1 ) { return false; }
		}
		var excludes = data.excludes || [];
		for ( var i = 0; i < excludes.length; i++ ) {
			if ( path.indexOf (excludes[i]) !== -1 ) { return false; }
		}
		return true;
	});
});
