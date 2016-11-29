var http = require ('http');
var url = require ('url');
var chalk = require ('chalk');

(function () {

	function printObject (obj, formatter) {
		formatter = formatter || function (msg) { return msg; };
		JSON.stringify (obj, null, '\t').split ('\n').forEach (function (line) {
			console.log ('    ', formatter (line));
		});
	}

	function Logger (options) {
		this.options = options;
	}

	Logger.prototype.output = function output () {
		console.log.apply (console, arguments);
	}

	Logger.prototype.log = function log (msg, data) {
		this.elasticLog (msg, data, 'info');
		console.log (chalk.bold (' [x] ') + chalk.gray ('(' + this.options._app + ') ') + chalk.green (msg));
		if ( data ) { printObject (data); }
	}

	Logger.prototype.warn = function warn (msg, data) {
		this.elasticLog (msg, data, 'warn');
		console.log (chalk.bold (' [X] ') + chalk.gray ('(' + this.options._app + ') ') + chalk.yellow (msg));
		if ( data ) { printObject (data, chalk.yellow); }
	}

	Logger.prototype.error = function error (msg, data) {
		this.elasticLog (msg, data, 'error');
		console.log (chalk.bold (' [!] ') + chalk.gray ('(' + this.options._app + ') ') + chalk.red (msg));
		if ( data ) { printObject (data, chalk.red); }
	}

	Logger.prototype.elasticLog = function elasticLog (msg, data, lvl) {
		if ( ! this.options.elasticsearch ) {
			return;
		}

		var d = {
			'timestamp': new Date ().toISOString (),
			'msg': msg, lvl: lvl || 'info',
			'listener': this.options._app
		};
		if ( data ) { d.pid = data['pid'] || data['correlation_id'] || 'UNKNOWN'; }

		if (data) {
            for (var i = 0; i < this.options.correlationProperties.length; i++) {
                var key = this.options.correlationProperties[i];
                if (data[key]) {
                    d[key] = data[key];
                }
            }
        }
		if ( data ) { d.data = data; }

		var body = JSON.stringify (d);
		var requestOptions = url.parse (this.options.elasticsearch);
		requestOptions.method = 'post';
		requestOptions.headers = {
			'Content-Type': 'application.json',
			'Content-Length': Buffer.byteLength (body)
		}

		var req = http.request (requestOptions, function (res) {
			res.on ('error', function (err) {
				console.warn (chalk.bold (' [!] ') + chalk.red ('logging to elastic searh failed'));
				console.warn ('     ' + err.message);
			});
		});

		req.write (body);
		req.end ();
	}

	module.exports = {
		Logger: Logger
	}

} ());
