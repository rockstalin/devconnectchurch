var util = require('./util.js');
var cons = require('../constants.js');
Parse.Cloud.define("remoteControlList", async (request) => {
    var objectId = request.params.objectId;
    var query = new Parse.Query("Remote_Control")
    query.ascending("identifier");
    query.exists("identifier")
    query.limit(1000);
    if (objectId) {
        var object = new(Parse.Object.extend("Remote_Control"))
        object.id = objectId
        return util.fetch(object)
    } else {
        return util.find(query)
    }
});
Parse.Cloud.define("configurationData", async (request) => {
    var identifier = request.params.identifier;
    if(!identifier){
        throw "please supply the identifier"
    }else{
        var query = new Parse.Query("Remote_Control")
        query.equalTo("identifier",identifier)
        return query.first().then(function(objectExisting){
            if(objectExisting)
                return objectExisting
            else
                throw "no object found !!"
        },function(error){
            throw error.message
        })
        
    }
});
Parse.Cloud.define("addRemoteControl", async (request) => {
    var identifier = request.params.identifier;
    var admobInterstitial = request.params.admobInterstitial;
    var admobBanner = request.params.admobBanner;
    var admobNative = request.params.admobNative;
    var email = request.params.email;
    var facebook = request.params.facebook;
    
    if (!identifier) {
        throw "please supply the identifier"
    }else{
        var query = new Parse.Query("Remote_Control")
        query.equalTo("identifier",identifier)
        query.first().then(function(objectExisting){
            if(objectExisting){
                throw identifier+" Identifier already assigned to, objectId = "+objectExisting.id;
                // throw "401",)
            }else{
                var object = new(Parse.Object.extend("Remote_Control"))
                object.set("identifier", identifier)
                if(admobInterstitial)
                    object.set("admobInterstitial", admobInterstitial)
                if(admobBanner)
                    object.set("admobBanner", admobBanner)
                if(admobNative)
                    object.set("admobNative", admobNative)
                if(email)
                    object.set("email", email)
                if(facebook)
                    object.set("facebook", facebook)
                return util.save(object)
            }
        },function(error){
            throw error.message
        })
    }
});
Parse.Cloud.define("updateRemoteControl", async (request) => {
    var objectId = request.params.objectId;
    var identifier = request.params.identifier;
    var admobInterstitial = request.params.admobInterstitial;
    var admobBanner = request.params.admobBanner;
    var admobNative = request.params.admobNative;
    var email = request.params.email;
    var facebook = request.params.facebook;

    if (!objectId) {
        throw "please supply the objectId"
    }
    else {
        var object = new(Parse.Object.extend("Remote_Control"))
        object.id = objectId
        object.fetch().then(function(object) {
            if(admobInterstitial)
                object.set("admobInterstitial", admobInterstitial)
            if(admobBanner)
                object.set("admobBanner", admobBanner)
            if(admobNative)
                object.set("admobNative", admobNative)
            if(email)
                object.set("email", email)
            if(facebook)
                object.set("facebook", facebook)
            if (identifier){
                var query = new Parse.Query("Remote_Control")
                query.equalTo("identifier",identifier)
                query.first().then(function(objectExisting){
                    if(objectExisting &&  !(objectExisting.id === object.id)){
                        throw identifier+" Identifier already assigned to, objectId = "+objectExisting.id
                    }else{
                        object.set("identifier", identifier)
                        return util.save(object)
                    }
                },function(error){
                    throw error
                })
            }
            else{
                return util.save(object)
            }
        }, function(error) {
            throw error
        }); 
    } 
});

Parse.Cloud.define("deleteRemoteControl", async (request) => {
    var objectId = request.params.objectId;
    if (objectId) {
        var object = new(Parse.Object.extend("Remote_Control"))
        object.id = objectId
        object.fetch().then(function(object) {
            return object.destroy()
        }).then(function(object) {
             return object
        }, function(error) {
            throw error
        })
    } else {
        throw "please supply the objectId";
    }
});