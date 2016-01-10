/* global execute */
var BowerVersionHook = require("./bower-version-hook");
var fs = require('fs');
var _ = require("./lodash");
var Promise = require("./bluebird");

var hook = new BowerVersionHook();
hook.getFileChanges = function () {
    return execute('git diff --cached --name-only').then(function (data) {
        return data.split('\n').clean("")
    })
}
hook.execute().then(function (componentInfoArr) {
    increaseVersionAllComponents(componentInfoArr);

});

function increaseVersionAllComponents(componentInfoArr) {
    var promises = _.chain(componentInfoArr)
        .filter(function (info) { return !info.versionIncreased })
        .map(function (info) {
            console.log(" - Component: ", info.componentName);
            
             increaseVersion(info). then(function(json){
                fs.writeFileSync(info.bowerJsonFile, bowerJsonStr);
                return stageBowerJsonFile(info.bowerJsonFile);     
             });            
        })
        .value();
      
      Promise.all(promises).then(function(result){
          if(result.length > 0 ){
            console.log("Done: increasing version");    
          }
          
         // process.exit(1);
      })  
}

function stageBowerJsonFile(file) {
    console.log("    staging...");
    return execute("git add " + file);
}

function increaseVersion(info) {
    var bowerJsonStr = fs.readFileSync(info.bowerJsonFile, 'utf8');
    execute("git show HEAD:" + info.bowerJsonFile).then(function(json){
        var versions = JSON.parse(json).version.split(".");
        versions[2] = +versions[2] + 1;
        var newVersion = _(versions).join(".");
        console.log("    automatically increase version to:", newVersion);
        return replaceVersion(bowerJsonStr, newVersion);    
    });        
}

function replaceVersion(json, newVersion) {
    return json.replace(/[\"\']\s*version[^\,]+/, "\"version\": \"" + newVersion + "\"");
}