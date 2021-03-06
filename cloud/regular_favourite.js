var util = require('./util.js');
Parse.Cloud.define("favourites", async (request) => {
    var appId = request.headers['app-id']
    var userId = request.params.userId;
    var publishedAt = request.params.publishedAt;

    var limit = 10;
    if (!appId) {
        throw "please supply appId"
    }else if (!userId) {
        throw "please supply userId"
    }else {
        var app = new(Parse.Object.extend("Admin_App"))
        app.id = appId;
        var user = new(Parse.Object.extend("_User"))
        user.id = userId;
        
        var query = new Parse.Query("Regular_Favourite")
        query.limit(limit)
        query.equalTo("app", app)
        query.equalTo("user", user)
        query.include("post")
        query.include("post.category")
        query.include("post.user");
        if(publishedAt)
            query.lessThan("publishedAt", (new Date(publishedAt)))
        query.descending("publishedAt");
        var allPosts = []
        
        query.find().then(function(results) {
            for (var i = 0; i < results.length; i++) {
                var objPost = results[i].get("post")
                if(results[i].get("post"))
                    allPosts.push(objPost)
            }
            var myLikQuery = new Parse.Query("Regular_Activity");
            myLikQuery.equalTo("type", "like");
            myLikQuery.equalTo("fromUser", user);
            myLikQuery.containedIn("post", allPosts);
            return myLikQuery.find()
        }).then(function(allActivities){
        
            for (var i = 0; i < allPosts.length; i++) {
                var objPost = allPosts[i];
                objPost.set("myLike", false);
                objPost.set("myFavourite", true);
                objPost.dirty = function() {
                    return false;
                };
                if(!objPost.get("user")){
	                objPost.set("user",userObj)
	            }
                objPost.set("likes", objPost.get("likes") + objPost.get("fakeLikes"));
                objPost.set("views", objPost.get("views") + objPost.get("fakeViews"));
            
                if(allActivities){
                    for (var j = 0; j < allActivities.length; j++) {
                        if (objPost.id === allActivities[j].get("post").id) {
                            objPost.set("myLike", true);
                            break;
                        }
                    };
                }
            }
            return allPosts
        },function(error){
            throw error.message
        })
    }
});


Parse.Cloud.define("addFavourite", async (request) => {
    var appId = request.headers['app-id']
    var postId = request.params.postId;
    var userId = request.params.userId;
    var appVersion = request.params.appVersion;
    var timeZone = request.params.timeZone;


    if (!appId) {
        throw "please supply appId"
    } else if (!postId) {
        throw "please supply postId"
    }else if (!userId) {
        throw "please supply userId"
    }else if (!appVersion) {
        throw "please supply appVersion"
    } else if (!timeZone) {
        throw "please supply timeZone"
    }else {
        var app = new(Parse.Object.extend("Admin_App"))
        app.id = appId;
        var user = new(Parse.Object.extend("_User"))
        user.id = userId;
        var post = new(Parse.Object.extend("Regular_Post"))
        post.id = postId;

        var query = new Parse.Query("Regular_Favourite");
        query.equalTo("app", app)
        query.equalTo("user", user)
        query.equalTo("post", post)
        query.first().then(function(object) {
            if (object) {
                return object
            }else{
                var object = new(Parse.Object.extend("Regular_Favourite"))
                object.set("app", app)
                object.set("user", user)
                object.set("post", post)
                object.set("appVersion", appVersion)
                object.set("timeZone", timeZone)
                object.save().then(function(object) {
                    post.increment("favourites")
                    return post.save()
                }).then(function(savedObject) {
                    return object
                }, function(error) {
                    throw error.message
                });
            }
        },function(error){
            throw error.message
        })
    }

});
Parse.Cloud.define("deleteFavourite", async (request) => {

    var appId = request.headers['app-id']
    var objectId = request.params.objectId
    var postId = request.params.postId
    var userId = request.params.userId;

    if (!appId && !objectId) {
        throw "please supply appId or objectId"
    }else if (!postId && !objectId) {
        throw "please supply postId or objectId"
    }else if (!userId && !objectId) {
        throw "please supply userId or objectId"
    }else{
        var query = new Parse.Query("Regular_Favourite");
        if(!objectId){
            var app = new(Parse.Object.extend("Admin_App"))
            app.id = appId;

            var user = new(Parse.Object.extend("_User"))
            user.id = userId;
            var post = new(Parse.Object.extend("Regular_Post"))
            post.id = postId;
            
            query.equalTo("app", app)
            query.equalTo("user", user)
            query.equalTo("post", post)
        }
        else {
            query.equalTo("objectId",objectId)
        }
        var objMain;
        query.first().then(function(object) {
            if (object) {
                objMain = object
                return object.destroy()
            } 
        }).then(function(object) {
            if(object){
                var post = object.get("post")
                post.increment("favourites",-1)
                return post.save()
            }
        }).then(function(object) {
            if(object)
                return objMain
            else
                throw "Object not found!!"
        }, function(error) {
            throw error.message
        });
    }
});