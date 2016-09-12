var cheerio = require ('cheerio');

var xUtils = require ('./xml-utils');
var addNode = xUtils.addNode;
var addObjects = xUtils.addObjects;

var fUtils = require ('./file-utils');
var calcMD5 = fUtils.calcMD5;
var calcMimeType = fUtils.calcMimeType;

(function () {

	function pathToId (path) {
		var extensionIndex = path.lastIndexOf ('.');
		var filenameIndex = path.lastIndexOf ('/', extensionIndex);
		return path.substring (filenameIndex + 1, extensionIndex);
	}

	function Generator (config) {
		this.config = config;
		this.xml = cheerio.load ('<mets:mets></mets:mets>', { xmlMode: true });
		this.root = this.xml ('mets\\:mets');
	}

	Generator.prototype.addAgents = function addAgents (agents) {
		var header = addNode (this.xml, this.root, ['mets:metsHdr']);

		header.attr ('ID', 'VIAA');
		header.attr ('CREATEDATE', new Date ().toISOString ());
		header.attr ('LASTMODDATE', new Date ().toISOString ());

		agents.forEach (function (agent) {
			header.append ('<mets:agent />');
			var node = header.children ().last ();
			node.attr ('ROLE', agent.roles[0]);
			node.attr ('TYPE', agent.type);
			node.attr ('OTHERROLE', '');

			node.append ('<mets:name>' + agent.name + '</mets:name>');
		});
	}

	Generator.prototype.addMetaSection = function addMetaSection (data) {
		var section = addNode (this.xml, this.root, [ 'mets:amdSec' ]);
		var source = addNode (this.xml, section, [ 'mets:sourceMd' ]);
		var datanode = addNode (this.xml, source, [ 'mets:mdWrap', 'mets:xmlData' ]);

		section.attr ('ID', 'SECTION-METADATA-DIGIAL-OBJECT');
		source.attr ('ID', 'METADATA-DIGITAL-OBJECT');
		addObjects (this.xml, datanode, data);
	}

	Generator.prototype.addFilesSection = function addFilesSection (files) {
		var group = addNode (this.xml, this.root, ['mets:fileSec', 'mets:fileGrp']);
		var id = this.config.pid;
		files.forEach (function (file) {
			var filenode = addNode (this.xml, group, ['mets:file']);
			var loc = addNode (this.xml, filenode, ['mets:FLocat']);

			filenode.attr ('ID', id + '_' + pathToId (file));
			filenode.attr ('ADMID', 'METADATA-DIGITAL-OBJECT');
			filenode.attr ('MINETYPE', calcMimeType (file));
			filenode.attr ('CHECKSUM', calcMD5 (this.config.directory + '/' + file));
			filenode.attr ('CHECKSUMTYPE', 'MD5');
			filenode.attr ('USE', 'TAPE-RESTRICTED-EVENTS');

			loc.attr ('LOCTYPE', 'OTHER');
			loc.attr ('xlink:href', file);
		}.bind (this));

		var metsnode = addNode (this.xml, group, ['mets:file']);
		var loc = addNode (this.xml, metsnode, ['mets:FLocat']);

		metsnode.attr ('ID', id + '_mets');
		metsnode.attr ('MIMETYPE', 'application/xml');
		metsnode.attr ('USE', 'TAPE-RESTRICTED-NOEVENTS');
		loc.attr ('LOCTYPE', 'OTHER');
		loc.attr ('xlink:href', id + '_mets.xml');
	}

	Generator.prototype.addStructureMap = function addStructureMap () {
		var map = addNode (this.xml, this.root, ['mets:structMap']);
		map.attr ('ID', 'something');
		map.attr ('LABEL', 'Physical');
		addNode (this.xml, map, ['mets:div']);
	}

	Generator.prototype.generate = function generate () {
		for ( var key in xUtils.namespaces ) {
			this.root.attr (key, xUtils.namespaces[key]);
		}
		this.root.attr ('xsi:schemaLocations', xUtils.locations.join (' '));

		var files = fUtils.findFiles (this.config.directory);

		this.addAgents (this.config.agents);
		this.addMetaSection (this.config.metadata);
		this.addFilesSection (files);
		this.addStructureMap ();

		return this;
	}

	Generator.prototype.toString = function toString () {
		return this.xml.xml ();
	}

	module.exports = {
		Generator: Generator
	}

} ());
