var util = require('./util.js');
Parse.Cloud.define("activity", async (request) => {
    var appId = request.headers['app-id']
    var postId = request.params.postId;
    var type = request.params.type;
    var fetchType = request.params.fetchType;

    var userId = request.params.userId;
    var limit = 10
    var createdAt = request.params.createdAt;
    if (createdAt){
        createdAt = new Date(createdAt)
    }
    
    if (!appId) {
        throw "please supply the appId"
    }else if ((fetchType === "postComment" || fetchType === "polling") && !type) {
        throw "please supply the type which must be comment"
    }else if ((fetchType === "postComment" || fetchType === "polling") && !postId) {
        throw "please supply the postId"
    }else if (fetchType === "polling" && !userId) {
        throw "please supply the userId"
    }else if (fetchType === "polling" && !createdAt) {
        throw "please supply the createdAt"
    }else{
        var app = new(Parse.Object.extend("Admin_App"))
        app.id = appId;

        var post = undefined
        if(postId){
            post = new(Parse.Object.extend("Regular_Post"))
            post.id = postId;
        }
        var fromUser = undefined
        if(userId){
            fromUser = new(Parse.Object.extend("_User"))
            fromUser.id = userId;
        }
        
        var query = new Parse.Query("Regular_Activity");
        query.descending("createdAt");
        query.equalTo("app", app)
        query.equalTo("status","active")
        
        if(fetchType === "polling"){
            limit = 1000;
            query.notEqualTo("fromUser", fromUser)
        }else if(fetchType === "postComment" && !createdAt){
            limit = 5;
        }else if(fromUser){
            query.equalTo("fromUser", fromUser)
        }
        if(post)
            query.equalTo("post", post)
        if(type)
            query.equalTo("type", type);
        query.include("post");
        query.include("fromUser");
        query.lessThan("flagCount",2)
        if (createdAt){
            if(fetchType && fetchType==="polling")
                query.greaterThan("createdAt", createdAt)
            else
                query.lessThan("createdAt", createdAt)
        }
        query.limit(limit);
        query.find().then(function(results) {
            if(fetchType && (fetchType === "polling" || fetchType === "postComment")){
                var refined = [];
                for (var i = 0; i < results.length; i++) {
                    if(fetchType && (fetchType === "polling" || fetchType === "postComment"))
                        var obj = results[results.length-1-i]
                    else
                        var obj = results[i]
                    obj.dirty = function() {
                        return false;
                    };
                    refined.push(obj);
                };
                return refined
            }else
                return results
        }).then(function(results){
            return results
        }, function(error) {
            throw error.message
        });
    }//else
});
Parse.Cloud.define("addActivity", async (request) => {

    var appId = request.headers['app-id']
    var type = request.params.type;
    var userId = request.params.userId;
    var appVersion = request.params.appVersion;
    var timeZone = request.params.timeZone;
    
    var postId = request.params.postId;
    var activityId = request.params.activityId;
    var content = request.params.content;
    
    var status = "active";
    var flagCount = 0
    
    if (!appId) {
        throw "please supply the appId"
    }else if (!type) {
        throw "please supply the type"
    }else if (!userId) {
        throw "please supply the userId"
    }else if (!appVersion) {
        throw "please supply the appVersion"
    }else if (!timeZone) {
        throw "please supply the timeZone"
    }else if (!timeZone) {
        throw "please supply the timeZone"
    }else if (type === "comment" && !content) {
        throw "please supply the content"
    }else if ((type === "comment" || type === "like") && !postId) {
        throw "please supply the postId"
    }else if (type === "flag" && (!activityId && !postId)) {
        throw "please supply the activityId or postId"
    }else{
        var app = new(Parse.Object.extend("Admin_App"))
        app.id = appId;

        var post = undefined
        if(postId){
            post = new(Parse.Object.extend("Regular_Post"))
            post.id = postId;
        }
        var activity = undefined
        if(activityId){
            activity = new(Parse.Object.extend("Regular_Activity"))
            activity.id = activityId;
        }
        var fromUser = new(Parse.Object.extend("_User"))
        fromUser.id = userId;
        
        var object = new(Parse.Object.extend("Regular_Activity"))
        object.set("app", app)
        object.set("fromUser", fromUser)
        object.set("type", type)
        object.set("appVersion", appVersion)
        object.set("timeZone", timeZone)
        object.set("flagCount", flagCount)
        object.set("status", status)
        if(post)
            object.set("post", post)
        if(content)
            object.set("content", content)
        if(activity)
            object.set("activity", activity)

        if (type === "comment") {
             save(object, 1)
        }else{
            var query = new Parse.Query("Regular_Activity");
            query.equalTo("app", app)
            query.equalTo("fromUser", fromUser)
            query.equalTo("type", type)
            query.equalTo("status", "active")
            if(post)
                query.equalTo("post", post)
            if(activity)
                query.equalTo("activity", activity)
            query.first().then(function(objectExisting) {
                if (objectExisting) {
                    if(type === "like")
                        throw "you have already "+"liked"+" this post"
                    else 
                        throw "you have already "+"flagged"+" this post"
                } else {
                    save(object,1)
                }
            }, function(error) {
                throw error.message
            });
        }
    }
});
function save(object,incrementCount) {
    object.save().then(function(object) {
        var type  = object.get("type")
        var post = object.get("post")
        var activity = object.get("activity")
        if(post){
            if (type === "like") {
                post.increment("likes",incrementCount)
            } else if (type === "comment") {
                post.increment("comments",incrementCount)
            } else if (type === "flag") {
                post.increment("flagCount",incrementCount)
            }
            return post.save()
        }else if(type === "flag" && activity){
            activity.increment("flagCount",incrementCount)
            return activity.save()
        }
    }).then(function(savedObject) {
        return object
    }, function(error) {
        throw error.message
    });
}
Parse.Cloud.define("deleteActivity", async (request) => {
    var appId = request.headers['app-id']
    var objectId = request.params.objectId
    var postId = request.params.postId
    var type = request.params.type
    var userId = request.params.userId;

    if (!appId) {
        throw "please supply appId"
    }else if (!type) {
        throw "please supply type"
    }else if (type === "comment" && !objectId) {
        throw "please supply objectId"
    }else if (type === "like" && !postId) {
        throw "please supply postId"
    }else if (!userId) {
        throw "please supply userId"
    }else{
        var app = new(Parse.Object.extend("Admin_App"))
        app.id = appId;
        var fromUser = new(Parse.Object.extend("_User"))
        fromUser.id = userId;
        var post = undefined
        if(postId){
            post = new(Parse.Object.extend("Regular_Post"))
            post.id = postId;
        }

        var query = new Parse.Query("Regular_Activity");
        query.equalTo("app", app)
        query.equalTo("fromUser", fromUser)
        query.equalTo("type", type)
        query.equalTo("status", "active")
        if(post)
            query.equalTo("post", post)
        if(objectId)
            query.equalTo("objectId",objectId)
        query.first().then(function(object) {
            if (object) {
                var fromUserId = object.get("fromUser").id
                if(fromUserId === userId){
                   object.set("status", "inactive");
                   save(object,-1)
                }else{
                    throw "You are not authorised to delete this activity"
                }
            } else {
                throw "Object not found!!"
            }
        }, function(error) {
            throw error.message
        });
    }
});
Parse.Cloud.define("updateComment", async (request) => {
    var objectId = request.params.objectId
    var userId = request.params.userId;
    var content = request.params.content;
    var appVersion = request.params.appVersion;
    var timeZone = request.params.timeZone;
    
    if (!objectId) {
        throw "please supply objectId"
    }else if (!userId) {
        throw "please supply userId"
    }else if (!content) {
        throw "please supply content"
    }else if (!appVersion) {
        throw "please supply the appVersion"
    }else if (!timeZone) {
        throw "please supply the timeZone"
    }else{
        var object = new(Parse.Object.extend("Regular_Activity"))
        object.id = objectId
        object.fetch().then(function(object) {
            var fromUserId = object.get("fromUser").id
            if(fromUserId === userId){
                var oldData =  {}
                oldData.updatedAt = object.updatedAt
                oldData.content = object.get("content")
                oldData.appVersion = object.get("appVersion")
                oldData.timeZone = object.get("timeZone")
                var oldDataArray  =  object.get("oldData")
                if(!oldDataArray){
                    oldDataArray = []
                }
                oldDataArray.push(oldData)
                object.set("oldData",oldDataArray)
                object.set("content",content)
                object.set("appVersion", appVersion)
                object.set("timeZone", timeZone)
                util.save(object)
            }else{
                throw "You are not authorised to edit this comment"
            }
        }, function(error) {
            throw error.message
        });
    }
});