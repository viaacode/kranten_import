var procses = require ('process');
var fUtils = require ('./utils/file-utils');
var cmdargs = require ('./utils/cmdargs');
var Generator = require ('./utils/generator').Generator;

var options = cmdargs.parse ({
	directory: './cegesoma',
	fileUse: 'DISK-SHARE-EVENTS',
	pid: 'n872v2gr7j',

	agents: [{
		roles: ['CUSTODIAN'],
		type: 'ORGANIZATION',
		name: 'Cegesoma'
	},{
		roles: ['ARCHIVIST'],
		type: 'ORGANIZATION',
		name: 'VIAA'
	}],

	metadata: {
		'MediaHAVEN_external_metadata': {
			'title': { '#text': 'TITRE' },
			'description': {},
			'MDProperties': {
				'dc_titles': {
					'$type': 'list',
					'archief': { '#text': 'OORLOG' },
					'deelarchief': { '#text': 'Clandestien WO I' },
				},
				'CreationDate': { '#text': new Date ().toISOString () },
				'date': { '#text': '1912-12-12' },
				'original_carrier_id': { '#text': 'VOL FOLDER NAME</original_carrier_id' },
				'PID': { '#text': 'UNKNOWN'},
				'CP': { '#text': 'UNKNOWN' },
				'Original_CP': { '#text': 'INSTELLING' }
			}
		}
	}

});

if ( options['md5'] ) {
	var checksum = fUtils.calcMD5 (options['md5']);
	console.log ('md5', '(' + options['md5'] + ')', '=', checksum);
	process.exit (0);
}

options.metadata['MediaHAVEN_external_metadata'].MDProperties.PID['#text'] = options.pid;
options.metadata['MediaHAVEN_external_metadata'].MDProperties.CP['#text'] = options.agents[0].name;

var generator = new Generator (options);

console.log (generator.generate ().toString ());
