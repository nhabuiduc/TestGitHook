var exec = require('child_process').exec;
var fs = require('fs');

var zeroVersion = "0.0.0";

function execute(command, callback){
    exec(command, function(error, stdout, stderr){ callback(stdout); });
};

execute("git cherry",function(data){
	console.log(data);
    
    data = data.replace(/\+/g,"").replace(/ /g,"");
    
    var commits = data.split('\n');
    
    var allFileChanges = []
    var count = commits.length;
    
    commits.forEach(function(commit){
        var cmd = 'git diff-tree --no-commit-id --name-only -r '+commit;
        if(commit == "") return;
        execute(cmd, function(commitFileChanges){
            addDistinct(allFileChanges,commitFileChanges.split('\n'));
            count--; 
            if(count == 0){
                process.exit(1);
                console.log(allFileChanges);
            }                       
        })  
    })
    
            
})

function addDistinct(sourceArr, destArr){
    destArr.forEach(function(item){
        if(sourceArr.indexOf(item) >=0 ) return;
        sourceArr.push(item);
    })
}



