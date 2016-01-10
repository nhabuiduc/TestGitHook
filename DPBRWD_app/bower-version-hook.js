var exec = require('child_process').exec;
var fs = require('fs');
var Promise = require("./bluebird");
var _ = require("./lodash");
var notFoundVersion = "-1.0.0";

function BowerVersionHook() {
    var $this = this;
    this.gitShowCmd = "git show HEAD:";
    this.getFileChanges = null;
    this.checkAndShowError = checkAndShowError;
    this.execute = function () {
        return this.getFileChanges().then(function (data) {
            return hookWithFileChanges(data);
        })
    }

    function hookWithFileChanges(fileChanges) {
        //console.log(fileChanges);
        var componentInfoPromises = _.chain(fileChanges)
            .map(function (path) { return path.split('/').clean(""); })
            .filter(function (pathSplit) { return pathSplit.length >= 3 && pathSplit[1] === 'components' })
            .map(function (pathSplit) { return pathSplit[2] })
            .uniq()
            .map(function (componentName) { return mapToComponentInfo(componentName, fileChanges) })
            .map(function (componentInfo) { return checkWithPreviousBowerVersion(componentInfo); })
            .value();

        return Promise.all(componentInfoPromises);
    }

    function mapToComponentInfo(componentName, fileChanges) {
        var bowerJsonFile = 'DPBRWD_app/components/' + componentName + '/bower.json';
        var bowerVersion = notFoundVersion;
        var bowerFileExisting = fs.existsSync(bowerJsonFile);
        if (bowerFileExisting) {
            bowerVersion = getBowerJsonVersion(fs.readFileSync(bowerJsonFile, 'utf8'));
        }
        return {
            componentName: componentName,
            bowerJsonFile: bowerJsonFile,
            missingJsonChanged: fileChanges.indexOf(bowerJsonFile) < 0,
            bowerVersion: bowerVersion,
            bowerFileExisting: bowerFileExisting,
            bowerVersionExisting: bowerVersion != notFoundVersion
        }
    }

    function checkWithPreviousBowerVersion(componentInfo) {
        var cmd = $this.gitShowCmd + componentInfo.bowerJsonFile;

        return execute(cmd).then(function (bowerJson) {
            var previousBowerVersion = getBowerJsonVersion(bowerJson);
            return _.assign(componentInfo, {
                previousBowerVersion: previousBowerVersion,
                versionIncreased: checkVersionHasIncreased(componentInfo.bowerVersion, previousBowerVersion)
            });
        })
    }

    function checkAndShowError(componentArr) {
        return _.chain(componentArr)
            .filter(function (f) { return !f.versionIncreased })
            .forEach(function (f) {
                console.log("ERROR: Please increase bower version for component:", f.componentName, ", version: ", f.previousBowerVersion);
            })
            .value()
            .length > 0;
    }        
}

Array.prototype.clean = function (deleteValue) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == deleteValue) {
            this.splice(i, 1);
            i--;
        }
    }
    return this;
};

function execute(command) {
    return new Promise(function (resolve, reject) {
        exec(command, function (error, stdout, stderr) { resolve(stdout); });
    })
};


function getBowerJsonVersion(json) {
    if (!json) return notFoundVersion;
    var obj = JSON.parse(json);
    return obj.version || notFoundVersion;
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