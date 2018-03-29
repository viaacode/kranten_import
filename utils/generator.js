var cheerio = require ('cheerio');
var fs = require ('fs');
const path = require('path');

var xUtils = require ('./xml-utils');
var addNode = xUtils.addNode;
var addObjects = xUtils.addObjects;

var fUtils = require ('./file-utils');
var calcMD5 = fUtils.calcMD5;
var calcMimeType = fUtils.calcMimeType;
var calcSimpleType = fUtils.calcSimpleType;
var Date = require('sugar-date').Date;
var Logger = require('./logger').Logger;

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
		header.attr ('CREATEDATE', new Date ().format ('{yyyy}-{MM}-{dd}T{hh}:{mm}:{ss}.{SSS}Z').toString());
		header.attr ('LASTMODDATE', new Date ().format ('{yyyy}-{MM}-{dd}T{hh}:{mm}:{ss}.{SSS}Z').toString());

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

			// PID metadata for pdf, original_mets and mets
			if (pathToId(file).indexOf('tif') == -1 &&  pathToId(file).indexOf('jp2') == -1 && pathToId(file).indexOf('jpg') == -1 && file.indexOf('complex') == -1 && pathToId(file).indexOf('alto') == -1) {
				var mdid = pathToId(file);
				filenode.attr ('ADMID', 'METADATA-DIGITAL-OBJECT-' + mdid);

				var digidata = this.xml ('mets\\:amdSec[ID=SECTION-METADATA-ENSEMBLE]');
				var amdsec = digidata.clone ();
				this.xml ('mets\\:amdSec').last ().after (amdsec);

				amdsec.attr ('ID', 'SECTION-METADATA-DIGITAL-OBJECT-' + mdid); 
				var source = this.xml ('mets\\:sourceMD', amdsec);
				source.attr ('ID', 'METADATA-DIGITAL-OBJECT-' + mdid);
				var have = this.xml ('MediaHAVEN_external_metadata', source);

				var pid = this.xml ('PID', have);
				var prevpid = pid.text();
				var newpid = pathToId(file);
				pid.text(newpid);
			} else {
				filenode.attr ('ADMID', 'METADATA-ENSEMBLE');
			}

			filenode.attr ('MIMETYPE', mimetype);
			filenode.attr ('CHECKSUM', calcMD5 (this.config.directory + '/' + file));
			filenode.attr ('CHECKSUMTYPE', 'MD5');
			// MAKE SURE TIFS ARE SET TO fileUse.essence, others to fileUse.other
			filenode.attr ('USE', this.config.fileUse[simpletype]);
			loc.attr ('LOCTYPE', 'OTHER');
			loc.attr ('xlink:href', file);
		}.bind (this));

		// add mets because not retrieved from file listing
		var metsnode = addNode (this.xml, group, ['mets:file']);
		var loc = addNode (this.xml, metsnode, ['mets:FLocat']);
		metsnode.attr ('ID', 'id_' + id + '_mets');
		metsnode.attr ('MIMETYPE', 'text/xml');
		metsnode.attr ('ADMID', 'METADATA-DIGITAL-OBJECT-' + id + '_mets');
		metsnode.attr ('USE', 'DISK-SHARE-EVENTS');
		loc.attr ('LOCTYPE', 'OTHER');
		loc.attr ('xlink:href', id + '_mets.xml');
		var digidata = this.xml ('mets\\:amdSec[ID=SECTION-METADATA-ENSEMBLE]');
		var amdsec = digidata.clone ();
		this.xml ('mets\\:amdSec').last ().after (amdsec);

		amdsec.attr ('ID', 'SECTION-METADATA-DIGITAL-OBJECT-' + id + '_mets');
		var source = this.xml ('mets\\:sourceMD', amdsec);
		source.attr ('ID', 'METADATA-DIGITAL-OBJECT-' + id + '_mets');
		var have = this.xml ('MediaHAVEN_external_metadata', source);

		var pid = this.xml ('PID', have);
		var prevpid = pid.text();
		var newpid = prevpid + '_mets';
		pid.text(newpid);
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
		// Check if we have exactly the same files for tiff and jp2
		var files = fUtils.findFiles (this.config.directory);
		var tiffFiles = files.filter((f) => {return f.indexOf('.tif') > 0} );
        var jp2Files = files.filter((f) => {return f.indexOf('.jp2') > 0} );

        let filesMatch = true;
        // Loop over all tif files. If a tif has a matching jp2 file, remove the jp2 from the list
        for (let tiff of tiffFiles) {
            const basename = path.basename(tiff, path.extname(tiff));
            const toCheckName = basename.replace(/_tif/g, '') + '_jp2';
            let exists = false;
            for (let jp2 of jp2Files) {
                const jp2basename = path.basename(jp2, path.extname(jp2));
                if (jp2basename === toCheckName) {
                    var index = jp2Files.indexOf(jp2);
                    jp2Files.splice(index, 1);
                    exists = true;
                }
            }
            if (!exists) console.log('There is no matching file for ' + basename);
            filesMatch = filesMatch && exists;
        }

		// After looping over all TIF files, JP2 files should be empty. There should not be more JP2 files compared to TIF files.
        if (!filesMatch) {
            if (jp2Files.length > 0) {
                console.log('There are more jp2 files than tif files');
                for (let jp2 of jp2Files) {
                    console.log(jp2 + ' does not have a matching tif file');
                }
            } else {
                console.log('There are probably more tif files than jp2 files. Look above for missing JP2 files');
            }
            throw ('Files do not match!!! Abort!!');
        }

		this.addAgents (this.config.agents);
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
