(function () {

	/*
	 * Error [920]: METS: METS does not validate: Element
	 * '{http://www.loc.gov/METS/}mets', attribute
	 * '{http://www.w3.org/2001/XMLSchema-instance}schemaLocations': The attribute
	 * '{http://www.w3.org/2001/XMLSchema-instance}schemaLocations' is not allowed., line
	 * 2
	 */

	var namespaces = {
		'xmlns:mets': 'http://www.loc.gov/METS/',
		'xmlns:premis': 'info:lc/xmlns/premis-v2',
		'xmlns:revtmd': 'http://nwtssite.nwts.nara/schema/',
		'xmlns:xlink': 'http://www.w3.org/1999/xlink',
		'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
	};

	var locations = [
		'http://www.loc.gov/METS/ http://www.loc.gov/standards/mets/mets.xsd',
		'http://www.loc.gov/mods/v3 http://www.loc.gov/standards/mods/v3/mods-3-2.xsd',
		'http://www.loc.gov/mix/v10 http://www.loc.gov/standards/mix/mix10/mix10.xsd'
	]

	function addNode (xml, node, tags) {
		for ( var i = 0; i < tags.length; i++ ) {
			var tag = tags[i];
			node.append ('<' + tag + ' />');
			node = xml (tag.replace (':', '\\:'), node).last ();
		}
		return node;
	}

	function addObjects (xml, node, objects) {
		for ( var key in objects ) {
			var sub = addNode (xml, node, [key]);
			completeNode (xml, sub, objects[key]);
		}
	}

	function completeNode (xml, node, data) {
		var objects = {};
		for ( var key in data ) {
			if ( key.startsWith ('$') ) { node.attr (key.substr (1), data[key]); }
			else if ( key === '#text' ) { node.append (data[key]); }
			else if (data[key] instanceof Array) { 
				for (var i = 0; i < data[key].length; i++) {
					var sub = addNode (xml, node, [key]);
					completeNode (xml, sub, data[key][i]);
			}}
			else { objects[key] = data[key] }
		}
		addObjects (xml, node, objects);
	}

	module.exports = {
		addObjects: addObjects,
		addNode: addNode,
		namespaces: namespaces,
		locations: locations
	}

} ());
