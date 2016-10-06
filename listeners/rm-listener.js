var cmdargs = require ('../utils/cmdargs');
var listen = require ('../utils/listener-utils').listen;

var fse = require('fs-extra');
var q = require ('q');
var path = require ('path');

var options = cmdargs.parse ({
	correlationProperties: ['correlation_id', 'pid', 'directory' ],
	listenqueue: 'rm-requests',
	replyqueue: 'rm-replies',
});

listen (options, function (ch, data, response) {
	q.nfcall (fse.remove, data.directory);
});
