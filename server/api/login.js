var router = require('express').Router();
var client = require('../mysql-client');
var randomString = require('randomstring');
var bcrypt = require('bcrypt');
var async = require('async');

router.post('/api/authenticate', function(request, response){
    
    var username = {};
    var password = {};
    
    async.waterfall([
        
        // check parameter
        function(callback){
            if(!request.body.username || !request.body.password){
                callback(400);
            }

            username = request.body.username;
            password = request.body.password;
            
            callback(null);
        },
        
        // get user info
        function(callback){
            client.query('SELECT uid, name, role, createProblemCount, balance FROM Users WHERE name = ? AND password = ?', [username, password], function (err, results){
                if(err){
                    callback(400);
                    throw err;
                }else {
                    if(results.length){
                        callback(null, results[0]);
                    }else{
                        callback(401);
                    }
                }
            });
        },
        
        // generate authorization key
        function(theUser, callback){
            
            async.waterfall([
                
                // generate key
                function (subCallback){
                    generateAuthorizationKey(function(result){
                        theUser.authkey = result; 
                        subCallback(null, result);
                    });
                },
                
                // insert key into db
                function (hashkey, subCallback){
                    client.query('UPDATE Users SET authkey = ? WHERE uid = ?', [hashkey, theUser.uid], function(err, results){
                       if(err){
                           subCallback(400);
                       } else {
                           subCallback(null);
                       }
                    });
                },
                
            ], function(err, result){
                if(err){
                    callback(400);
                }else {
                    callback(null, theUser);
                }
            });
        },
        
    ], function(err, result){
        if(err){
            response.statusCode = err;
            response.end('authentication error');
        }else {
            response.statusCode = 200;
            response.send({user: result});
            response.end();
        }
    });
});

router.delete('/api/authorization/:uid', function(request, response){
    
    var uid = request.params.uid;
    
    client.query('UPDATE Users SET authkey = NULL WHERE uid = ?', [uid], function(err, results){
       if(err){
           response.statusCode = 400;
           response.end();
           throw err;
       } else {
           response.statusCode = 200;
           response.end();
       }
    });
});

function generateAuthorizationKey(callback){
    var newKey = randomString.generate(15);
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(newKey, salt, function(err, hash) {
            callback(hash);
        });
    });
};

module.exports = router;