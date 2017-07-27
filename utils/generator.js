var cheerio = require ('cheerio');
var fs = require ('fs');

var xUtils = require ('./xml-utils');
var addNode = xUtils.addNode;
var addObjects = xUtils.addObjects;

var fUtils = require ('./file-utils');
var calcMD5 = fUtils.calcMD5;
var calcMimeType = fUtils.calcMimeType;
var calcSimpleType = fUtils.calcSimpleType;
var Date = require('sugar-date').Date;

(function () {

	function pathToId (path) {
		var extensionIndex = path.lastIndexOf ('.');
		var filenameIndex = path.lastIndexOf ('/', extensionIndex);
		return path.substring (filenameIndex + 1, extensionIndex);
	}

	function Generator (config, params) {
		this.config = config;
		this.params = params || {};
		this.xml = cheerio.load ('<mets:mets></mets:mets>', { xmlMode: true });
		this.root = this.xml ('mets\\:mets');
	}

	Generator.prototype.addAgents = function addAgents (agents) {
		var header = addNode (this.xml, this.root, ['mets:metsHdr']);

		header.attr ('ID', 'VIAA');
		header.attr ('CREATEDATE', new Date ().format ('{dd}-{MM}-{yyyy}T{hh}:{mm}:{ss}.{SSS}Z').toString());
		header.attr ('LASTMODDATE', new Date ().format ('{dd}-{MM}-{yyyy}T{hh}:{mm}:{ss}.{SSS}Z').toString());

		agents.forEach (function (agent) {
			header.append ('<mets:agent />');
			var node = header.children ().last ();
			node.attr ('ROLE', agent.roles[0]);
			node.attr ('TYPE', agent.type);
			node.attr ('OTHERROLE', '');

			node.append ('<mets:name>' + agent.name + '</mets:name>');
		});
	}

	Generator.prototype.addMetaSection = function addMetaSection (id, data) {
		var section = addNode (this.xml, this.root, [ 'mets:amdSec' ]);
		var source = addNode (this.xml, section, [ 'mets:sourceMD' ]);
		var mdwrap = addNode (this.xml, source, [ 'mets:mdWrap' ]);
		var datanode = addNode (this.xml, mdwrap, [ 'mets:xmlData' ]);

		section.attr ('ID', 'SECTION-' + id);
		source.attr ('ID', id);
		mdwrap.attr ('MDTYPE', 'OTHER');
		mdwrap.attr ('OTHERMDTYPE', 'VIAA-XML');
		addObjects (this.xml, datanode, data);
	}

	Generator.prototype.addFilesSection = function addFilesSection (files) {
		var group = addNode (this.xml, this.root, ['mets:fileSec', 'mets:fileGrp']);

		var id = this.config.pid;

		group.attr ('ID', 'id_' + id);
		group.attr ('ADMID', 'METADATA-ENSEMBLE');
		group.attr ('USE', 'DISK-SHARE-EVENTS');

		var id = this.config.pid;
		files.forEach (function (file) {
			var filenode = addNode (this.xml, group, ['mets:file']);
			var loc = addNode (this.xml, filenode, ['mets:FLocat']);

			var mimetype = calcMimeType(file);
            var simpletype = calcSimpleType(file);

			filenode.attr ('ID', 'id_' + pathToId (file));
			filenode.attr ('ADMID', 'METADATA-DIGITAL-OBJECT');
			filenode.attr ('MIMETYPE', mimetype);
			filenode.attr ('CHECKSUM', calcMD5 (this.config.directory + '/' + file));
			filenode.attr ('CHECKSUMTYPE', 'MD5');
			// MAKE SURE TIFS ARE SET TO fileUse.essence, others to fileUse.other
			filenode.attr ('USE', this.config.fileUse[simpletype]);
			loc.attr ('LOCTYPE', 'OTHER');
			loc.attr ('xlink:href', file);
		}.bind (this));

		var metsnode = addNode (this.xml, group, ['mets:file']);
		var loc = addNode (this.xml, metsnode, ['mets:FLocat']);
		metsnode.attr ('ID', 'id_' + id + '_mets');
		metsnode.attr ('MIMETYPE', 'text/xml');
		metsnode.attr ('ADMID', 'METADATA-ENSEMBLE');
		metsnode.attr ('USE', 'DISK-SHARE-EVENTS');
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
		this.root.attr ('xsi:schemaLocation', xUtils.locations.join (' '));

		var files = fUtils.findFiles (this.config.directory);

		this.addAgents (this.config.agents);
		this.addMetaSection ('METADATA-DIGITAL-OBJECT', this.config.metadata.digital_object);
		this.addMetaSection ('METADATA-ENSEMBLE', this.config.metadata.digital_object);
		this.addFilesSection (files);
		this.addStructureMap ();

		if ( this.params.writeToDisk ) {
			this.writeToDisk ();
		}

		return this;
	}

	Generator.prototype.writeToDisk = function writeToDisk () {
		var filename = this.config.directory + '/' + this.config.pid + '_mets.xml';
		fs.writeFileSync (filename, this.toString ());
	}

	Generator.prototype.toString = function toString () {
		return this.xml.xml ();
	}

	module.exports = {
		Generator: Generator
	}

} ());
