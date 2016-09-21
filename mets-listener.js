var amqp = require('amqplib/callback_api');
var cmdargs = require ('./utils/cmdargs');
var Generator = require ('./utils/generator').Generator;
var abortOnError = require ('./utils/listener-utils').abortOnError;

var options = cmdargs.parse ({
	correlationProperties: ['pid', 'directory'],
	listenqueue: 'mets-requests',
	replyqueue: 'mets-replies'
});

if ( typeof (options.correlationProperties) === 'string' ) {
	options.correlationProperties = options.correlationProperties.split (',');
}

function abortOnError (error) {
	if ( error ) {
		console.warn (err);
		process.exit ();
	}
}

function ensureObject (data, path) {
	var current = data;
	for ( var i = 0; i < path.length; i++ ) {
		var key = path[i];
		current[key] = current[key] || {};
		current = current[key];
	}
}

function normalie (data) {
	ensureObject (data, [ 'metadata', 'digital_object', 'MediaHAVEN_external_metadata', 'MDProperties', 'PID' ]);
	ensureObject (data, [ 'metadata', 'ensemble', 'carrier', 'PID' ]);

	var mdproperties = data.metadata['digital_object']['MediaHAVEN_external_metadata'].MDProperties;
	mdproperties.PID['#text'] = data.pid;
	mdproperties.CP['#text'] = data.agents[0].name;
	mdproperties.CreatonDate = { '#text': new Date ().toISOString () };
	data.metadata['ensemble'].carrier.PID['#text'] = data.pid;
}

amqp.connect ('amqp://docker', function (err, conn) {
	abortOnError (err);

	conn.createChannel (function (err, ch) {
		abortOnError (err);

		ch.assertQueue (options.listenqueue, { durable: false });
		ch.assertQueue (options.replyqueue, { durable: false });

		console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", options.listenqueue);

		ch.consume (options.listenqueue, function (msg) {
			console.log (" [x] Received request ...");

			var data = JSON.parse (msg.content.toString ());
			new Generator (data, { writeToDisk: true }).generate ();

			var response = { success: true };
			options.correlationProperties.forEach (function (key) {
				response[key] = data[key];
			});

			ch.sendToQueue (options.replyqueue, new Buffer (JSON.stringify (response)));
		}, { noAck: true });
	});

});
