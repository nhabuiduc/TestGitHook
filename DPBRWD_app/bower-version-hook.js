var exec = require('child_process').exec;
var fs = require('fs');

var zeroVersion = "0.0.0";

function BowerVersionHook() {
    var $this = this;
    this.gitShowCmd = "git show HEAD:";
    this.code = 0;
    this.componentArr;
    this.doneWithStatus = function (code) {
        console.log('exit with code: ', code);
        console.log($this.componentArr);
        console.log("ERROR: please fix above errors")
        process.exit(code);
    }
    this.getChangeFileChanges = function (callback) {
        execute('git diff --cached --name-only', function (data) {
            console.log(data);
            var fileChanges = data.split('\n').clean("");
            callback(fileChanges);
        })
    }

    this.execute = function () {
        this.getChangeFileChanges(hookWithFileChanges)
    }

    function hookWithFileChanges(fileChanges) {
        var componentInfoArray = getChangedComponents(fileChanges);
        $this.componentArr = componentInfoArray;
        componentInfoArray = addBowerJsonFiles(componentInfoArray);
        componentInfoArray = addMissingBowerJsonFiles(fileChanges, componentInfoArray);
        
        if (checkAndHandleMissingJsonFiles(componentInfoArray)) {            
            setCodeStatus(1);
            done();
            return;
        }
        
        componentInfoArray = addBowerVersion(componentInfoArray);
        
        checkAllBowerVersions(componentInfoArray);
    }
    
    function checkAndHandleMissingJsonFiles(componentInfoArray){
        var missing = [];
        componentInfoArray.forEach(function(info){
            if(info.missingJsonChanged){
                missing.push(info);
            }
        })
        
        if(missing.length > 0 ){
            console.log('those components changes without changing version in bower.json file')
            missing.forEach(function (info) {
                console.log("component: " + info.componentName);
            })
            return true;
        }
        
        return false;
    }

    function done() {
        $this.doneWithStatus($this.code);
    }

    function checkAllBowerVersions(bowerInfoArr) {	
        // console.log(bowerInfoArr);
        var count = bowerInfoArr.length;

        var arr = [];
        bowerInfoArr.forEach(function (bowerInfo) {
            var cmd = $this.gitShowCmd + bowerInfo.bowerJsonFile;
            execute(cmd, function (bowerJson) {

                bowerInfo.previousBowerVersion = getBowerJsonVersion(bowerJson);
                arr.push(bowerInfo);
                count--;
                if (count == 0) {
                    processAllBowerInfo(arr);
                }

            })
        })
    }

    function processAllBowerInfo(bowerInfoArray) {

        var wrongVersionComponents = []
        bowerInfoArray.forEach(function (bowerInfo) {
            if (!checkVersionHasIncreased(bowerInfo.bowerVersion, bowerInfo.previousBowerVersion)) {
                wrongVersionComponents.push(bowerInfo);
            }
        })

        if (wrongVersionComponents.length > 0) {
            console.log("These components did not increase version number correctly")
            wrongVersionComponents.forEach(function (info) {
                console.log("Component: ", info.componentName, ", previous: ", info.previousBowerVersion, ", current: ", info.bowerVersion);
            })

            setCodeStatus(1);
            
        }else {
            setCodeStatus(0);
        }
        
        done();
        
    }

    function setError(msg) {
        console.log(msg);
        setCodeStatus(1);
    }

    function setCodeStatus(code) {
        $this.code = code;              
        //process.exit(code);
    }
}

Array.prototype.clean = function(deleteValue) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] == deleteValue) {         
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};

function execute(command, callback) {
    exec(command, function (error, stdout, stderr) { callback(stdout); });
};

function getChangedComponents(names) {
    var componentInfoArray = [];
    var componentNames = [];
    names.forEach(function (value) {
        var split = value.split('/').clean("");

        if (split.length >= 3 && split[1] === 'components') {
            var componentName = split[2];
            if (componentNames.indexOf(componentName) < 0) {
                componentInfoArray.push({
                    componentName: componentName
                });
            }
            componentNames.push(componentName);
        }
    })

    return componentInfoArray;

}


function addBowerJsonFiles(componentInfoArray) {
    componentInfoArray.forEach(function (componentInfo) {
        componentInfo.bowerJsonFile = 'DPBRWD_app/components/' + componentInfo.componentName + '/bower.json';
    })

    return componentInfoArray;
}

function addMissingBowerJsonFiles(fileChanges, componentInfoArray) {

    componentInfoArray.forEach(function (componentInfo) {
        componentInfo.missingJsonChanged = fileChanges.indexOf(componentInfo.bowerJsonFile) < 0;
    })

    return componentInfoArray;
}

function getBowerJsonVersion(json) {
    if (!json) return zeroVersion;
    var obj = JSON.parse(json);
    return obj.version || zeroVersion;
}

function addBowerVersion(componentInfoArray) {

    componentInfoArray.forEach(function (info) {
        info.bowerVersion = zeroVersion;
        if (fs.existsSync(info.bowerJsonFile)) {
            info.bowerVersion = getBowerJsonVersion(fs.readFileSync(info.bowerJsonFile, 'utf8'));
        }


    })
    return componentInfoArray;
}

function checkVersionHasIncreased(currBowerVersion, prevBowerVersion) {
    if (!prevBowerVersion) return true;
    var currVersion = currBowerVersion.split('.').clean("");
    var prevVersion = prevBowerVersion.split('.').clean("");

    if (+currVersion[0] > prevVersion[0]) return true;
    if (+currVersion[0] < prevVersion[0]) return false;

    if (+currVersion[1] > prevVersion[1]) return true;
    if (+currVersion[1] < prevVersion[1]) return false;

    if (+currVersion[2] > prevVersion[2]) return true;
    if (+currVersion[2] < prevVersion[2]) return false;

    return false;
}



module.exports = BowerVersionHook;
global.execute = execute;