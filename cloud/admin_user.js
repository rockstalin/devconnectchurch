var util = require('./util.js');
var cons = require('../constants.js');
var fs = require('fs');
var path = require('path');

Parse.Cloud.define("addDefaultAdmin", async (request)=> {
    var fullName = cons.SUPER_ADMIN_FULL_NAME
    var username = cons.SUPER_ADMIN_USER
    var password = cons.SUPER_ADMIN_PASSWORD
    var superAdminAccess = true
    var adminAccess = true
    var editorAccess = true
    var ads = false
    
    var query = new Parse.Query("_User")
    query.equalTo("type", "admin")
    return query.count().then(function(count) {
        if(count<1){
            var object = new(Parse.Object.extend("_User"))
            object.set("username", username)
            object.set("fullName", fullName)
            object.set("password", password)
            object.set("type", "admin")
            object.set("ads", ads)
            object.set("superAdminAccess", superAdminAccess)
            object.set("adminAccess", adminAccess)
            object.set("editorAccess", editorAccess)
            
            var filePath = path.join(__dirname, '../public/bison.jpg');
            fs.readFile(filePath, {encoding: 'base64'}, function(err,data){
                if (!err){
                    var dataObj = {
                        base64: data
                    };
                    var file = new Parse.File("bison_logo.jpg", dataObj);
                    file.save().then(function(file){
                        object.set("profilePicture", file)
                        save(object,file)
                    },function(error){
                        save(object,undefined)
                    });    
                }
            });
        }else{
            return "Admin already added."
        }
    }, function(error) {
        throw error.message;
    });

})


function save(objectUser,file){
    return objectUser.save().then(function(objectUser) {
        var object = new(Parse.Object.extend("Admin_App"))
        object.set("name", "A-MyApp")
        object.set("isDefault", true)
        object.set("icon", file)
        object.set("defaultType", "youtube")
        object.set("appVersion", "1.0")
        object.set("companyName", "Bison Code LLP")
        return object.save().then(function(){
            var objectSys = new(Parse.Object.extend("System_Settings"))
            objectSys.set("key", "automaticDbBackup")
            objectSys.set("value", true)
            return util.save(objectSys)
        },function(error){
            throw error.message;    
        })
    }, function(error) {
        throw error.message;
    });
}
Parse.Cloud.define("admins", async (request) => {
    var limit = 1000
    var createdAt = request.params.createdAt;
    var query = new Parse.Query("_User");
    query.ascending("fullName");
    query.equalTo("type","admin")
    query.limit(limit);
    if (createdAt)
        query.lessThan("createdAt", (new Date(createdAt)));
    util.find(query)
});


Parse.Cloud.define("checkUserName",function(request){
    var username = request.params.username
    if (!username) {
        throw "please supply the username"
    }else{
        username = username.toLowerCase()
        var query = new Parse.Query("_User")
        query.equalTo("username", username)
        query.first().then(function(object) {
            if(object){
               throw "username is already taken"
            }else{
                return "username available"
            }
         }, function(error) {
            throw error.message
        });
    }
})
Parse.Cloud.define("loginAdmin", async (request) => {
    var username = request.params.username;
    var password = request.params.password
    
    if (!username) {
        throw "please supply the username"
    }else if (!password) {
        throw "please supply the password"
    }else{
        username = username.toLowerCase()
        Parse.User.logIn(username, password).then(function(object){
            return object
        },function(error){
            throw "Inavalid username or password !!"
        })
    }//else
});
Parse.Cloud.define("addAdmin", async (request) => {
    var superAdminId = request.params.superAdminId
    var fullName = request.params.fullName
    var username = request.params.username
    var password = request.params.password
    var superAdminAccess = request.params.superAdminAccess
    var adminAccess = request.params.adminAccess
    var editorAccess = request.params.editorAccess
    var ads = request.params.ads
    var fileName = request.params.fileName
    var phone = request.params.phone
    
    if (!superAdminId) {
        throw "please supply the superAdminId"
    }else if (!username) {
        throw "please supply the username"
    }else if (!fullName) {
        throw "please supply the fullName"
    }else if (!password) {
        throw "please supply the password"
    }else if (superAdminAccess === undefined) {
        throw "please supply the superAdminAccess"
    }else if (adminAccess === undefined) {
        throw "please supply the adminAccess"
    }else if (editorAccess === undefined) {
        throw "please supply the editorAccess"
    }else if (ads === undefined) {
        throw "please supply the ads"
    }else{
        username = username.toLowerCase()
        var query = new Parse.Query("_User")
        query.equalTo("username", username)
        query.first().then(function(object) {
            if(object){
               throw "username is already taken"
            }else{
                var superAdmin = new(Parse.Object.extend("_User"))
                superAdmin.id = superAdminId;

                var object = new(Parse.Object.extend("_User"))
                object.set("addedBy", superAdmin)
                object.set("username", username)
                object.set("fullName", fullName)
                object.set("password", password)
                object.set("type", "admin")
                object.set("ads", JSON.parse(ads))
                object.set("superAdminAccess", JSON.parse(superAdminAccess))
                object.set("adminAccess", JSON.parse(adminAccess))
                object.set("editorAccess", JSON.parse(editorAccess))

                if(phone)
                    object.set("phone", phone)
                if(fileName){
                    var url = cons.FILE_URL + "/" + fileName
                    var media = new Parse.File()
                    media['_name'] = fileName
                    media['_url'] = url
                    object.set("profilePicture", media)
                }
                util.save(object)
            }
        }, function(error) {
            throw error.message
        });
    }//else
});

