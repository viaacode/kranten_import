var fUtils = require ('./utils/file-utils');
var cmdargs = require ('./utils/cmdargs');


var options = cmdargs.parse ({
	directory: './cegesoma'
});
console.log (options);
fUtils.findFiles (options.directory);
