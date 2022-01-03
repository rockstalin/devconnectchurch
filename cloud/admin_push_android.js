var util = require('./util.js');
var cons = require('../constants.js');
Parse.Cloud.define("androidPushList", async (request) => {
    var query = new Parse.Query("Android_Push")
    query.ascending("referenceName");
    query.limit(1000);
    return util.find(query)
});
Parse.Cloud.define("addAndroidPush", async (request) => {
    var referenceName = request.params.referenceName;
    var senderId = request.params.senderId;
    var apiKey = request.params.apiKey;
    
    if (!referenceName) {
        throw "please supply the referenceName";
    }else if (!senderId) {
        throw "please supply the senderId";
    }else if (!apiKey) {
        throw "please supply the apiKey";
    }else{      
        var object = new(Parse.Object.extend("Android_Push"))
        object.set("referenceName", referenceName)
        object.set("senderId", senderId)
        object.set("apiKey", apiKey)
        return util.save(object)
    }
});
Parse.Cloud.define("updateAndroidPush", async (request) => {
    var objectId = request.params.objectId;
    var referenceName = request.params.referenceName;
    var senderId = request.params.senderId;
    var apiKey = request.params.apiKey;

    if (!objectId) {
        throw "please supply the objectId"
    }else if (!referenceName) {
        throw "please supply the referenceName"
    }else if (!senderId) {
        throw "please supply the senderId"
    }else if (!apiKey) {
        throw "please supply the apiKey"
    }else {
        var object = new(Parse.Object.extend("Android_Push"))
        object.id = objectId
        return object.fetch().then(function(object) {
            object.set("referenceName", referenceName)
            object.set("senderId", senderId)
            object.set("apiKey", apiKey)
            return util.save(object)
        }, function(error) {
            throw error
        }); 
    } 
});

Parse.Cloud.define("deleteAndroidPush", async (request) => {
    var objectId = request.params.objectId;
    if (objectId) {
        var object = new(Parse.Object.extend("Android_Push"))
        object.id = objectId
        return object.fetch().then(function(object) {
            return object.destroy()
        }).then(function(object) {
             return object
        }, function(error) {
            throw error.message;
        })
    } else {
        throw "please supply the objectId";
    }
});