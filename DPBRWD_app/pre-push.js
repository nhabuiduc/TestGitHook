/* global execute */
var exec = require('child_process').exec;
var fs = require('fs');

var BowerVersionHook = require("./bower-version-hook");

var hook = new BowerVersionHook();
hook.gitShowCmd = 'git show FETCH_HEAD';
hook.getChangeFileChanges = function (callback) {

    execute("git cherry", function (data) {

        data = data.replace(/\+/g, "").replace(/ /g, "");

        var commits = data.split('\n').clean("");

        var allFileChanges = []
        var count = commits.length;
        console.log(commits);
        commits.forEach(function (commit) {
            var cmd = 'git diff-tree --no-commit-id --name-only -r ' + commit;

            execute(cmd, function (commitFileChanges) {
                addDistinct(allFileChanges, commitFileChanges.split('\n').clean(""));
                count--;
                if (count == 0) {
                    console.log(allFileChanges);
                    callback();

                }
            })
        })
    })
}

hook.execute();

function addDistinct(sourceArr, destArr) {
    destArr.forEach(function (item) {

        if (sourceArr.indexOf(item) >= 0) return;
        sourceArr.push(item);
    })
}



