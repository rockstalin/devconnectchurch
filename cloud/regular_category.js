var util = require('./util.js');
var cons = require('../constants.js');

Parse.Cloud.define("addFakeDataToCategory", async (request) => {
    var objectId = request.params.objectId;
    if (!objectId) {
        throw "please supply objectId"
    }else{
        var object = new(Parse.Object.extend("Regular_Category"))
        object.id = objectId
        object.fetch().then(function(object) {
            var maximum = cons.FAKE_MINIMUM;
            var minimum = cons.FAKE_MAXIMUM;
            var fake = Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
            object.set("fakeSubscribers",fake)
            return object.save()
        }).then(function(object){
            return object
        }, function(error) {
            throw error.message
        });
    }
}); 

Parse.Cloud.define("categories", async (request) => {

    var appId = request.headers['app-id']
    var userId = request.params.userId;
    if (!appId) {
        throw "please supply appId"
    } else {
        var app = new(Parse.Object.extend("Admin_App"))
        app.id = appId;

        var query = new Parse.Query("Regular_Category");
        query.equalTo("app", app)
        query.exists("name")
        query.exists("subscribers")
        query.exists("fakeSubscribers")
        query.exists("postCount")
        query.limit(1000);
        return query.find().then(function(results) {
            return results
        }).then(function(results){
            if (!userId) {
                for (var i = 0; i < results.length; i++) {
                    var obj = results[i];
                    obj.set("subscribers", obj.get("subscribers") + obj.get("fakeSubscribers"));
                    obj.dirty = function() {
                        return false;
                    };
                    // if(appId === "BLDlTa68t3"){
                    //     var json = {url:'',name:''}
                    //     obj.set("image",json)
                    // }
                }
                return results
            } else {
                var user = new(Parse.Object.extend("_User"))
                user.id = userId;

                var mySubscribeQuery = new Parse.Query("Regular_Subscription");
                mySubscribeQuery.equalTo("user", user)
                mySubscribeQuery.equalTo("app", app)
                mySubscribeQuery.containedIn("category", results);
                return mySubscribeQuery.find().then(function(objects) {
                    for (var i = 0; i < results.length; i++) {
                        var obj = results[i];
                        var mySubscribe = false;
                        for (var j = 0; j < objects.length; j++) {
                            var objSubscribe = objects[j];
                            var cId = objSubscribe.get("category").id;
                            if (cId === obj.id) {
                                mySubscribe = true;
                                break;
                            }
                        };
                        obj.set("mySubscribe", mySubscribe);
                        obj.set("subscribers", obj.get("subscribers") + obj.get("fakeSubscribers"));
                        obj.dirty = function() {
                            return false;
                        };
                    };
                    return results;
                })
            } //else
        }).then(function(results){
            return results;
        }, function(error) {
            throw error.message
        })
    } // else
});

Parse.Cloud.define("addCategory", async (request) => {
    var appId = request.headers['app-id']
    var fileName = request.params.fileName;
    var name = request.params.name;
    
    if (!appId) {
        throw "please supply appId"
    } else if (!name) {
        throw "please supply name"
    } else {
        var maximum = cons.FAKE_MINIMUM;
        var minimum = cons.FAKE_MAXIMUM;
        var fake = Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
        var app = new(Parse.Object.extend("Admin_App"))
        app.id = appId;

        var object = new(Parse.Object.extend("Regular_Category"))
        object.set("app", app)
        object.set("name", name)
        object.set("fakeSubscribers", fake)
        object.set("postCount", 0)
        object.set("subscribers", 0)
        if(fileName){
            var url = cons.FILE_URL + "/" + fileName
            var media = new Parse.File()
            media['_name'] = fileName
            media['_url'] = url
            object.set("image", media)
        }
        return util.save(object)
    }

});
Parse.Cloud.define("updateCategory", async (request) => {
    var objectId = request.params.objectId;
    var appId = request.headers['app-id']
    var fileName = request.params.fileName;
    var name = request.params.name;
    
    if (!objectId) {
        throw "please supply objectId"
    }else if (!appId) {
        throw "please supply appId"
    } else if (!name && !fileName) {
        throw "please supply name or fileName"
    } else {
        var object = new(Parse.Object.extend("Regular_Category"))
        object.id = objectId
        object.fetch().then(function(object) {
            if(name){
                object.set("name", name);
            }
            if(fileName){
                var url = cons.FILE_URL + "/" + fileName
                var media = new Parse.File()
                media['_name'] = fileName
                media['_url'] = url
                object.set("image", media)
                
            }
            util.save(object)
        }, function(error) {
            throw error.message
        });
    }
});
Parse.Cloud.define("deleteCategory", async (request) => {
    var objectId = request.params.objectId;
    if (objectId) {
        var category = new(Parse.Object.extend("Regular_Category"))
        category.id = objectId;

        var queryCount = new Parse.Query("Regular_Post");
        queryCount.equalTo("category",category)
        queryCount.count().then(function(count) {
            if (count > 0) {
                throw "this category contains " + count + " posts, request admin to delete this catgory"
            } else {
                var object = new(Parse.Object.extend("Regular_Category"))
                object.id = objectId
                util.fetchAndDestroy(object)
            } 
        }, function(error) {
            throw error.message;
        });
    } //if
    else {
        throw "please supply the objectId";
    }
});

Parse.Cloud.define("validatePostCount", async (request) => {

    var objectId = request.params.objectId;
    if (objectId) {
        var object = new(Parse.Object.extend("Regular_Category"))
        object.id = objectId
        object.fetch().then(function(object) {
            var queryCount = new Parse.Query("Regular_Post");
            queryCount.equalTo("category",object)
            return queryCount.count()
        }).then(function(count){
            if (count === object.get("postCount")) {
                return "no need to update the category";
            }else{
                object.set("postCount",count)
                util.save(object)
            }
        }, function(error) {
            throw error.message
        });
    }else {
        throw "please supply the objectId";
    }
});
Parse.Cloud.define("validateAllPostCount", async (request) => {
    var queryUser = new Parse.Query("Regular_Category");
    queryUser.limit(1000)
    queryUser.find().then(function(results){
        catHandler(results,0)
    },function(error){
        throw error.message
    })
});
function catHandler(cats,index){
    if(cats.length === index){
        return cats.length+" validated"
    }
    else{
        var oldObj = cats[index]
        var queryCount = new Parse.Query("Regular_Post");
        queryCount.equalTo("category",oldObj)
        queryCount.count().then(function(count){
            if (count === oldObj.get("postCount")) {
                return count
            }else{
                oldObj.set("postCount",count)
                return oldObj.save()
            }
        }).then(function(){
            catHandler(cats,index+1)
        },function(error){
            throw error.message
        })
    }
}