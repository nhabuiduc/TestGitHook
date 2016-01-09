var exec = require('child_process').exec;
var fs = require('fs');

var zeroVersion = "0.0.0";

function execute(command, callback){
    exec(command, function(error, stdout, stderr){ callback(stdout); });
};

Array.prototype.clean = function(deleteValue) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] == deleteValue) {         
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};

execute("git cherry",function(data){
	
    
    data = data.replace(/\+/g,"").replace(/ /g,"");
    
    var commits = data.split('\n').clean("");
    
    var allFileChanges = []
    var count = commits.length;
    console.log(commits);
    commits.forEach(function(commit){
        var cmd = 'git diff-tree --no-commit-id --name-only -r '+commit;
        
        execute(cmd, function(commitFileChanges){            
            addDistinct(allFileChanges,commitFileChanges.split('\n').clean(""));
            count--; 
            if(count == 0){
                console.log(allFileChanges);
                process.exit(1);
                
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



