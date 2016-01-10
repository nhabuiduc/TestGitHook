/* global process */
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
    if(!checkBowerJsonVersionExits(componentInfoArr)){
        process.exit(1);
    }
    
    increaseVersionAllComponents(componentInfoArr);    
});

function increaseVersionAllComponents(componentInfoArr) {
    var promises = _.chain(componentInfoArr)
        .filter(function (info) { return !info.versionIncreased })
        .map(function (info) {                        
             return increaseVersion(info).then(function(json){
                 
                if(!json) return null;
                fs.writeFileSync(info.bowerJsonFile, json);
                return stageBowerJsonFile(info.bowerJsonFile);     
             });            
        })
        .filter(function(p){ return p != null; })
        .value();
      
      Promise.all(promises).then(function(result){
          if(result.length > 0 ){
            console.log("Done: increasing version");    
          }
      })  
}

function checkBowerJsonVersionExits(componentInfoArr){
    var missingBowerFiles = _.chain(componentInfoArr)
    .filter(function(f){ return !f.bowerFileExisting })
    .forEach(function(f) {  console.log("ERROR: please add bower.json file for component: ", f.componentName) })
    .value();
    
    var missingVersions = 
    _.chain(componentInfoArr)
    .filter(function(f){ return !f.bowerVersionExisting })
    .forEach(function(f) {  console.log("ERROR: please add version to bower.js file for component: ", f.componentName) })
    .value();
    
    return missingVersions.length == 0 && missingBowerFiles.length == 0;
}

function stageBowerJsonFile(file) {
    console.log("    staging...");
    return execute("git add " + file);
}

function increaseVersion(info) {
    var bowerJsonStr = fs.readFileSync(info.bowerJsonFile, 'utf8');
    return execute("git show HEAD:" + info.bowerJsonFile).then(function(json){
        if(!json) return "";
        console.log(" - Component: ", info.componentName);
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