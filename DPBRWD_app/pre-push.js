/* global execute */
var exec = require('child_process').exec;
var fs = require('fs');
var _ = require("./lodash");
var BowerVersionHook = require("./bower-version-hook");

var hook = new BowerVersionHook();
hook.gitShowCmd = 'git show FETCH_HEAD:';
hook.getFileChanges = function () {
    return execute("git cherry").then(function (data) {
        var commits = data.replace(/\+/g, "").replace(/ /g, "").split('\n').clean("");
        var promises = _.map(commits, function (commit) {
            var cmd = 'git diff-tree --no-commit-id --name-only -r ' + commit;
            return execute(cmd).then(function (commitFileChanges) {
                return commitFileChanges.split('\n').clean("");
            });
        });
        return Promise.all(promises).then(function (commitFileChangesArr) {
            return _.chain(commitFileChangesArr).flatten().uniq();
        });
    })
}

hook.execute().then(function(arr){
    if(hook.checkAndShowError(arr)){
        process.exit(1);
    }
});

