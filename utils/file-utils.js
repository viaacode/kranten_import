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
		'.zip': 'application/zip',
		'.pdf': 'application/pdf'
	};

    var simpleTypes = {
        '.tif': 'essence',
        '.tiff': 'essence',
        '.jp2': 'browse',
        '.jpg': 'browse',
        '.xml': 'metadata',
        '.mov': 'essence',
        '.dpx': 'essence',
        '.zip': 'archive',
	'.pdf': 'browse'
    };

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

	function calcSimpleType (filename) {
        var index = filename.lastIndexOf ('.');
        var extension = filename.substr (index);
        return simpleTypes[extension] || 'unknown';
	}

	function getPageNumber (file) {
		var regex = /_\d+_(\d+)_[^\/]+/;
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
		}

		while ( todo.length > 0 ) {
			var file = todo.pop ();
			try {
                var stat = fs.statSync (directory + '/' + file);

                if ( stat.isDirectory () ) {
                    pushAll (file, fs.readdirSync (directory + '/' + file));
                } else {
                    var path = full ? directory + '/' + file : file
                    files.push (path);
                }
			} catch (err) {

			}
		}
		return files;
	}

    function findFiles (directory, options) {
		options = options || {};
        var full = options.fullpath || false;
        var listFiles = options.listfiles || true;

        var files = [];
        var todo = fs.readdirSync (directory);

        function pushAll (base, subs) {
            subs.forEach (function (sub) {
                todo.push (base + '/' + sub);
            });
        }


        while ( todo.length > 0 ) {
            var file = todo.pop ();
            try {
                var stat = fs.statSync (directory + '/' + file);

                if ( stat.isDirectory () ) {
					if (listFiles === false) {
                        files.push(file);
                    }
                     else {
						pushAll (file, fs.readdirSync (directory + '/' + file));
                    }
                } else {
                	if (listFiles) {
                        var path = full ? directory + '/' + file : file
                        files.push(path);
                    }
                }
            } catch (err) {

            }
        }
        return files;
    }

    function findDirectories (directory, options) {
        options = options || {};
        var maxDepth = options.depth;
        var currDepth = options.currDepth || 0;

        var files = [];
        var todo = fs.readdirSync (directory);

        while ( todo.length > 0 ) {
            var file = todo.pop ();
            try {
            	var curr = (directory + '/' + file);
                var stat = fs.statSync (curr);

                if ( stat.isDirectory () ) {
                    files.push(file);
                    if (currDepth <= maxDepth) {
                        console.log('Gun descend into dir: ' + curr + ' - Depth: ' + (currDepth + 1));
                        findDirectories(directory + '/' + file, {
                            currDepth: currDepth + 1,
                            depth: maxDepth
                        }).forEach((dir) => {
                        	files.push(file + '/' + dir);
						});

                    }
                }
            } catch (err) {

            }
        }
        return files;
    }

	module.exports = {
		calcMD5: calcMD5,
		calcMimeType: calcMimeType,
		findFiles: findFiles,
		getPageNumber: getPageNumber,
		calcSimpleType: calcSimpleType,
        findDirectories: findDirectories
	};

} ());
