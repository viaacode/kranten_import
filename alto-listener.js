var amqp = require('amqplib/callback_api');
var cmdargs = require ('./utils/cmdargs');
var AltoEmbeder = require ('./utils/alto').AltoEmbeder;
var abortOnError = require ('./utils/listener-utils').abortOnError;

var options = cmdargs.parse ({
	correlationProperties: ['pid', 'directory'],
	listenqueue: 'alto-requests',
	replyqueue: 'alto-replies',
	durable: false,
	acknoledge: true
});

amqp.connect ('amqp://docker', function (err, conn) {
	abortOnError (err);

	conn.createChannel (function (err, ch) {
		abortOnError (err);

		ch.assertQueue (options.listenqueue, { durable: options.durable });
		ch.assertQueue (options.replyqueue, { durable: options.durable });

		ch.consume (options.listenqueue, function (msg) {
			console.log (" [x] Received request ...");

			var data = JSON.parse (msg.content.toString ());
			new AltoEmbeder (data, { writeToDisk: true }).embed ();

			var response = { success: true };
			options.correlationProperties.forEach (function (key) {
				response[key] = data[key];
			});

			ch.sendToQueue (options.replyqueue, new Buffer (JSON.stringify (response)));
		}, { noAck: options.acknoledge });
	});

});
