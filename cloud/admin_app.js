var util = require('./util.js');
var cons = require('../constants.js');
Parse.Cloud.define("app", async (request) => {
    var objectId = request.params.objectId;
    var query = new Parse.Query("Admin_App")
    query.ascending("name");
    query.exists("name")
    query.limit(1000);
    if (objectId) {
        var object = new(Parse.Object.extend("Admin_App"))
        object.id = objectId
        return util.fetch(object)
    } else {
        return util.find(query)
    }
});
Parse.Cloud.define("addApp", async (request) => {
    var name = request.params.name;
    var defaultType = request.params.defaultType;
    var fileName = request.params.fileName;
    var appVersion = request.params.appVersion;
    var companyName = request.params.companyName;
    var facebookAccessToken = request.params.facebookAccessToken;
    var facebookPostPath = request.params.facebookPostPath;
    var media = undefined
    if (!name) {
        throw "please supply the name";
    }else if (!defaultType) {
        throw "please supply the defaultType";
    }else{
        var object = new(Parse.Object.extend("Admin_App"))
        object.set("name", name)
        object.set("defaultType", defaultType)
        if(fileName){
            var url = cons.FILE_URL + "/" + fileName
            media = new Parse.File()
            media['_name'] = fileName
            media['_url'] = url
            object.set("icon", media)
        }
        if(facebookAccessToken)
            object.set("facebookAccessToken", facebookAccessToken)
        if(facebookPostPath)
            object.set("facebookPostPath", facebookPostPath)
        if(appVersion)
            object.set("appVersion", appVersion)
        if(companyName)
            object.set("companyName", companyName)
        return util.save(object)
    }
});
Parse.Cloud.define("updateApp", async(request) => {
    var objectId = request.params.objectId;
    var name = request.params.name;
    var defaultType = request.params.defaultType;
    var fileName = request.params.fileName;
    var appVersion = request.params.appVersion;
    var companyName = request.params.companyName;
    var facebookAccessToken = request.params.facebookAccessToken;
    var facebookPostPath = request.params.facebookPostPath;
    var media = undefined

    if (!objectId) {
        throw "please supply the objectId";
    }
    else {
        var object = new(Parse.Object.extend("Admin_App"))
        object.id = objectId
        object.fetch().then(function(object) {
            if (name)
                object.set("name", name)
            if(defaultType)
                object.set("defaultType", defaultType)
            if (fileName) {
                var url = cons.FILE_URL + "/" + fileName
                media = new Parse.File()
                media['_name'] = fileName
                media['_url'] = url
                object.set("icon", media)
            }
            if(facebookAccessToken || !(facebookAccessToken === object.get("facebookAccessToken")))
                object.set("facebookAccessToken", facebookAccessToken)
            if(facebookPostPath || !(facebookPostPath === object.get("facebookPostPath")))
                object.set("facebookPostPath", facebookPostPath)
            if(appVersion || !(appVersion === object.get("appVersion")))
                object.set("appVersion", appVersion)
            if(companyName || !(companyName === object.get("companyName")))
                object.set("companyName", companyName)
            return util.save(object)
        }, function(error) {
            throw error.message;
        }); 
    } 
});
Parse.Cloud.define("deleteApp", async (request) => {
    var objectId = request.params.objectId;
    if (objectId) {
        var object = new(Parse.Object.extend("Admin_App"))
        object.id = objectId
        return util.fetchAndDestroy(object)
    } else {
        throw "please supply the objectId";
    }
});