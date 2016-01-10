var exec = require('child_process').exec;
var fs = require('fs');
var Promise = require("./bluebird");
var _ = require("./lodash");
var zeroVersion = "0.0.0";

function BowerVersionHook() {
    var $this = this;
    this.gitShowCmd = "git show HEAD:";
    this.getFileChanges = null;

    this.execute = function () {
        return this.getFileChanges().then(function (data) {
            return hookWithFileChanges(data);
        })
    }

    function hookWithFileChanges(fileChanges) {
        console.log(fileChanges);
        var componentInfoPromises = _.chain(fileChanges)
            .map(function (path) { return path.split('/').clean(""); })
            .filter(function (pathSplit) { return pathSplit.length >= 3 && pathSplit[1] === 'components' })
            .map(function (pathSplit) { return pathSplit[2] })
            .uniq()
            .map(function (componentName) { return mapToComponentInfo(componentName, fileChanges) })
            .map(function (componentInfo) {
                return checkWithPreviousBowerVersion(componentInfo);
            })
            .value();

        return Promise.all(componentInfoPromises);
    }

    function mapToComponentInfo(componentName, fileChanges) {
        var bowerJsonFile = 'DPBRWD_app/components/' + componentName + '/bower.json';
        var bowerVersion = zeroVersion;
        if (fs.existsSync(bowerJsonFile)) {
            bowerVersion = getBowerJsonVersion(fs.readFileSync(bowerJsonFile, 'utf8'));
        }
        return {
            componentName: componentName,
            bowerJsonFile: bowerJsonFile,
            missingJsonChanged: fileChanges.indexOf(bowerJsonFile) < 0,
            bowerVersion: bowerVersion
        }
    }

    function checkWithPreviousBowerVersion(componentInfo) {
        var cmd = $this.gitShowCmd + componentInfo.bowerJsonFile;
        return new Promise(function (resolve, reject) {
            execute(cmd, function (bowerJson) {
                var previousBowerVersion = getBowerJsonVersion(bowerJson);
                resolve(_.assign(componentInfo, {
                    previousBowerVersion: previousBowerVersion,
                    versionIncreased: checkVersionHasIncreased(componentInfo.bowerVersion, previousBowerVersion)
                }));
            })
        })
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

function execute(command, callback) {
    exec(command, function (error, stdout, stderr) { callback(stdout); });
};


function getBowerJsonVersion(json) {
    if (!json) return zeroVersion;
    var obj = JSON.parse(json);
    return obj.version || zeroVersion;
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