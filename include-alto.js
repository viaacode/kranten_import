var cmdargs = require ('./utils/cmdargs');
var AltoEmbeder = require ('./utils/alto').AltoEmbeder;


var options = cmdargs.parse ({
	directory: './cegesoma'
});

var embeder = new AltoEmbeder ('', options);

// embeder.embed ().toString ();
console.log (embeder.embed ().toString ());

