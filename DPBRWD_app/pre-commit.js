var exec = require('child_process').exec;
var fs = require('fs');

var zeroVersion = "0.0.0";

function execute(command, callback){
    exec(command, function(error, stdout, stderr){ callback(stdout); });
};

function getChangedComponents(names){
	var componentInfoArray = [];
	var componentNames = [];
	names.forEach(function(value){
		var split =value.split('/');

		if(split.length>=3 && split[1] === 'components' ){
			var componentName = split[2];
			if(componentNames.indexOf(componentName)<0){
				componentInfoArray.push({
					componentName: componentName
				});	
			}		
			componentNames.push(componentName);				
		}		
	})

	return componentInfoArray;
	
}


function findBowerJsonFiles(componentInfoArray){	
	componentInfoArray.forEach(function(componentInfo){		
		componentInfo.bowerJsonFile = 'DPBRWD_app/components/'+ componentInfo.componentName+ '/bower.json';
	})

	return componentInfoArray;
}

function getMissingBowerJsonFiles(fileChanges,componentInfoArray){
	var missingBowerChangedComponent= [];
	componentInfoArray.forEach(function(componentInfo){
		if(fileChanges.indexOf(componentInfo.bowerJsonFile)<0) {			
			componentInfo.missingJsonChanged = true;
			missingBowerChangedComponent.push(componentInfo);
		}else{
			componentInfo.missingJsonChanged = false;
		}
	})
	
	return missingBowerChangedComponent;
}

function getBowerJsonVersion(json){
	if(!json) return zeroVersion;
	var obj = JSON.parse(json);
	return obj.version || zeroVersion;
}

function getBowerVersion(componentInfoArray){
	
	componentInfoArray.forEach(function(info){
		info.bowerVersion = zeroVersion;
		if(fs.existsSync(info.bowerJsonFile)){
			info.bowerVersion = getBowerJsonVersion(fs.readFileSync(info.bowerJsonFile,'utf8'));	
		}	
		
		
	})
	return componentInfoArray;
}

function checkAllBowerVersions(bowerInfoArr){	
	// console.log(bowerInfoArr);
	var count = bowerInfoArr.length;	

	var arr = [];
	bowerInfoArr.forEach(function(bowerInfo){			
		var cmd = "git show HEAD~1:" + bowerInfo.bowerJsonFile;		
		execute(cmd, function(bowerJson){
			
			bowerInfo.previousBowerVersion = getBowerJsonVersion(bowerJson);
			arr.push(bowerInfo);
			count -- ;
			if(count == 0){
				processAllBowerInfo(arr);
			}						
					
		})
	})
}

function processAllBowerInfo(bowerInfoArray){
	
	var wrongVersionComponents = []
	bowerInfoArray.forEach(function(bowerInfo){
		
		if (!checkVersionHasIncreased(bowerInfo.bowerVersion, bowerInfo.previousBowerVersion)) {
			wrongVersionComponents.push(bowerInfo);
		}
	})

	if(wrongVersionComponents.length > 0){
		console.log("These components did not increase version number correctly")
		wrongVersionComponents.forEach(function(info){
			console.log("Component: ", info.componentName,", previous: ", info.previousBowerVersion, ", current: ", info.bowerVersion);
		})	

		exitWithCode(1);
	}
}

function checkVersionHasIncreased(currBowerVersion, prevBowerVersion) {
	if(!prevBowerVersion) return true;
	var currVersion = currBowerVersion.split('.');
	var prevVersion = prevBowerVersion.split('.');

	if (currVersion[0] > prevVersion[0]) return true;
	if (currVersion[0] < prevVersion[0]) return false;

	if (currVersion[1] > prevVersion[1]) return true;
	if (currVersion[1] < prevVersion[1]) return false;

	if (currVersion[2] > prevVersion[2]) return true;
	if (currVersion[2] < prevVersion[2]) return false;

	return false;
}


function exitWithError(msg){
	console.log(msg);
	exitWithCode(1);
}

function exitWithCode(code){
	console.log('exit with code: ', code);
	process.exit(code);
} 

execute('git diff --cached --name-only', function(data){		
	// console.log(data); 
	var fileChanges =  data.split('\n');
	var componentInfoArray = getChangedComponents(fileChanges);       
	componentInfoArray = findBowerJsonFiles(componentInfoArray);
	var missingBowerChangedComponent = getMissingBowerJsonFiles(fileChanges, componentInfoArray);

	if(missingBowerChangedComponent.length>0){
		console.log('those components changes without changing version in bower.json file')		
		missingBowerChangedComponent.forEach(function(info){
			console.log("component: " + info.componentName);
		})
		exitWithCode(1);
	}

	componentInfoArray = getBowerVersion(componentInfoArray);	
	checkAllBowerVersions(componentInfoArray);
})
