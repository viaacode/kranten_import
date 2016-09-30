var amqp = require('amqplib');
var chalk = require ('chalk');
var q = require ('q');

(function () {

	function abortOnError (error) {
		if ( error ) {
			console.warn (error);
			process.exit ();
		}
	}

	function printObject (obj) {
		JSON.stringify (obj, null, '\t').split ('\n').forEach (function (line) {
			console.log ('    ', line);
		});
	}

	function completeOptions (options) {
		options.broker = options.broker || 'amqp://guest:guest@localhost:5672?heartbeat=120';
		options.correlationProperties = options.correlationProperties || ['correlation_id', 'pid', 'directory'];
		options.listenqueue = options.listenqueue || 'requests';
		options.replyqueue = options.replyqueue || 'replies';
		options.durable = options.durable || true;
		options.acknoledge = options.acknowledge || true;
		options.reconnectTimeout = options.reconnectTimeout || 10000;
		options.reconnectLimit = options.reconnectLimit || 10;

		return options;
	}

	var Connection = function Connection (options, fn) {
		this.options = completeOptions (options);
		this.fn = fn;

		this.conn = null;
		this.channel = null;

		this.connect ().catch (function (err) {
			console.log (chalk.bold (' [!] ') + chalk.red ('Establishing listener failed'));
			console.log (err);
		});
	}

	Connection.prototype.connect = function connect () {
		// amqp.connect (this.options.broker)
		return this.establishConnection ()
			.then (this.keepConnection.bind (this))
			.then (this.addConnectionListeners.bind (this))
			.then (this.createChannel.bind (this))
			.then (this.prepareQueues.bind (this))
			.then (this.startConsuming.bind (this))
	}

	Connection.prototype.establishConnection = function establishConnection (count) {
		count = count || 1;
		if ( count > this.options.reconnectLimit ) {
			console.warn (chalk.bold (' [!] ') + chalk.red ('Too many connection attempts. Shutting down.'));
			return q.reject ('too many connect attempts');
		}

		return amqp.connect (this.options.broker).catch (function (err) {
			console.log (chalk.bold (' [C] ') + chalk.yellow ('Connection attempt failed ...'));
			console.log (chalk.yellow ('     broker url: %s'), this.options.broker);
			console.log (chalk.yellow ('     Retrying in %s seconds (attempt %s)'), this.options.reconnectTimeout, count);
			console.log (err);

			var deferred = q.defer ();
			setTimeout (function () {
				deferred.resolve (this.establishConnection (count + 1));
			}.bind (this), this.options.reconnectTimeout);

			return deferred.promise;
		}.bind (this));
	}

	Connection.prototype.reconnect = function reconnect (count) {
		amqp.connect (this.options.broker)
			.catch (function (err) {
			})
			.then (this.keepConnection.bind (this))
			.then (this.addConnectionListeners.bind (this))
			.then (this.createChannel.bind (this))
			.then (this.prepareQueues.bind (this))
			.then (this.startConsuming.bind (this));
	}

	Connection.prototype.keepConnection = function keepConnection (conn) {
		this.conn = conn;
		return conn;
	}

	Connection.prototype.keepChannel = function keepChannel (channel) {
		this.channel = channel;
		return channel;
	}

	Connection.prototype.addConnectionListeners = function addConnectionLisneners (conn) {
		conn.on ('close', function connectionClosed () {
			console.log (chalk.bold (' [C] ') + chalk.yellow ('Connection closed ...'));
		});

		conn.on ('error', function connectionError (err) {
			console.warn (chalk.bold (' [!] ') + chalk.red ('Connection error:'));
			console.warn (err);
			console.warn ('    ' + chalk.red ('reconnecting in ' + this.options.reconnectTimeout + ' miliseconds.'));
			setTimeout (this.reconnect.bind (this, 1), this.options.reconnectTimeout);
		}.bind (this));

		return conn;
	}

	Connection.prototype.createChannel = function createChannel (conn) {
		return this.conn.createChannel ().then (this.keepChannel.bind (this));
	}

	Connection.prototype.prepareQueues = function prepareQueues (channel) {
		this.channel.assertQueue (this.options.listenqueue, { durable: this.options.durable });
		this.channel.assertQueue (this.options.replyqueue, { durable: this.options.durable });

		return channel;
	}

	Connection.prototype.startConsuming = function startConsuming (channel) {
		console.log (
			chalk.bold (' [*] ') + chalk.gray ('Waiting for messages (%s -> %s)'),
			this.options.listenqueue, this.options.replyqueue
		);
		console.log (chalk.gray ('     To exit press CTRL+C'));

		this.channel.consume (this.options.listenqueue, this.consumer.bind (this));

		return channel;
	}

	Connection.prototype.consumer = function consumer (msg) {
		var data = JSON.parse (msg.content.toString ());

		var response = { success: true };
		this.options.correlationProperties.forEach (function (key) {
			if ( data[key] ) { response[key] = data[key]; }
		});

		var promise;
		try { promise = q (this.fn (this.channel, data, response) || response); }
		catch (e) { promise = q.reject (e); }

		promise = promise.catch (function (e) {
			console.warn (chalk.bold (' [!] ') + chalk.red (e));
			console.warn (e);
			response.success = false;
			return response;
		});

		promise = promise.finally (function (r) {
			console.log (
				chalk.bold (" [x] ") + chalk.green ("(from %s) Received request ..."),
				this.options.listenqueue
			);
			if ( this.options.verbose ) {
				printObject (data)
				console.log (chalk.green ("     (to %s) Replying with ..."), this.options.replyqueue);
				printObject (response);
			};
		}.bind (this));

		promise = promise.then (function (res) {
			var s = this.options.pretty ?  JSON.stringify (res, null, '\t') : JSON.stringify (res);
			this.channel.sendToQueue (this.options.replyqueue, new Buffer (s));
			if ( this.options.acknowledge ) { this.channel.ack (msg); }
		}.bind (this));

		promise.catch (function (err) {
			console.warn (chalk.red (' [!] %s'), err);
		});
	}

	module.exports = {
		abortOnError: abortOnError,
		listen: function listen (options, fn) { new Connection (options, fn); }
	}

} ());
