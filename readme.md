# Kranten listeners.

Collection of microservices that can turn a folder with `tif` and `alto` files into a
compatible format (`.complex`).

## Starting the listeners and options

All listeners will listen and respond to a queue that has to be configured at startup. You
can provide the url on which to connect to the broker, and if the queues are durable or
not. You can also specify whether the queues are durable and if the messages should be
acknowledged (both are true by default).

```sh
$ node ./listeners/mets-listener.js
	--broker='amqp://user:password@host:port/' \
	--listenqueue='worker-requests' \
	--replyqueue='worker-responses' \
	--durable=true \
	--acknowledge=true
```

When the listener loses connection or can not establish a connection at first it will
retry the connection every so often (configurable, defaults to every 10 000 ms) and will
stop all together after a configurable number of failed retries (defaults to 10).

```sh
$ node ... --reconnectTimeout=10500 --reconnectLimit=100
```

Some properties in a message are used so other applications can correlate the requests
that they put on the listen queue to the responses the worker puts on the reply queue.
These properties are copied over to the reply exactly as they are found in the request.

For these listeners the list of correlation properties default to `correlation_id`, `pid`,
and `directory`. The names of these properties are can be configured with an additional
flag.

```sh
$ node ... --correlationProperties=correlation_id,pid,other_field
```

The listeners can also log messages and errors to an elastic search database. This will
only happen if a url is configured to an elastic search.

```sh
$ node ... --elasticsearch='http://host:port/index/type
```


## listeners overview

All listeners work on a directory that is found on disk. They do not work over ftp and
should therefore be run on a machine that has access to the file and directories (same
machine, mounted ftp, other mounted shared storage, ...)


### mets-listener

Will create a valid mets file from the data in the request and the content of the
directory.

Request message structure:

```json
{
	"correlation_id": "4746q1wv0v",
	"pid": "4746q1wv0v",
	"directory": "/export/home/viaa/incoming/cegesoma/UGent_BIB.J.000237_1917-11-03_01_000/_complex",
	"agents": [{ ... }, { ... }],
	"metadata": { ... },
	"fileUse": {
	    "essence": "TAPE-SHARE-EVENTS",
	    "browse": "DISK-SHARE-EVENTS",
	    "metadata": "DISK-SHARE-EVENTS",
	    "video": "TAPE-SHARE-EVENTS",
	    "archive": "TAPE-SHARE-EVENTS"
	}
}
```

`fileUse` is a string that will be placed on the `USE` property of every file tag in the
mets file, depending on the type of the file. For instance `DISK-SHARE-EVENTS`.

`agents` is an array of objects, each object contains the roles that the agent has, its type
and its name. These are put in the `mets:metsHdr` section of the mets file.

```json
"agents": [
	{
		"roles": [ "CUSTODIAN" ],
		"type": "ORGANIZATION",
		"name": "Cegesoma"
	},
	{
		"roles": [ "ARCHIVIST" ],
		"type": "ORGANIZATION",
		"name": "VIAA"
	},
	...
],
```

`metadata` allows you to specify some xml that should be put in the mets file (see object
to xml below). It should be a dictionary of objects (`{ "key": { ... } }` instead of `{
"key": "other value" }`). Every object will be put in its own `mets:amdSec` section in
the mets file, the keys will be used as the id of that section. The generator will expect
there to be at least an entry for `digital_object`.

```json
{
	"digital_object": {
		"MediaHAVEN_external_metadata": {
			...
		}
	},
	"ensemble": {
		"MediaHAVEN_external_metadata": {
			...
		}
	}
}
```

The response is just a boolean indicating success, and the configured correlation
properties.

```json
{
	"success": true,
	"correlation_id": "4746q1wv0v",
	"pid": "4746q1wv0v",
	"directory": "/export/home/viaa/incoming/cegesoma/UGent_BIB.J.000237_1917-11-03_01_000/_complex"
}
```

Object to xml:

- keys are tag names,
- keys staring with `$` are properties,
- the `#text` key indicates the text content of a node.

```json
{
	"tagname":
	{
		"$property": 123,
		"subtag":
		{
			"$property": "455",
			"#text": "Fox and hound"
		},
		"#text": "The quick brown fox jumped over the lazy dog."
	}
}
```

```xml
<tagname property="123">
	<subtag property="456">Fox and hound</subtag>
	The quick brown fox jumped over the lazy dog.
</tagname>
```


Notes:

