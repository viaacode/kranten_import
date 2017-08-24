var cheerio = require ('cheerio');
var fs = require ('fs');

var fUtils = require ('./file-utils');
var xUtils = require ('./xml-utils');
var addNode = xUtils.addNode;

(function () {

	function findMets (directory) {
		var files = fs.readdirSync (directory);
		var candidates = files.filter (function (file) {
			return file.indexOf ('mets') !== -1;
		});

		if ( candidates.length < 1 ) { throw 'no mets file found'; }
		return directory + '/' + candidates[0];
	}

	function loadXmlFile (file) {
		var fd = fs.openSync (file, 'r');
		var xml = cheerio.load (fs.readFileSync (fd), { xmlMode: true });
		fs.close(fd);
		return xml;
	}

	function AltoEmbeder (config, params) {
		this.config = config;
		this.params = params || {};
		this.metsfilename = findMets (this.config.directory);
		this.mets = loadXmlFile (this.metsfilename);
	}

	AltoEmbeder.prototype.listAltos = function listAltos () {
		return fUtils.findFiles (this.config.directory)
			.filter (function (file) {
				return file.indexOf ('_alto') !== -1 || file.indexOf ('_jp2') !== -1 || file.indexOf ('_tif') !== -1;
			})
			.map (function (file) {
				return this.config.directory + '/' + file;
			}.bind (this));
	}

	AltoEmbeder.prototype.embed = function embed () {
		var altos = this.listAltos ().sort((a, b) => {
			if (a.indexOf('_alto') !== -1 && b.indexOf('_alto') !== -1) {
				// Both are alto files
				return 0;
			}
			if (a.indexOf('_alto') !== -1) {
				return -1;
			}
			if (b.indexOf('_alto') !== -1) {
				return 1;
			}
		});
		var ocrdata = {};
		altos.forEach (function (altofile) {
			if (altofile.indexOf('.xml') !== -1) {
                var alto = loadXmlFile(altofile);
                var contents = alto('String').map(function (index, node) {
                    return alto(node).attr('CONTENT');
                }).get().join(' ');
                ocrdata[fUtils.getPageNumber (altofile)] = contents;
                this.embedAlto(altofile, contents);
            } else {
				if (ocrdata[fUtils.getPageNumber(altofile)] !== undefined && ocrdata[fUtils.getPageNumber(altofile)] !== null && ocrdata[fUtils.getPageNumber(altofile)] !== '') {
					var contents = ocrdata[fUtils.getPageNumber(altofile)];
				} else {
					var contents = '';
				}
                this.embedAlto(altofile, contents);
			}
		}.bind (this));

		if ( this.params.writeToDisk ) {
			fs.writeFileSync (this.metsfilename, this.toString ());
		}

		return this;
	}

	AltoEmbeder.prototype.embedAlto = function embedAlto (altofile, content) {
		var digidata = this.mets ('mets\\:amdSec[ID=SECTION-METADATA-ENSEMBLE]');
		var amdsec = digidata.clone ();

		this.mets ('mets\\:amdSec').last ().after (amdsec);
		// var amdsec = this.mets ('mets\\:amdSec').last ();

		var source = this.mets ('mets\\:sourceMD', amdsec);
		var mdwrap = this.mets ('mets\\:mdWrap', source);
		var have = this.mets ('MediaHAVEN_external_metadata', mdwrap);

		var description = addNode (this.mets, have, [ 'description' ]);

		var props = this.mets ('MDProperties', mdwrap);
		var transcriptie = addNode (this.mets, props, [ 'dc_description_transcriptie' ]);
        var pageNr = fUtils.getPageNumber (altofile);
        var type = altofile.match(new RegExp(/.*_[0-9]+_(.*)\..*$/))[1];
		var pid = this.mets ('PID', have);
		var prevpid = pid.text();
		pid.text(prevpid + '_' + pageNr + '_' + type);
		if (content !== undefined && content !== null && content !== '') {
            description.text(content);
            transcriptie.text(content);
        }

		mdwrap.attr ('MDTYPE', 'OTHER');
		mdwrap.attr ('OTHERMDTYPE', 'VIAA-XML');


		var uppertype = type.toUpperCase();
		if (uppertype === 'ALTO') {
            var altoId = 'METADATA-DIGITALOBJECT-OCR-' + pageNr;
		}
		else {
            var altoId = 'METADATA-DIGITALOBJECT-' + uppertype + '-' + pageNr;
		}
		source.attr ('ID', altoId);
		amdsec.attr ('ID', 'SECTION-' + altoId);

		this.mets ('mets\\:file[ID*=' + pageNr + '_' + type + ']').each (function (index, item) {
			var node = this.mets (item);
			node.attr ('ADMID', /* node.attr ('ADMID') + ' ' + */ altoId);
		}.bind (this));
	}

	AltoEmbeder.prototype.toString = function toString () {
		return this.mets.xml ();
	}

	module.exports = {
		AltoEmbeder: AltoEmbeder
	}

} ());
