var util = require('./util.js');
var cons = require('../constants.js');

Parse.Cloud.define("fetchUser", async (request) => {
    var objectId = request.params.objectId;
    var appId = request.headers['app-id']
    if(!appId)
        appId=request.params.appId;
    
    if (!appId) {
        throw "please supply the appId";
    }else if (!objectId) {
        throw "Please supply objectId";
    } else {
        var object = new(Parse.Object.extend("_User"))
        object.id = objectId
        return object.fetch().then(function(object) {
            var app = new(Parse.Object.extend("Admin_App"))
            app.id = appId;
            var user = new(Parse.Object.extend("_User"))
            user.id = objectId;
            var queryPost = new Parse.Query("Regular_Post");
            queryPost.equalTo("user", user);
            queryPost.equalTo("app",app)                
            return queryPost.count().then(function(count) {
                object.set("postCount",count)
                object.dirty = function() {
                    return false;
                };
                return object
            }, function(error) {
                throw error.message
            });
        }, function(error) {
            throw error.message
        });
    }
});
Parse.Cloud.define("fetchUserByNumber", async (request) => {
    var phone = request.params.phone;
    var appId = request.headers['app-id']

    if (!appId) {
        throw "please supply the appId"
    }else if (!phone) {
        throw "Please supply phone"
    } else {
        var app = new(Parse.Object.extend("Admin_App"))
        app.id = appId;
        phone = phone.trim().replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '')
        var query = new Parse.Query("_User");
        query.equalTo("phone",phone)
        query.equalTo("app",app)
        util.find(query)
    }
});
Parse.Cloud.define("fetchUserByFbId", async (request) => {
    var facebookId = request.params.facebookId;
    var appId = request.headers['app-id']
    
    if (!appId) {
        throw "please supply the appId"
    }else if (!facebookId) {
        throw "Please supply facebookId"
    } else {
        var app = new(Parse.Object.extend("Admin_App"))
        app.id = appId;
        var query = new Parse.Query("_User");
        query.equalTo("facebookId",facebookId)
        query.equalTo("app",app)
        util.find(query)
    }
});
Parse.Cloud.define("users", async (request) => {
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
        var query = new Parse.Query("_User");
        query.descending("createdAt");
        query.equalTo("app",app)
        query.limit(limit);
        if (createdAt)
            query.lessThan("createdAt", (new Date(createdAt)));
        return util.find(query)
    }
});
Parse.Cloud.define("loginUserWithPassword", async (request) => {
    var appId = request.headers['app-id']
    var phone = request.params.phone
    var countryCode = request.params.countryCode
    var appVersion = request.params.appVersion
    var timeZone = request.params.timeZone
    var password = request.params.password
    
    if (!appId) {
        throw "please supply the appId"
    }else if (!phone) {
        throw "please supply the phone"
    }else if (!countryCode) {
        throw "please supply the countryCode"
    }else if (!appVersion) {
        throw "please supply the appVersion"
    }else if (!timeZone) {
        throw "please supply the timeZone"
    }else if (!password) {
        throw "please supply the password"
    }else{
        phone = phone.trim().replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '')
        countryCode = countryCode.trim().replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '')

        var username = appId+"_"+phone
        Parse.User.logIn(username, password).then(function(object){
            return object
        },function(error){
            throw "Inavalid phone number or password !!"
        })
    }//else
});
Parse.Cloud.define("signupWithPhoneFB", async (request) => {
    var appId = request.headers['app-id']
    var appVersion = request.params.appVersion
    var timeZone = request.params.timeZone
    var fullName = request.params.fullName
    var gender = request.params.gender
    if(!gender)
    	gender = "male"

    var facebookId = request.params.facebookId
    var phone = request.params.phone
    var countryCode = request.params.countryCode

    var fileName = request.params.fileName
    var password = request.params.password
    
    if (!appId) {
        throw "please supply the appId"
    }else if (!phone && !facebookId) {
        throw "please supply the phone or facebookId"
    }else if (!countryCode && !facebookId) {
        throw "please supply the countryCode or facebookId"
    }else if (!appVersion) {
        throw "please supply the appVersion"
    }else if (!timeZone) {
        throw "please supply the timeZone"
    }else if (!fullName) {
        throw "please supply the fullName"
    }else{
        var app = new(Parse.Object.extend("Admin_App"))
        app.id = appId;

        if(!password){
            password = randomString(32)
        }
        var username = undefined
        var query = new Parse.Query("_User")
            
        if(!facebookId && phone && countryCode){
            phone = phone.trim().replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '')
            countryCode = countryCode.trim().replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '')
            username = appId+"_"+phone
            query.equalTo("username", username)
        }else if(facebookId && !phone && !countryCode){
            username = appId+"_"+facebookId
            query.equalTo("facebookId",facebookId)
        }else{
            username = appId+"_"+phone
            var query1 = new Parse.Query("_User");
            query1.equalTo("facebookId",facebookId)
            var query2 = new Parse.Query("_User");
            query2.equalTo("username",username)
            query =  Parse.Query.or(query1,query2)
        }
        query.equalTo("app", app)
        query.first().then(function(object) {
            if(object){
                if(facebookId && !phone && !countryCode){
                    return object
                }else if(!facebookId && phone && countryCode){
                    throw "User with "+phone+" number already exists"
                }else if(username === object.get("username")){
                    throw "User with "+phone+" number already exists"
                }
                else{
                    object.set("username",username)
                    object.set("phone",phone)
                    object.set("countryCode",countryCode)
                    object.set("gender",gender)
                    object.save(null,{useMasterKey:true}).then(function(object){
                        return object
                    },function(error){
                        throw error.message
                    })
                }
            }else{
                var object = new(Parse.Object.extend("_User"))
                object.set("app", app)
                if(phone)
                    object.set("phone", phone)
                if(countryCode)
                    object.set("countryCode", countryCode)
                object.set("username", username)
                object.set("fullName", fullName)
                object.set("appVersion",appVersion)
                object.set("timeZone",timeZone)
                object.set("gender",gender)

                object.set("password", password)
                object.set("type", "regular")
                object.set("ads", true)
                if(fileName){
                    var url = cons.FILE_URL + "/" + fileName
                    var media = new Parse.File()
                    media['_name'] = fileName
                    media['_url'] = url
                    object.set("profilePicture", media)
                }
                if(facebookId){
                    signup(object,facebookId,undefined,undefined,undefined)
                }
                else{
                    util.save(object)
                }
            }
        }, function(error) {
            throw error.message
        });
    }//else
});

