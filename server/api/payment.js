var router = require('express').Router();
var async = require('async');

router.post('/api/recharge', function(request, response){
    
    var user, amount;
    
//    async.waterfall([
//        
//        // check parameter
//        function(callback){
            if(!request.body.user || !request.body.amount){
//                callback({message:'no parameter', error:{}, statusCode:400});
            }
            
            user = request.body.user;
            amount = request.body.amount;
            console.log(user);
            console.log(amount);
//            
//            callback(null);
//        },
//        
//        // send data to I'MPORT
//        function(callback){},
//        
//        // save data to db
//        function(callback){}
//        
//    ], function(err, result){
//        if(err){
//            response.statusCode = err.statusCode;
//            response.end(err.message);
//            console.error(err);
//        }else {
//            
//        }
//    });
//    
    response.statusCode = 200;
    response.end();
});

module.exports = router;