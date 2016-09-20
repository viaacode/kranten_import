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
		var source = addNode (this.xml, section, [ 'mets:sourceMD' ]);
		var mdwrap = addNode (this.xml, source, [ 'mets:mdWrap' ]);
		var datanode = addNode (this.xml, mdwrap, [ 'mets:xmlData' ]);

		section.attr ('ID', 'SECTION-METADATA-DIGIAL-OBJECT');
		source.attr ('ID', 'METADATA-DIGITAL-OBJECT');
		mdwrap.attr ('MDTYPE', 'OTHER');
		mdwrap.attr ('OTHERMDTYPE', 'VIAA-XML');
		addObjects (this.xml, datanode, data);

		var x = '<mets:amdSec ID="SECTION-METADATA-ENSEMBLE">' +
		'<mets:sourceMD ID="METADATA-ENSEMBLE">' +
		'  <mets:mdWrap MDTYPE="OTHER" OTHERMDTYPE="VIAA-XML">' +
		'    <mets:xmlData>' +
		'      <carrier>' +
		'        <CP>Cegesoma</CP>' +
		'        <Sub_CP/>' +
		'        <PID>n872v2gr7j</PID>' +
		'        <created_on>2015-02-16T21:02:02</created_on>' +
		'        <created_by>Noortje</created_by>' +
		'        <updated_on>2015-08-20T15:08:08</updated_on>' +
		'        <updated_by>Isabelle van Ongeval</updated_by>' +
		'        <type>film</type>' +
		'        <gauge>16mm</gauge>' +
		'        <film_base>acetate</film_base>' +
		'        <image_sound>image with sound</image_sound>' +
		'        <original_carrier_id>LH/O/2472,LH/O/2478</original_carrier_id>' +
		'        <barcode_image_reels>AFLM_LTH_000507</barcode_image_reels>' +
		'        <barcode_sound_reels>AFLM_LTH_000508</barcode_sound_reels>' +
		'        <num_reels>2</num_reels>' +
		'        <title>Trula</title>' +
		'        <alternative_title>Joegoslavische dansgroep TRULA - Zoeklicht, tent. St Lukas - KBVV</alternative_title>' +
		'        <series/>' +
		'        <alternative_series/>' +
		'        <description>Joegoslavische dansgroep Trula wordt gefilmd tijdens één van hun voorstellingen bij het KBVV voor \'Zoeklicht\'.</description>' +
		'        <cast/>' +
		'        <credits/>' +
		'        <genre>' +
		'          <multiselect>reportage</multiselect>' +
		'          <multiselect>television program</multiselect>' +
		'        </genre>' +
		'        <date>1967-12-uu</date>' +
		'        <value_cp>3 somewhat interesting, LR digitisation</value_cp>' +
		'        <digitisation_format>HD (1440x1080)</digitisation_format>' +
		'        <related_record_for_this_film>' +
		'          <multiselect>s46h12zp83</multiselect>' +
		'        </related_record_for_this_film>' +
		'        <language>' +
		'          <multiselect>Sound version without dialogue</multiselect>' +
		'        </language>' +
		'        <subtitles>No</subtitles>' +
		'        <language_subtitles/>' +
		'        <sp_name>CineNova</sp_name>' +
		'        <country>' +
		'          <multiselect>Belgium</multiselect>' +
		'        </country>' +
		'        <material_type>Print</material_type>' +
		'        <brand_of_film_stock>Agfa - Gevaert</brand_of_film_stock>' +
		'        <color_or_bw>B/W</color_or_bw>' +
		'        <length>32 Meter</length>' +
		'        <projection_speed>Unknown</projection_speed>' +
		'        <duration>0:00:00</duration>' +
		'        <aspect_ratio/>' +
		'        <co_sep>Sep</co_sep>' +
		'        <kind_of_sound>magnetic</kind_of_sound>' +
		'        <is_the_sound_sync>Yes</is_the_sound_sync>' +
		'        <is_there_a_sync_point>No</is_there_a_sync_point>' +
		'        <physical_state_film>film in good state</physical_state_film>' +
		'        <physical_state_soundreel>film in very bad state</physical_state_soundreel>' +
		'        <estimate_preparation_time_for_digitisation>1:00:00</estimate_preparation_time_for_digitisation>' +
		'        <estimate_manual_cleaning_time>0:00:00</estimate_manual_cleaning_time>' +
		'        <preservation_problems>' +
		'          <multiselect>perforation damage remarks: meerdere kapotte perforaties</multiselect>' +
		'          <multiselect>vinegar remarks: Beeld is 5,5. Klank is 4,6Ph date: 2015-05-12 pH value:PH 4.6</multiselect>' +
		'          <multiselect>splices remarks: collages aangebracht ter herstelling van scheurtjes</multiselect>' +
		'          <multiselect>Other remarks: kleine brandplek op een beeldje.</multiselect>' +
		'        </preservation_problems>' +
		'        <remarks>Op de geluidsband valt nauwelijks iets te onderscheiden dat als muziek e.d. zou beschreven kunnen worden. Het heeft veel weg van een achterstevoren gespeelde klankband.</remarks>' +
		'        <donor_of_the_archive>B 18237</donor_of_the_archive>' +
		'        <record_status>reviewed by VIAA</record_status>' +
		'        <collection_box_barcode/>' +
		'        <batch_name>FLMB01</batch_name>' +
		'        <batch_id>FLMB01</batch_id>' +
		'        <batch_pickup_date>2015-11-15</batch_pickup_date>' +
		'        <file_duration/>' +
		'        <transfer_lto_date/>' +
		'        <lto_id>IM0068L5</lto_id>' +
		'      </carrier>' +
		'    </mets:xmlData>' +
		'  </mets:mdWrap>' +
		'</mets:sourceMD>' +
		'</mets:amdSec>';
		this.root.append (x);
	}

	Generator.prototype.addFilesSection = function addFilesSection (files) {
		var group = addNode (this.xml, this.root, ['mets:fileSec', 'mets:fileGrp']);

		var id = this.config.pid;

		group.attr ('ID', 'id_' + id);
		group.attr ('ADMID', 'METADATA-ENSEMBLE');
		group.attr ('USE', 'DISK-NOSHARE-EVENTS');

		var id = this.config.pid;
		files.forEach (function (file) {
			var filenode = addNode (this.xml, group, ['mets:file']);
			var loc = addNode (this.xml, filenode, ['mets:FLocat']);

			filenode.attr ('ID', pathToId (file));
			filenode.attr ('ADMID', 'METADATA-DIGITAL-OBJECT');
			filenode.attr ('MIMETYPE', calcMimeType (file));
			filenode.attr ('CHECKSUM', calcMD5 (this.config.directory + '/' + file));
			filenode.attr ('CHECKSUMTYPE', 'MD5');
			filenode.attr ('USE', this.config.fileUse);

			loc.attr ('LOCTYPE', 'OTHER');
			loc.attr ('xlink:href', file);
		}.bind (this));

		var metsnode = addNode (this.xml, group, ['mets:file']);
		var loc = addNode (this.xml, metsnode, ['mets:FLocat']);

		metsnode.attr ('ID', id + '_mets');
		metsnode.attr ('MIMETYPE', 'application/xml');
		// todo make configurable (pick TAPE-RESTRICTED-NOEVENTS by default);
		metsnode.attr ('USE', 'DISK-RESTRICTED-NOEVENTS');
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
