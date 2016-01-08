var exec = require('child_process').exec;
var fs = require('fs');

var zeroVersion = "0.0.0";

function execute(command, callback){
    exec(command, function(error, stdout, stderr){ callback(stdout); });
};

execute("git cherry",function(data){
	console.log(data);
})

process.exit(1);
