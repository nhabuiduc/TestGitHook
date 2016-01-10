/* global execute */
var exec = require('child_process').exec;
var fs = require('fs');
var _ = require("./lodash");
var BowerVersionHook = require("./bower-version-hook");

var hook = new BowerVersionHook();
hook.gitShowCmd = 'git show FETCH_HEAD:';
hook.getFileChanges = function () {
    var cherryPromise = new Promise(function (resolve, reject) {
        execute("git cherry", function (data) {
            resolve(data);
        });
    });

    return cherryPromise.then(function (data) {
        var commits = data.replace(/\+/g, "").replace(/ /g, "").split('\n').clean("");
        var promises= _.map(commits, function (commit) {
                var cmd = 'git diff-tree --no-commit-id --name-only -r ' + commit;
                return new Promise(function (resolve, reject) {
                    execute(cmd, function (commitFileChanges) {
                        resolve(commitFileChanges.split('\n').clean(""));
                    });
                })
            });
        return Promise.all(promises). then(function(commitFileChangesArr){
            return _.flatten(commitFileChangesArr);
        });  
    })

}

hook.execute();

function addDistinct(sourceArr, destArr) {
    destArr.forEach(function (item) {

        if (sourceArr.indexOf(item) >= 0) return;
        sourceArr.push(item);
    })
}



