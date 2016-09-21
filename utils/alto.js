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
		return cheerio.load (fs.readFileSync (fd), { xmlMode: true });
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
				return file.indexOf ('alto') !== -1 && file.endsWith ('.xml');
			})
			.map (function (file) {
				return this.config.directory + '/' + file;
			}.bind (this));
	}

	AltoEmbeder.prototype.embed = function embed () {
		var altos = this.listAltos ();

		altos.forEach (function (altofile) {
			var alto = loadXmlFile (altofile);
			var contents = alto ('String').map (function (index, node) {
				return alto (node).attr ('CONTENT');
			}).get ().join (' ');
			this.embedAlto (altofile, contents);
		}.bind (this));

		if ( this.params.writeToDisk ) {
			fs.writeFileSync (this.metsfilename, this.toString ());
		}

		return this;
	}

	AltoEmbeder.prototype.embedAlto = function embedAlto (altofile, content) {
		this.mets ('mets\\:amdSec').last ().after ('<mets:amdSec />');
		var amdsec = this.mets ('mets\\:amdSec').last ();

		var source = addNode (this.mets, amdsec, [ 'mets:sourceMD' ]);
		var mdwrap = addNode (this.mets, source, [ 'mets:mdWrap' ]);
		var have = addNode (this.mets, mdwrap, [ 'mets:xmlData', 'MediaHAVEN_external_metadata']);
		var description = addNode (this.mets, have, [ 'description' ]);

		var props = addNode (this.mets, have, [ 'MDProperties' ]);
		var transcriptie = addNode (this.mets, props, [ 'dc_description_transcriptie' ]);

		description.text (content);
		transcriptie.text (content);

		mdwrap.attr ('MDTYPE', 'OTHER');
		mdwrap.attr ('OTHERMDTYPE', 'VIAA-XML');
		var pageNr = fUtils.getPageNumber (altofile);
		var altoId = 'METADATA-DIGITALOBJECT-OCR-' + pageNr;
		source.attr ('ID', altoId);
		amdsec.attr ('ID', 'SECTION-' + altoId);

		this.mets ('mets\\:file[ID*=' + pageNr + ']').each (function (index, item) {
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