Parse.Cloud.define("updateAdmin", async (request) => {
    var superAdminId = request.params.superAdminId;
    var objectId = request.params.objectId;
    var fullName = request.params.fullName
    var username = request.params.username
    var password = request.params.password
    var superAdminAccess = request.params.superAdminAccess
    var adminAccess = request.params.adminAccess
    var editorAccess = request.params.editorAccess
    var ads = request.params.ads
    var fileName = request.params.fileName
    var phone = request.params.phone
    
    if (!superAdminId) {
        throw "please supply the superAdminId"
    }else if (!objectId) {
        throw "please supply the objectId"
    }else{
        var object = new(Parse.Object.extend("_User"))
        object.id = objectId
        object.fetch().then(function(object) {
            var nothingToUpdate = true
            var objectArchive = new(Parse.Object.extend("User_Archive"))
            objectArchive.set("activity","updateAdmin")
            
            if(fileName && (!object.get("profilePicture") || !(fileName === object.get("profilePicture").name()))){
                nothingToUpdate = false
                var url = cons.FILE_URL + "/" + fileName
                var media = new Parse.File()
                media['_name'] = fileName
                media['_url'] = url
                var oldValue= object.get("profilePicture")
                if(oldValue)
                    objectArchive.set("profilePicture",oldValue)
                object.set("profilePicture", media)
            }
            if(fullName && !(fullName === object.get("fullName"))){
                nothingToUpdate = false
                var oldValue= object.get("fullName")
                objectArchive.set("fullName",oldValue)
                object.set("fullName", fullName)
            }
            if(phone && !object.get("phone") || !(phone === object.get("phone"))){
                nothingToUpdate = false
                var oldValue= object.get("phone")
                if(oldValue)
                    objectArchive.set("phone",oldValue)
                object.set("phone", phone)
            }
            if(!(superAdminAccess === undefined) && !(JSON.parse(superAdminAccess) === object.get("superAdminAccess"))){
                nothingToUpdate = false
                var oldValue= object.get("superAdminAccess")
                objectArchive.set("superAdminAccess",oldValue)
                object.set("superAdminAccess", JSON.parse(superAdminAccess))
            }
            if(!(adminAccess === undefined) && !(JSON.parse(adminAccess) === object.get("adminAccess"))){
                nothingToUpdate = false
                var oldValue= object.get("adminAccess")
                objectArchive.set("adminAccess",oldValue)
                object.set("adminAccess", JSON.parse(adminAccess))
            }
            if(!(editorAccess === undefined) && !(JSON.parse(editorAccess) === object.get("editorAccess"))){
                nothingToUpdate = false
                var oldValue= object.get("editorAccess")
                objectArchive.set("editorAccess",oldValue)
                object.set("editorAccess", JSON.parse(editorAccess))
            }
            if(!(ads === undefined) && !(JSON.parse(ads) === object.get("ads"))){
                nothingToUpdate = false
                var oldValue= object.get("ads")
                objectArchive.set("ads",oldValue)
                object.set("ads", JSON.parse(ads))
            }
            if(username && !(username === object.get("username"))){
                username = username.toLowerCase()
                nothingToUpdate = false
                var query = new Parse.Query("_User")
                query.equalTo("username", username)
                query.notEqualTo("objectId", objectId)
                query.first().then(function(objectOld) {
                    if(objectOld){
                       throw "username is already taken"
                    }else{
                        var oldValue= object.get("username")
                        objectArchive.set("username",oldValue)
                        object.set("username", username)
                        updateUser(object,objectArchive,superAdminId)
                    }
                }, function(error) {
                    throw error.message
                });
            }else{
                if(nothingToUpdate)
                    return object
                else
                    updateUser(object,objectArchive,superAdminId)
            }
        }, function(error) {
            throw error.message
        });
    }//else
});
Parse.Cloud.define("changeAdminPassword", async (request) => {

    var superAdminId = request.params.superAdminId;
    var objectId = request.params.objectId;
    var password = request.params.password;
    
    if (!superAdminId) {
        throw "please supply the superAdminId"
    }else if (!objectId) {
        throw "please supply the objectId"
    }else if (!password) {
        throw "please supply the password"
    }else{
        var object = new(Parse.Object.extend("_User"))
        object.id = objectId
        object.fetch().then(function(object) {
            var objectArchive = new(Parse.Object.extend("User_Archive"))
            objectArchive.set("activity","changeAdminPassword")
            object.set("password",password)
            updateUser(object,objectArchive,superAdminId)
         }, function(error) {
            throw error.message
        });
    }
});
function updateUser(object,objectArchive,superAdminId){
    var user = new(Parse.Object.extend("_User"))
    user.id = object.id
    var superAdmin = new(Parse.Object.extend("_User"))
    superAdmin.id = superAdminId;

    objectArchive.updatedAt = object.updatedAt
    objectArchive.set("user",user)
    objectArchive.set("addedBy",object.get("addedBy"))
    object.set("addedBy", superAdmin)

    objectArchive.save().then(function(objectArchive){
        object.save(null,{useMasterKey:true}).then(function(object){
            return object
        },function(error){
            throw error.message
        })
    },function(error){
        throw error.message
    })
}
Parse.Cloud.define("deleteAdmin", async (request) => {
    var objectId = request.params.objectId;
    if (objectId) {
        var object = new(Parse.Object.extend("_User"))
        object.id = objectId
        object.fetch().then(function(object){
            return object.destroy({useMasterKey:true})
        }).then(function(object){
            return object
        },function(error){
            throw error.message
        })
    } else {
        throw "please supply the objectId";
    }
});