function signup(object,facebookId,objectArchive,appVersion,timeZone){
    if(!objectArchive)
        object.set("facebookId", facebookId)
    var url = "http://graph.facebook.com/"+facebookId+"/picture?width=200"
    var urlExpander = require('expand-url');
    urlExpander.expand(url, function(err, longUrl) {
        if(longUrl){
            Parse.Cloud.httpRequest({
                url: longUrl
            }).then(function(response) {
                return response.buffer;
            }).then(function(buffer) {
                var file = new Parse.File("profilePicture.jpg", {
                    base64: buffer.toString("base64")
                });
                return file.save()
            }).then(function(file) {
                object.set("profilePicture", file)
                object.set("fetchFBPicture", false)
                if(objectArchive){
                    object.set("tempData",facebookId)
                    updateWithOldData(object,objectArchive,appVersion,timeZone)
                }
                else{
                    object.save(null,{useMasterKey:true}).then(function(object){
                        return object
                    },function(error){
                        throw error.message
                    })
                }
            }, function(error) {
                object.set("fetchFBPicture", true)
                object.save(null,{useMasterKey:true}).then(function(object){
                    return object
                },function(error){
                    throw error.message
                })
            })
        }else{
            object.set("fetchFBPicture", true)
            object.save(null,{useMasterKey:true}).then(function(object){
                return object
            },function(error){
                throw error.message
            })
        }
    });
}
Parse.Cloud.define("updateUser", async (request) => {
    var appId = request.headers['app-id']
    var objectId = request.params.objectId;
    var appVersion = request.params.appVersion
    var timeZone = request.params.timeZone

    var fullName = request.params.fullName
    var fileName = request.params.fileName
    var phonePrivate = request.params.phonePrivate
    var facebookPrivate = request.params.facebookPrivate
    var gender = request.params.gender
    
    if (!appId) {
        throw "please supply the appId"
    }else if (!objectId) {
        throw "please supply the objectId"
    }else if (!fullName && !fileName && phonePrivate === undefined && facebookPrivate === undefined) {
        throw "please supply the fullName or fileName"
    }else if (!appVersion) {
        throw "please supply the appVersion"
    }else if (!timeZone) {
        throw "please supply the timeZone"
    }else{
        var object = new(Parse.Object.extend("_User"))
        object.id = objectId
        object.fetch().then(function(object) {
            var objectArchive = new(Parse.Object.extend("User_Archive"))
            objectArchive.set("activity","updateUser")
            if(fileName){
                var url = cons.FILE_URL + "/" + fileName
                var media = new Parse.File()
                media['_name'] = fileName
                media['_url'] = url
                var oldValue= object.get("profilePicture")
                if(oldValue)
                    objectArchive.set("profilePicture",oldValue)
                object.set("profilePicture", media)
            }
            if(fullName){
                var oldValue= object.get("fullName")
                if(oldValue)
                    objectArchive.set("fullName",oldValue)
                object.set("fullName", fullName)
            }
            if(gender){
                var oldValue= object.get("gender")
                if(oldValue)
                    objectArchive.set("gender",oldValue)
                object.set("gender", gender)
            }
            if(!(facebookPrivate=== undefined)){
                if(facebookPrivate === 1 || facebookPrivate === "1" || facebookPrivate === true)
                    facebookPrivate = true
                else
                    facebookPrivate = false
                var oldValue= object.get("facebookPrivate")
                if(oldValue)
                    objectArchive.set("facebookPrivate",oldValue)
                object.set("facebookPrivate", facebookPrivate)
            }
            if(!(phonePrivate === undefined)){
                if(phonePrivate === 1 || phonePrivate === "1" || phonePrivate === true)
                    phonePrivate = true
                else
                    phonePrivate = false
                var oldValue= object.get("phonePrivate")
                if(oldValue)
                    objectArchive.set("phonePrivate",oldValue)
                object.set("phonePrivate", phonePrivate)
            }
            updateWithOldData(object,objectArchive,appVersion,timeZone)
        }, function(error) {
            throw error.message
        });
    }//else
});
Parse.Cloud.define("linkPhoneNumber", async (request) => {
    var appId = request.headers['app-id']
    var objectId = request.params.objectId;
    var appVersion = request.params.appVersion
    var timeZone = request.params.timeZone

    var phone = request.params.phone
    var countryCode = request.params.countryCode
    
    if (!appId) {
        throw "please supply the appId"
    }else if (!objectId) {
        throw "please supply the objectId"
    }else if (!phone) {
        throw "please supply the phone"
    }else if (!countryCode) {
        throw "please supply the countryCode"
    }else if (!appVersion) {
        throw "please supply the appVersion"
    }else if (!timeZone) {
        throw "please supply the timeZone"
    }else{
        var app = new(Parse.Object.extend("Admin_App"))
        app.id = appId;
        var query = new Parse.Query("_User")
        phone = phone.trim().replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '')
        countryCode = countryCode.trim().replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '')
        var username = appId+"_"+phone
        query.equalTo("username", username)
        query.equalTo("app", app)
        query.first().then(function(object) {
            if(object){
                if(objectId === object.id){
                    return object
                }else {
                    throw "User with "+phone+" number already exists"
                }
            }else{
                var object = new(Parse.Object.extend("_User"))
                object.id = objectId
                return object.fetch()
            }
        }).then(function(object) {
            var objectArchive = new(Parse.Object.extend("User_Archive"))
            objectArchive.set("activity","linkPhoneNumber")
            
            var oldValue= object.get("phone")
            if(oldValue)
                objectArchive.set("phone",oldValue)
            var oldValue= object.get("countryCode")
            if(oldValue)
                objectArchive.set("countryCode",oldValue)
            var oldValue= object.get("username")
            if(oldValue)
                objectArchive.set("username",oldValue)
            object.set("phone", phone)
            object.set("countryCode", countryCode)
            object.set("username", username)
            updateWithOldData(object,objectArchive,appVersion,timeZone)
        }, function(error) {
            throw error.message
        });
    }
})
Parse.Cloud.define("linkFacebookAccount", async (request) => {
    var appId = request.headers['app-id']
    var objectId = request.params.objectId;
    var appVersion = request.params.appVersion
    var timeZone = request.params.timeZone

    var facebookId = request.params.facebookId
    
    if (!appId) {
        throw "please supply the appId"
    }else if (!objectId) {
        throw "please supply the objectId"
    }else if (!facebookId) {
        throw "please supply the facebookId"
    }else if (!appVersion) {
        throw "please supply the appVersion"
    }else if (!timeZone) {
        throw "please supply the timeZone"
    }else{
        var app = new(Parse.Object.extend("Admin_App"))
        app.id = appId;
        var query = new Parse.Query("_User")
        query.equalTo("facebookId",facebookId)
        query.equalTo("app", app)
        query.first().then(function(object) {
            if(object){
                if(objectId === object.id){
                    return object
                }else {
                    throw "This Facebook account is already linked to another account !!"
                }
            }else{
                var object = new(Parse.Object.extend("_User"))
                object.id = objectId
                return object.fetch()
            }
        }).then(function(object) {
            var objectArchive = new(Parse.Object.extend("User_Archive"))
            objectArchive.set("activity","linkFacebookAccount")
            var oldValue= object.get("facebookId")
            if(oldValue)
                objectArchive.set("facebookId",oldValue)
            object.set("facebookId", facebookId)
            updateWithOldData(object,objectArchive,appVersion,timeZone)
        }, function(error) {
            throw error.message
        });
    }
})
function updateWithOldData(object,objectArchive,appVersion,timeZone){
    objectArchive.updatedAt = object.updatedAt
    objectArchive.appVersion = object.get("appVersion")
    objectArchive.timeZone = object.get("timeZone")
    objectArchive.set("app",object.get("app"))
    var user = new(Parse.Object.extend("_User"))
    user.id = object.id
    objectArchive.set("user",user)

    object.set("appVersion", appVersion)
    object.set("timeZone", timeZone)

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
Parse.Cloud.define("updateProfilePictureUsingFb", async (request) => {
    var objectId = request.params.objectId;
    var appVersion = request.params.appVersion
    var timeZone = request.params.timeZone

    var facebookId = request.params.facebookId
    
    if (!objectId) {
        throw "please supply the objectId"
    }else if (!facebookId) {
        throw "please supply the facebookId"
    }else if (!appVersion) {
        throw "please supply the appVersion"
    }else if (!timeZone) {
        throw "please supply the timeZone"
    }else{
        var object = new(Parse.Object.extend("_User"))
        object.id = objectId
        object.fetch().then(function(object) {
            var objectArchive = new(Parse.Object.extend("User_Archive"))
            objectArchive.set("activity","updateProfilePictureUsingFb")
            var oldValue= object.get("profilePicture")
            if(oldValue)
                objectArchive.set("profilePicture",oldValue)
            signup(object,facebookId,objectArchive,appVersion,timeZone)
        }, function(error) {
            throw error.message
        });
    }
})
Parse.Cloud.define("changePassword", async (request) => {

    var username = request.params.username;
    var oldPassword = request.params.oldPassword;
    var newPassword = request.params.newPassword;

    var appVersion = request.params.appVersion
    var timeZone = request.params.timeZone
    
    if (!username) {
        throw "please supply the username"
    }else if (!oldPassword) {
        throw "please supply the oldPassword"
    }else if (!newPassword) {
        throw "please supply the countrynewPasswordCode"
    }else if (!appVersion) {
        throw "please supply the appVersion"
    }else if (!timeZone) {
        throw "please supply the timeZone"
    }else{
        Parse.User.logIn(username, oldPassword).then(function(object){
            var objectArchive = new(Parse.Object.extend("User_Archive"))
            objectArchive.set("activity","changePassword")
            object.set("password",newPassword)
            updateWithOldData(object,objectArchive,appVersion,timeZone)
        },function(error){
            throw "Inavalid old password !!"
        })
    }
});
Parse.Cloud.define("logout", async (request) => {
    var objectId = request.params.objectId;
    var appId = request.headers['app-id']
    var installationId = request.params.installationId;

    if (!appId) {
        throw "please supply the appId"
    }else if (!objectId) {
        throw "please supply the objectId"
    }else if (!installationId) {
        throw "please supply the installationId"
    }else{
        var object = new(Parse.Object.extend("_Installation"))
        object.id = installationId
        object.fetch().then(function(object) {
            object.unset("user")
            var query = new Parse.Query("Regular_Category");
            return query.find()
        }).then(function(results) {
            var channelnames = []
            for (var j = 0; j < results.length; j++) {
                channelnames.push(results[j].get("name"))
            }
            object.set("channels", channelnames)
            util.save(object)
        }, function(error) {
             return "There is no such Installation";
        }); 
    }
});
Parse.Cloud.define("searchNumbers", async (request) => {
    var appId = request.headers['app-id']
    var userId = request.params.userId;
    var phoneNos = request.params.phoneNos;
    
    var User = Parse.Object.extend("_User");
    var user = new User();
    user.id = userId;

    var array = [];
    if (phoneNos){
        array = phoneNos.split(',');
    }
    var app = new(Parse.Object.extend("Admin_App"))
    app.id = appId;
    var query = new Parse.Query("_User");
    query.equalTo("app",app)
    query.notEqualTo("objectId",userId)
    query.containedIn("phone", array);
    query.find().then(function(results){
        return results;
    },function(error){
        throw error.message;
    })
});
Parse.Cloud.define("sendPushToUser", async (request) => {
    var userId = request.params.userId;
    var msg = request.params.msg;
    if (!userId) {
        throw "please supply userId"
    }else if (!msg) {
        throw "please supply msg"
    }else{
        var User = Parse.Object.extend("_User");
        var user = new User();
        user.id = userId;
        var pushQuery = new Parse.Query(Parse.Installation);
        pushQuery.equalTo("user", user)
        var data = {
            alert: msg,
            sound: "default",
            type: "user",
            id: userId
        }
        Parse.Push.send({
            where: pushQuery,
            data: data
        }, {
            useMasterKey: true
        })
        .then(function() {
            return "Push sent"
        }, function(error) {
            throw error.message
        });
    }
});
function randomString(length) {
    var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
}
Parse.Cloud.afterSave('_User', function(request) {
    var object = request.object
    var fetchFBPicture = object.get("fetchFBPicture")
    if (fetchFBPicture === false) {
        var tempData = object.get("tempData")
        object.unset("fetchFBPicture")
        object.unset("tempData")
        var facebookId = object.get("facebookId")
        if(tempData)
            facebookId = tempData
        var url = "http://graph.facebook.com/"+facebookId+"/picture?width=1000"
        var urlExpander = require('expand-url');
        urlExpander.expand(url, function(err, longUrl) {
            if(longUrl){
                Parse.Cloud.httpRequest({
                    url: longUrl
                }).then(function(response) {
                    return response.buffer;
                }).then(function(buffer) {
                    var file = new Parse.File("profilePictureFull.jpg", {
                        base64: buffer.toString("base64")
                    });
                    return file.save()
                }).then(function(file) {
                    if(tempData){
                        var objectArchive = new(Parse.Object.extend("User_Archive"))
                        objectArchive.set("activity","updateProfilePictureUsingFbFUll")
                        var oldValue= object.get("profilePictureFull")
                        if(oldValue){
                            objectArchive.set("profilePictureFull",oldValue)
                        }
                        objectArchive.set("app",object.get("app"))
                        // not setting up object directly because it's unsaved and there are changes before saving it
                        var user = new(Parse.Object.extend("_User"))
                        user.id = object.id
                        objectArchive.set("user",user)
                    }
                    object.set("profilePictureFull", file)
                    if(tempData)
                        return objectArchive.save()
                    else
                        return object
                }).then(function(objectArchive) {
                    return object.save(null,{useMasterKey:true})
                }).then(function(file) {
                    
                }, function(error) {
                    console.log(error)
                })
            }else{
                console.log(err)
            }
        });
    }
})