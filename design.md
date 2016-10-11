# Cegesoma import flow

## Problem description

When archiving digital archives mam expects to find these archives in a certain format.
However Cegesoma delivers digitalized newspapers in a format that is not compatible. In
order to display the newspapers on the website images in jp2 format are required, these
are not always available.

Both of these problems can be overcome by turning the files into a canonical archive that
can be fed to mam.

Note: Cegesoma provided a csv file containing information for all the newspapers that
should be archived. This list does NOT correspond properly to the raw content.


## Observations

The fact that Cegesoma provided an csv file is only a detail. We can provide a generic
process to archive arbitrary sets of tiff files and then use the csv as a seed to start
the generic process for every newspaper found in the csv file. (We might want to keep
track of which entries in the csv do not have corresponding files and report back to
cegesoma on this).

Some of the newspapers have mets files but a lot of them don't. So we will always need to
be able to generate a valid mets file for a set of tiff files. With that in mind, there
are only three relevant pieces of information: the tiff files, the alto file and metadata
(such as title of the newspaper).


## Implementation strategy

Given a directory (for instance on an ftp server, triggered by message on a queue)
- get some pid for this newspaper
- recursively scan that directory for tiff and alto files.
- extract meaningful page numbers from the sub paths of these tiff files.
- move all tiff files under ./tiff/<page-number>.tiff
- generate jp2 counterparts for the tiff files ./jp2/
- Optional: create a zip with the original content `./original.zip`
- generate a mets file (with the metadata) for tiff, jp2 and optional alto file.
  (`<pid>_mets.xml`)
- zip the whole directory structure into `./<pid>.complex`
- hand the zip over to mam

Listing files and directories on some ftp server (based on conditions, extension, regex,
filesize, ...) could be a micro service of its own (sync: http - vs - async: queue?).

jp2 generation is already a micro service. Right now the files are generated on disk,
and the jp2 service needs to be able to read the source files from disk. This ties the
whole process to the system that hosts the file. This could be switched to some ftp server
and use pythons ftp client to put files back there. (ask tina if there are better ways to
decouple the daemons from he file system ?, ftp filesystems can already be mounted ...)

Generating a valid mets file could be a service on its own (depending on what exactly it
is supposed to do)

Zipping a directory structure already has a microservice. (zip_service vs bag_service?)

The ftp_watchfolder creates extra directories the complete it's process, is this allowed
for generation of the mets file and the jp2 files? Can we create a sub directory
`_processing` (or some such) and create the right directory structure under that sub
directory

Some microservices are written in python, others in java. Is there any preference?


## process

EXTERNAL PROCESS =(
	queue json {
		"pid": "123Abc",
		"location": {
			"host": ""
			"path": "ftp://user@password:host.domain/path/to/dir/",
			...
		}
		"mets_info": {
			"title": "Some Title",
			...
		}
	}';
)

ON TRIGGER RECIEVED =(
	db: create pid tracking record;
	queue dir-listing;
)

ON RECOVER RECEIVED =(
	db: get info
	continue met

	queue tiff moves (copy to)
	queue jp2 moves (create into target location)
	queue alto move (copy to, but could be move)
	queue zip original move (create into target location)
)

ON LISTING COMPLETE =(
	count tiffs;
	check alto present;
	db: insert pid data (pid, count, alto, status);

	// shutdon in middle of queueing ...
	queue tiff moves (copy to)
	queue jp2 moves (create into target location)
	queue alto move (copy to, but could be move)
	queue zip original move (create into target location)
)

ON MOVE FILE COMPLETE =(
	if alto { db: mark alto done; }
	eles if zip { db: mark zipped done; }
	else if tift { db: increment done tiff count; }
	else if jp2 { db: increment done jp2 count; }

	if db: pid-all-done { queue mets-generation; }
)

ON METS GENERATION DONE =(
	queue zip into pid.complete
)

alternatively, we could get a pid ourselfs before we start doing the trigger recieved
	probably get pid

alternatively, when copy is not possible, first do tiff move, then queue jp2 generation
	copy pobably

alternatively, if extra zip is not possible, skip the original zip creation.
altervatively, if urn is not ok, user locations object whit things split out.
	probably object.
