(function () {

	globalDefaults = {
		broker: 'amqp://guest:guest@localhost:5672?heartbeat=120',
		correlationProperties: ['correlation_id', 'pid', 'directory'],
		listenqueue: 'requests',
		replyqueue: 'replies',
		durable: true,
		acknowledge: true,
		reconnectTimeout: 10000,
		reconnectLimit: 10,

		elasticsearch: 'http://localhost:9200/index/sub/'
	}

	function toValue (val) {
		if ( val.toLowerCase () === 'true' ) { return true; }
		else if ( val.toLowerCase () === 'false' ) { return false; }
		else if ( val.match (/^\d+(\.\d+)?$/) ) { return parseFloat (val); }
		else { return val; }
	}

	function parse (defaults) {
		var args = { '_app': process.argv[1] };
		var arr = process.argv.slice (2);

		for ( key in globalDefaults ) {
			if ( ! globalDefaults.hasOwnProperty (key) ) { continue; }
			args[key] = globalDefaults[key];
		}

		for ( key in defaults ) {
			if ( ! defaults.hasOwnProperty (key) ) { continue; }
			args[key] = defaults[key];
		}

		for ( var i = 0; i < arr.length; i++ ) {
			var arg = arr[i];

			if ( ! (arg.startsWith ('--')) ) { break; }
			if ( arg === '--' ) { break; }

			var parts = arg.split ('=');
			var key = parts[0].substr (2);
			var val = parts.length > 1 ? toValue (parts.slice (1).join ('=')) : true;

			args[key] = val;
		}

		return args;
	}

	module.exports = {
		parse: parse
	}

} ());
