var cmdargs = require ('../utils/cmdargs');
var AltoEmbeder = require ('../utils/alto').AltoEmbeder;
var listen = require ('../utils/listener-utils').listen;

var options = cmdargs.parse ({
	correlationProperties: ['correlation_id', 'pid', 'directory'],
	listenqueue: 'alto-requests',
	replyqueue: 'alto-replies',
});

listen (options, function (ch, data, response) {
	new AltoEmbeder (data, { writeToDisk: true }).embed ();
});
