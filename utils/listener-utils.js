(function () {

	function abortOnError (error) {
		if ( error ) {
			console.warn (err);
			process.exit ();
		}
	}

	module.exports = {
		abortOnError: abortOnError
	}

} ());
