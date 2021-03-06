var util = require('./util.js');
Parse.Cloud.define("installation", async (request) => {
    var appId = request.headers['app-id']
    if (!appId) {
        throw "please supply the appId"
    } else {
        var app = new(Parse.Object.extend("Admin_App"))
        app.id = appId;
        var limit = 30
        var createdAt = request.params.createdAt;
        if(!createdAt)
            limit = 30
        var query = new Parse.Query("_Installation");
        query.descending("createdAt");
        query.equalTo("app",app)
        query.include("user")
        query.limit(limit);
        if (createdAt)
            query.lessThan("createdAt", (new Date(createdAt)));
        return query.find({useMasterKey:true}).then(function(results){
            return results
        },function(error){
            throw error.message
        })
    }
});
Parse.Cloud.define("addInstallation", async (request) => {

    var appId = request.headers['app-id']
    var userId = request.params.userId;
    var deviceToken = request.params.deviceToken;
    
    var appVersion = request.params.appVersion;
    var deviceType = request.params.deviceType;
    var timeZone = request.params.timeZone;

    if (!appId) {
        throw "please supply appId"
    } else if (!deviceToken) {
        throw "please supply deviceToken"
    } else if (!appVersion) {
        throw "please supply appVersion"
    } else if (!timeZone) {
        throw "please supply timeZone"
    } else if (!deviceType) {
        throw "please supply deviceType"
    } else {
        var app = new(Parse.Object.extend("Admin_App"))
        app.id = appId;
        
        var user = undefined
        if (userId) {
            user = new Parse.User();
            user.id = userId;
        }

        var channelnames = []
        var query = undefined
        if(user){
            query = new Parse.Query("Regular_Subscription");
            query.equalTo("user", user)
            query.include("category")    
        }else{
            query = new Parse.Query("Regular_Category");
        }
        query.equalTo("app",app)
        query.find().then(function(results) {
            for (var j = 0; j < results.length; j++) {
                if(user)
                    channelnames.push(results[j].get("category").get("name"))
                else
                    channelnames.push(results[j].get("name"))
            }
            var query = new Parse.Query("_Installation");
            query.equalTo("deviceToken", deviceToken);
            return query.first({useMasterKey:true})
        }).then(function(object) {
            if (object) {
                var userOld = object.get("user")
                if (userId && userOld && !(userOld.id === userId)) {
                    object.set("user", user)
                    object.set("channels", channelnames)
                }
                if (!(object.get("timeZone") === timeZone)) {
                    object.set("timeZone", timeZone)
                }
                if (!(object.get("appVersion") === appVersion)) {
                    object.set("appVersion", appVersion)
                }
                util.save(object)
            } else {
                var object = new(Parse.Object.extend("_Installation"))
                object.set("app", app)
                object.set("user", user)
                object.set("deviceToken", deviceToken)
                object.set("appVersion", appVersion)
                object.set("deviceType", deviceType)
                object.set("timeZone", timeZone)
                object.set("channels", channelnames)
                util.save(object)
            }
        }, function(error) {
            throw error.message
        });
    }
});

Parse.Cloud.define("updateInstallation", async (request) => {
    var objectId = request.params.objectId;
    if (objectId) {
        var userId = request.params.userId;
        var deviceToken = request.params.deviceToken;

        var appVersion = request.params.appVersion;
        var timeZone = request.params.timeZone;

        var deviceType = undefined
        var user =undefined
        
        if(userId){
            user = new(Parse.Object.extend("_User"))
            user.id = userId;
        }
        if(deviceToken){
            deviceType = "ios"
        }

        var object = new(Parse.Object.extend("_Installation"))
        object.id = objectId
        object.fetch({useMasterKey:true}).then(function(object) {
            if (user)
                object.set("user", user)
            if (deviceToken)
                object.set("deviceToken", deviceToken)
            if (deviceType)
                object.set("deviceType", deviceType)
            if (appVersion)
                object.set("appVersion", appVersion)
            if (timeZone)
                object.set("timeZone", timeZone)
            
            util.save(object)
        }, function(error) {
            throw error.message
        }); 
    } else {
        throw "please supply the objectId"
    }
});