var util = require('./util.js');
var cons = require('../constants.js');
Parse.Cloud.define("hits", async (request) => {
    var createdAt = request.params.createdAt
    var query = new Parse.Query("Daily_API_Hit")
    query.descending("createdAt");
    query.limit(100);
    if (createdAt)
        query.lessThan("createdAt", (new Date(createdAt)));
    util.find(query)
});
Parse.Cloud.define("addHit", async (request) => {
    var date = new Date()
    var strDate = date.getDate()+"-"+(date.getMonth()+1)+"-"+date.getFullYear()
  
    var query = new Parse.Query("Daily_API_Hit")
    query.equalTo("dateStr",strDate)
    query.first().then(function(object){
        if(object){
            object.increment("count")
            util.save(object)
        }else{
            var object = new(Parse.Object.extend("Daily_API_Hit"))
            object.set("count", 0)
            object.set("dateStr",strDate)
            object.set("date",date)
            util.save(object)
        }
    },function(error){
        throw error.message
    })
});