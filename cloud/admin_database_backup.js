var util = require('./util.js');
var cons = require('../constants.js');

Parse.Cloud.define("toggleAutoDbBackup", async (request) => {
    var value = JSON.parse(request.params.value);
    var query = new Parse.Query("System_Settings");
    query.equalTo("key","automaticDbBackup")
    return query.first().then(function(object){
        if(object){
          if(!(value === undefined))
            object.set("value",value)
          else
            object.set("value",!object.get("value"))
          return object.save()
        }else{
          return undefined
        }
    }).then(function(object){
      return object
    },function(error){
      throw error.message;
    })
});

Parse.Cloud.define("dbStats", async (request) => {
    var json = {}
    var query = new Parse.Query("Admin_Database_Backup");
    return query.count().then(function(count){
      json.count = count;
      if(count>0){
        var query = new Parse.Query("Admin_Database_Backup");
        query.descending("createdAt")
        return query.first();
      }
    }).then(function(object){
      if(object){
        json.lastBackup = object.createdAt
      }
      var query = new Parse.Query("System_Settings");
      query.equalTo("key","automaticDbBackup")
      return query.first()
    }).then(function(object){
      if(object){
        json.isAutomaticDbBackup = object.get("value")
      }
      return json;
    },function(error){
      throw error.message;
    })
});

Parse.Cloud.define("dbBackups", async (request) => {
    var createdAt = request.params.createdAt;
    var query = new Parse.Query("Admin_Database_Backup");
    query.descending("createdAt");
    query.include("takenBy")
    query.limit(1000);
    if (createdAt)
        query.lessThan("createdAt", (new Date(createdAt)));
    return  util.find(query)
});

Parse.Cloud.define("createBackup", async (request) => {
    var adminId = request.params.adminId;
    var isAutomatic = request.params.isAutomatic;
    if (adminId || isAutomatic) {
        var backup = require('mongodb-backup')
        var dateStr = new Date().toISOString().replace(/T/, '_').replace(/\..+/, '')
        dateStr = dateStr.replace(/:/g,'.')
        dateStr = dateStr+"_"+(0|Math.random()*9e6).toString(36)+".tar"
        var db_backup_name = cons.DATABASE_NAME+"_"+dateStr
        
        backup({
          uri: cons.DATABASE_URI,
          root: __dirname+'/../public/db_backups',
          tar: db_backup_name,
          callback: function(err) {
            if (err) {
              throw err
            } else {
                var object = new(Parse.Object.extend("Admin_Database_Backup"))
                object.set("tar", db_backup_name)
                if(adminId){
                  var admin = new(Parse.Object.extend("_User"))
                  admin.id = adminId;
                  object.set("takenBy", admin)
                }else{
                  object.set("isAutomatic", true)
                }
                return util.save(object)
            }
          }
        });
    } else {
        throw "please supply adminId"
    }
});
Parse.Cloud.define("restoreBackup", async (request) => {
    var databaseTar = request.params.databaseTar;
    if (databaseTar) {
      var mongoose = require('mongoose');
      mongoose.connect(cons.DATABASE_URI,function(){
          mongoose.connection.db.dropDatabase();
          mongoose.connection.close()
          var restore = require('mongodb-restore')
          restore({
            uri: cons.DATABASE_URI,
            root: __dirname+'/../public/db_backups',
            tar: databaseTar,
            callback: function(err) {
              if (err) {
                throw err
              } else {
                return "Restored !!"
              }
            }
          });
      });
    } else {
        throw "please supply databaseTar"
    }
});
Parse.Cloud.define("deleteBackup", async (request) => {
    var objectId = request.params.objectId;
    if (objectId) {
        var object = new(Parse.Object.extend("Admin_Database_Backup"))
        object.id = objectId
        var path
        object.fetch().then(function(object) {
            path = __dirname+'/../public/db_backups/'+ object.get("tar")
            return object.destroy()
        }).then(function(results) {
          if(path){
            var fs = require('fs');
            fs.exists(path, function(exists) {
              if(exists) {
                fs.unlink(path,function(err){
                     return "done";
                });  
              } else {
                return "done";
              }
            });
          }else{
            return "done"
          }
        }, function(error) {
            throw error.message
        })
    } else {
        throw "please supply the objectId";
    }
});