var util = require('./util.js');
Parse.Cloud.define("sms", async (request) => {
    var limit = 10
    var createdAt = request.params.createdAt;
    var query = new Parse.Query("SmsReport");
    query.descending("createdAt");
    query.limit(limit);
    if (createdAt)
        query.lessThan("createdAt", (new Date(createdAt)));
    util.find(query)
});
Parse.Cloud.define("sendVerificationCode", async (request) => {
    var appId = request.headers['app-id']
    var phone = request.params.phone
    var appName = request.params.appName
    var countryCode = request.params.countryCode

    var maximum = 9999;
    var minimum = 1000;
    var code = Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
    // code at first so that user can read without opening the sms
    var text = code+" is your phone verification code for "+appName+" App."
    
    if (!appId) {
        throw "Please supply the appId"
    }else if (!phone) {
        throw "Please supply the phone"
    }else if (!appName) {
        throw "Please supply the appName"
    }else if (!countryCode) {
        throw "Please supply the countryCode"
    } else {
        var app = new(Parse.Object.extend("Admin_App"))
        app.id = appId;
        var query = new Parse.Query("_User");
        query.equalTo("app", app)
        query.equalTo("phone", phone);
        query.first().then(function(object) {
            if(object){
                object.dirty = function() {
                    return false;
                }
                if(object.get("fullName")){
                    object.set("isNew",false)
                }else{
                    object.set("isNew",true)
                }
                util.sms(phone,countryCode,text,code,object,app)
            }else{
                //check for Admin
                var query = new Parse.Query("_User");
                query.equalTo("phone", phone);
                query.first().then(function(object) {
                    if (object && object.get("type") === "admin" && object.get("adminAccess") === true) {
                        object.dirty = function() {
                            return false;
                        }
                        if(object.get("fullName")){
                            object.set("isNew",false)
                        }else{
                            object.set("isNew",true)
                        }
                        util.sms(phone,countryCode,text,code,object,app)
                    }
                    else{
                        util.sms(phone,countryCode,text,code,undefined,app)    
                    }
                }, function(error) {
                    throw error.message
                });
                
            } 
        }, function(error) {
            throw error.message
        });
    }
});
Parse.Cloud.define("sendSMS", async (request) => {
    var phone = request.params.phone
    var countryCode = request.params.countryCode
    var text = request.params.text
    var userId = request.params.userId
    if (!phone) {
        throw "Please supply the phone"
    }else if (!countryCode) {
        throw "Please supply the countryCode"
    }else if (!text) {
        throw "Please supply the text"
    } else {
        var user = undefined
        if(userId){
            user = new(Parse.Object.extend("_User"))
            user.id = userId;
        }
        util.sms(phone,countryCode,text,undefined,user,undefined)
    }
});