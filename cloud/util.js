var cons = require('../constants.js');
Parse.Cloud.define("deleteFile", async (request) => {
    var fileName = request.params.fileName;
    if(!fileName){
        throw "please supply fileName";
    }else{
        var url = cons.BASE_URL_LOCAL_Files+"/"+fileName
        Parse.Cloud.httpRequest({
            method: 'DELETE',
            url:url,
            headers: {
                "X-Parse-Application-Id": cons.APP_ID,
                "X-Parse-REST-API-Key" : cons.REST_KEY,
                "X-Parse-Master-Key":cons.MASTER_KEY
            }
        }).then(function(httpResponse){
            return httpResponse;
        },function(error){
            throw error.message;
        })
    }
});
Parse.Cloud.define("deleteAll", async (request) => {
    var appId = request.headers['app-id']
    var className = request.params.className;
    if (!appId) {
        throw "please supply appId";
    } else if (!className) {
        throw "please supply className";
    } else {
        var app = new(Parse.Object.extend("Admin_App"))
        app.id = appId;
        var query = new Parse.Query(className);
        query.limit(1000)
        query.equalTo("app", app)
        recursiveDelete(query, 0)
        return " Objects Are being deleted, please check after few minutes";
    }
});


function recursiveDelete(query, count) {
    query.find().then(function(results) {
        return Parse.Object.destroyAll(results)
    }).then(function(results) {
        count = count + results.length
        if (results.length > 999)
            recursiveDelete(query, count)
    }, function(error) {
        throw error.message;
    })
}
exports.save = async (object) => {
    return object.save().then(async (object) => {
        return object
    }, function(error) {
        throw error.message; 
    });
}
exports.find = async(query) => {
    return query.find().then(async (results) => {
        return results
    }, function(error) {
        throw error.message;
    });
}
exports.fetch = async(object) => {
    return object.fetch().then(async(object) => {
        return object
    }, function(error) {
        throw error.message;
    });
}
exports.destroy = async(object) => {
    return object.destroy().then(async(object) => {
        return "object deleted !!"
    }, function(error) {
        throw error.message;
    });
}
exports.fetchAndDestroy = async(object) => {
    return object.fetch().then(async(object) => {
        return object.destroy()
    }).then(function(object) {
        return "object deleted !!";
    }, function(error) {
        throw error.message;
    })
}
exports.findAndDestroy = async(query) => {
    return query.find().then(async (results) => {
        return Parse.Object.destroyAll(results)
    }).then(function(results) {
        return results
    }, function(error) {
        throw error.message;
    })
}
exports.sendPush = async (pushQuery, data, results) => {
    return Parse.Push.send({
        where: pushQuery,
        data: data
    }, {
        useMasterKey: true
    })
    .then(function() {
        return results;
    }, function(error) {
        return error;
    });
}
exports.sms = async(dst,countryCode,text,code,responseObject,app) => {
    
    var auth_id = cons.SMS_AUTH_ID
    var auth_token = cons.SMS_AUTH_TOKEN
    var src = cons.SMS_SRC

    
    return Parse.Cloud.httpRequest({
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        url: 'https://' + auth_id + ':' + auth_token + '@api.plivo.com/v1/Account/' + auth_id + '/Message/',
        body: {
            "src": src,
            "dst": dst,
            "text": text
        }
    }).then(
    function(results) {
        var uid = results.data.message_uuid[0]
        var object = new(Parse.Object.extend("SmsReport"))
        object.set("text", text)
        object.set("verificationCode", code)
        object.set("to", dst)
        object.set("countryCode", countryCode)
        object.set("from", src);
        object.set("message_uuid", uid);
        object.set("authId", auth_id)
        object.set("authToken", auth_token)
        if(app)
            object.set("app", app)
        if(responseObject)
            object.set("user",responseObject)
        object.save().then(function(object) {
            return object
        }, function(error) {
            throw error.message;
        });
    },
    function(error) {
        throw "Unable to send the message to +"+dst+", please check the number and try again!!";
    })
}