At some places the pid of the message is used, the pid in messages is used and copied over
in some places. However there is no mechanism to indicate that the worker should do this
for arbitrary fields. It this case, whoever posted the request to the queue is responsible
for making sure the pids match.

An `ensemble` section will be put in the mets file that is a copy of the `digital_object`
section.


### alto-listener

For a directory it will embed the contents of alto files into the mets file in the root of
the directory. Then it will try to link the alto metadata to the files with the
corresponding page numbers.

The directory property has to be the root of the resulting complex file, it should have a
mets file directly in the directory, and a sub directory `alto` with files in it. The
numbers in the files are assumed to correspond.

```json
{
	"correlation_id": "4746q1wv0v",
	"pid": "4746q1wv0v",
	"directory": "/export/home/viaa/incoming/cegesoma/UGent_BIB.J.000237_1917-11-03_01_000/_complex"
}
```

Response example.

```json
{
	"success": true,
	"correlation_id": "4746q1wv0v",
	"pid": "4746q1wv0v",
	"directory": "/export/home/viaa/incoming/cegesoma/UGent_BIB.J.000237_1917-11-03_01_000/_complex"
}
```


### listing-listener

Will list the content of a directory. The request can specify patterns to exclude from the
listing.


```json
{
	"correlation_id": "4746q1wv0v",
	"pid": "4746q1wv0v",
	"directory": "/export/home/viaa/incoming/cegesoma/UGent_BIB.J.000237_1917-11-03_01_000",
	"excludes": [
		"_complex"
	]
}
```

```json
{
	"success": true,
	"correlation_id": "4746q1wv0v",
	"pid": "4746q1wv0v",
	"directory": "/export/home/viaa/incoming/cegesoma/UGent_BIB.J.000237_1917-11-03_01_000",
	"files": [
		"tif/UGent_BIB.J.000237_1917-11-03_01_000-00004.tif",
		"pdf/UGent_BIB.J.000237_1917-11-03_01_000-00004.pdf",
		"jpg/UGent_BIB.J.000237_1917-11-03_01_000-00004.jpg",
		"alto/UGent_BIB.J.000237_1917-11-03_01_000-00004.xml",
		...
		"UGent_BIB.J.000237_1917-11-03_01_000-mets.xml"
	]
}
```


The listing listener can in addition to the default properties also be can be configured
to exclude certain directories by default.

```sh
$ node ./listeners/listing-listener.js ... --excludes='.git,.svn'
```

### copy-listener

Copies a file from one location to another. Both paths are assumed to be accessible on disk.

```json
{
	"correlation_id": "4746q1wv0v",
	"pid": "4746q1wv0v",
	"destination_path": "/export/home/viaa/incoming/cegesoma/UGent_BIB.J.000237_1917-11-03_01_000/_complex/tiff",
	"destination_file": "00001_tiff.tif",
	"source_path": "/export/home/viaa/incoming/cegesoma/UGent_BIB.J.000237_1917-11-03_01_000/",
	"source_file": "00001.tif",
}
```

response:

```json
{
	"success": true,
	"correlation_id": "4746q1wv0v",
	"pid": "4746q1wv0v",
	"destination_path": "/export/home/viaa/incoming/cegesoma/UGent_BIB.J.000237_1917-11-03_01_000/_complex/tiff",
	"destination_file": "00001_tiff.tif",
	"source_path": "/export/home/viaa/incoming/cegesoma/UGent_BIB.J.000237_1917-11-03_01_000/",
	"source_file": "00001.tif",
}
```


### rm-listener

This listener removes a directory.

Request example:

```json
{
	"correlation_id": "4746q1wv0v",
	"pid": "4746q1wv0v",
	"directory": "/export/home/viaa/incoming/cegesoma/UGent_BIB.J.000237_1917-11-03_01_000"
}
```

Response example:

```json
{
	"success": true,
	"correlation_id": "4746q1wv0v",
	"pid": "4746q1wv0v",
	"directory": "/export/home/viaa/incoming/cegesoma/UGent_BIB.J.000237_1917-11-03_01_000"
}
```


### forward-listener

Takes a message from its listen queues and copies it over to the reply queue. This is
used when some worker places messages on a queue which are intended for a service that is
not listening on that queue.

For instance both the jp2 generator and the zipper will signal that their actions were
completed, but both of these are needed to figure out if a directory is ready to have its
mets file generated.

### clean-listener

This listener only takes a listen queue. It reads all the messages from that queue, and
outputs them to stdout (optionally logging them to elastic search when configured). This
may be useful when you want to purge a queue but still want to see a bunch of the
messages.
