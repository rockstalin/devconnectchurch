var util = require('./util.js');
var cons = require('../constants.js');
var fs = require('fs');
Parse.Cloud.define("appToJson", async (request) => {
    var query = new Parse.Query("Push_Certificates_iOS")
    query.exists("bundleIdentifier")
    query.limit(1000);
    query.find()
    var json ={}
    return query.find().then(function(results) {
        json.ios = results
        var query = new Parse.Query("Android_Push")
        query.ascending("referenceName");
        query.limit(1000);
        return query.find()
    }).then(function(results) {
        json.android = results
        return json
    }, function(error) {
        throw error.message;
    })
});
Parse.Cloud.define("pushCertificatesIOS", async (request) => {
    var objectId = request.params.objectId;
    var query = new Parse.Query("Push_Certificates_iOS")
    query.descending("createdAt");
    query.exists("bundleIdentifier")
    query.limit(1000);
    if (objectId) {
        var object = new(Parse.Object.extend("Push_Certificates_iOS"))
        object.id = objectId
        return util.fetch(object)
    } else {
        return util.find(query)
    }
});
Parse.Cloud.define("addPushCertificatesIOS", async (request) => {
    var bundleIdentifier = request.params.bundleIdentifier;
    var p12Pro = request.params.p12Pro;
    var p12Dev = request.params.p12Dev;
    if (!bundleIdentifier) {
        throw "please supply the bundleIdentifier";
    }else{
        var object = new(Parse.Object.extend("Push_Certificates_iOS"))
        object.set("bundleIdentifier", bundleIdentifier)
        if(p12Pro)
            object.set("p12Pro", p12Pro)
        if(p12Dev)
            object.set("p12Dev", p12Dev)
        return util.save(object)
    }
});
Parse.Cloud.define("updatePushCertificatesIOS", async (request) => {
    var objectId = request.params.objectId;
    var bundleIdentifier = request.params.bundleIdentifier;
    var p12Pro = request.params.p12Pro;
    var p12Dev = request.params.p12Dev;
    if (!objectId) {
        throw "please supply the objectId";
    }
    else {
        var object = new(Parse.Object.extend("Push_Certificates_iOS"))
        object.id = objectId
        object.fetch().then(function(object) {
            if (bundleIdentifier)
                object.set("bundleIdentifier", bundleIdentifier)
            if(p12Pro || p12Dev){
                if(p12Pro && object.get("p12Pro")){
                    var path = __dirname+'/../p12/'+ object.get("p12Pro")
                    object.set("p12Pro", p12Pro)
                    fs.exists(path, function(exists) {
                        if(exists) {
                            fs.unlink(path,function(err){
                                if(p12Dev && object.get("p12Dev")){
                                    return handleP12Dev(object,p12Dev)
                                }
                            });
                        }else{
                            if(p12Dev && object.get("p12Dev")){
                                return handleP12Dev(object,p12Dev)
                            }
                        }
                    });
                }else if(p12Dev && object.get("p12Dev")){
                    return handleP12Dev(object,p12Dev)
                }else{
                    if(p12Pro)
                        object.set("p12Pro", p12Pro)
                    if(p12Dev)
                        object.set("p12Dev", p12Dev)
                }
                
            }else{
               return util.save(object)
            }            
        }, function(error) {
            throw error
        }); 
    } 
});
function handleP12Dev (object,p12Dev){
    var path = __dirname+'/../p12/'+ object.get("p12Dev")
    object.set("p12Dev", p12Dev)
    fs.exists(path, function(exists) {
        if(exists) {
            fs.unlink(path,function(err){
                return util.save(object)
            });
        }else{
            return util.save(object)
        }
    });
}
function handleP12DevDelete(p12DevPath){
    if(p12DevPath){
        fs.exists(p12DevPath, function(exists) {
          if(exists) {
            fs.unlink(p12DevPath,function(err){
                return "done"
            });  
          } else {
            return "done"
          }
        });
    }else{
        return "done"
    }
}
Parse.Cloud.define("deletePushCertificatesIOS", async (request) => {
    var objectId = request.params.objectId;
    if (objectId) {
        var object = new(Parse.Object.extend("Push_Certificates_iOS"))
        object.id = objectId
        var p12ProPath,p12DevPath
        object.fetch().then(function(object) {
            if(object.get("p12Pro"))
                p12ProPath = __dirname+'/../p12/'+ object.get("p12Pro")
            if(object.get("p12Dev"))
                p12DevPath = __dirname+'/../p12/'+ object.get("p12Dev")
            return object.destroy()
        }).then(function(results) {
              if(p12ProPath){
                    fs.exists(p12ProPath, function(exists) {
                        if(exists) {
                            fs.unlink(p12ProPath,function(err){
                                return handleP12DevDelete(p12DevPath)
                            });  
                        } else {
                            return handleP12DevDelete(p12DevPath)
                        }
                    });
                }else{
                    return handleP12DevDelete(p12DevPath)
                }
        }, function(error) {
            throw error
        })
    } else {
        throw "please supply the objectId";
    }
});