/* global execute */
var BowerVersionHook = require("./bower-version-hook");
var _ = require("./lodash");
var hook = new BowerVersionHook();
hook.getFileChanges = function () {
    return new Promise(function (resolve, reject) {
        execute('git diff --cached --name-only', function (data) {
            resolve(data.split('\n').clean(""));
        })
    })
}
hook.execute().then(function (componentInfoArr) {
     
    _.map(componentInfoArr, function(componentInfo){
        
    })
    
    // _.forEach(arr, function(info){
        
    // })
    console.log(componentInfoArr);
});