var fs = require ('fs');
var crypto = require ('crypto');

(function () {

	var types = {
		'.tif': 'image/tif',
		'.tiff': 'image/tiff',
		'.jp2': 'image/jp2',
		'.jpg': 'image/jpg',
		'.xml': 'application/xml',
		'.mov': 'video/quicktime',
		'.dpx': 'mage/x-dpx',
		'.zip': 'application/zip'
	}

	function calcMD5 (file) {
		var fd = fs.openSync (file, 'r');
		var hash = crypto.createHash ('md5');
		var buffer = new Buffer (1024);
		var n = 0;

		while ( nr = fs.readSync (fd, buffer, 0, buffer.length) ) {
			hash.update (buffer.slice (0, nr));
		}
		fs.close(fd);
		return hash.digest ('hex');
	}

	function calcMimeType (filename) {
		var index = filename.lastIndexOf ('.');
		var extension = filename.substr (index);
		return types[extension] || 'application/octet-stream';
	}

	function getPageNumber (file) {
		var regex = /_(\d+)_[^\/]+$/;
		var match = regex.exec (file);
		return match[1];
	}

	function findFiles (directory, options) {
		options = options || {};
		var full = options.fullpath || false;

		var files = [];
		var todo = fs.readdirSync (directory);

		function pushAll (base, subs) {
			subs.forEach (function (sub) {
				todo.push (base + '/' + sub);
			});
		};

		while ( todo.length > 0 ) {
			var file = todo.pop ();
			var stat = fs.statSync (directory + '/' + file);

			if ( stat.isDirectory () ) {
				pushAll (file, fs.readdirSync (directory + '/' + file));
			} else {
				var path = full ? directory + '/' + file : file
				files.push (path);
			}
		}

		return files;
	}

	module.exports = {
		calcMD5: calcMD5,
		calcMimeType: calcMimeType,
		findFiles: findFiles,
		getPageNumber: getPageNumber
	};

} ());
