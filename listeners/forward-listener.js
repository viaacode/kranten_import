var cmdargs = require ('../utils/cmdargs');
var listen = require ('../utils/listener-utils').listen;

var options = cmdargs.parse ({
	listenqueue: 'alto-requests',
	replyqueue: 'alto-replies'
});

listen (options, function (ch, data, response) {
	for ( var key in data ) {
		if ( ! data.hasOwnProperty (key) ) { continue; }
		response[key] = data[key];
	}
});
