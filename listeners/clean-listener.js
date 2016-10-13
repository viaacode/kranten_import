var cmdargs = require ('../utils/cmdargs');
var abortOnError = require ('../utils/listener-utils').abortOnError;

var amqp = require('amqplib/callback_api');
var chalk = require ('chalk');

var options = cmdargs.parse ({
	listenqueue: '',
});

amqp.connect (options.broker, function (err, conn) {
	abortOnError (err);

	conn.createChannel (function (err, ch) {
		abortOnError (err);

		ch.assertQueue (options.listenqueue, { durable: options.durable });

		console.log (' [*] Waiting for messages (%s)', options.listenqueue);
		console.log ('     To exit press CTRL+C');

		ch.consume (options.listenqueue, function (msg) {
			console.log (chalk.bold (' [x] ') + chalk.green ('Received message ...'));
			var content = msg.content.toString ();

			try { content = JSON.stringify (JSON.parse (content), null, '\t'); }
			catch (e) { console.log ('  ! ', e); }

			content.split ('\n').forEach (function (line) {
				console.log ('    ', line);
			});
		}, { noAck: true });
	});
});
