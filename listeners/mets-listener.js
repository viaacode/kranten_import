var cmdargs = require ('../utils/cmdargs');
var Generator = require ('../utils/generator').Generator;
var listen = require ('../utils/listener-utils').listen;
var Date = require('sugar-date').Sugar().Date;

var options = cmdargs.parse ({
	listenqueue: 'mets-requests',
	replyqueue: 'mets-replies',
});

if ( typeof (options.correlationProperties) === 'string' ) {
	options.correlationProperties = options.correlationProperties.split (',');
}

function ensureObject (obj, props) {
	var current = obj;
	for ( var i = 0; i < props.length; i++ ) {
		var key = props[i];
		current[key] = current[key] || {};
		current = current[key];
	}
}

function normalize (data) {
	ensureObject (data, [ 'metadata', 'digital_object', 'MediaHAVEN_external_metadata', 'MDProperties', 'PID' ]);
	// ensureObject (data, [ 'metadata', 'ensemble', 'carrier', 'PID' ]);
	var MEM = data.metadata['digital_object']['MediaHAVEN_external_metadata'];
	var mdproperties = data.metadata['digital_object']['MediaHAVEN_external_metadata'].MDProperties;
	mdproperties.PID['#text'] = data.pid;
	//mdproperties.CP['#text'] = data.agents[0].name;
    MEM.CreationDate = { '#text': new Date.format('%Y:%m:%dT%H:%M:%S.{SSS}Z') };
	// data.metadata['ensemble'].carrier.PID['#text'] = data.pid;

	return data;
}

listen (options, function (ch, data, response) {
	new Generator (normalize (data), { writeToDisk: true }).generate ();
});
