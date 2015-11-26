var async = require('async');
var router = require('express').Router();
var client = require('../mysql-client');
var User = require('../model/User');

router.get('/api/users', function(request, response){
    client.query('SELECT * FROM Users', function(err, results){
        if(err){
            response.statusCode = 400;
            console.error(err);
            response.end(err);
            throw err;
        }else {
            response.statusCode = 200;
            response.send(results);
            response.end();
        }
    });
});

router.post('/api/users', function(request, response){
    
    var user = request.body;
    var username = user.username;
    var password = user.password;
    var role = 'user';
    if(user.role){
        role = user.role;
    }
    
    async.waterfall([
        
        // check user name duplication
        function(callback){
            isUserInList(username, function(result){
                if(result == true){
                    callback('username duplication');
                }else{
                    callback('null');
                }
            }, function(error){
                callback(error);
            });
        },
        
        // create user
        function(callback){
            client.query('INSERT INTO Users (name, password, role) VALUES (?,?,?)', [username, password, role], function (err, results){
                if(err){
                    callback(err);
                    throw err;
                }else {
                    callback(null);
                }
            });     
        }
        
    ], function(err, results){
        if(err){
            console.log(err);
            response.statusCode = 400;
            response.end(err);
        }else{
            console.log(results);
            response.statusCode = 200;
            response.end('created user');
        }
    });
});

router.put('/api/users/:uid', function(request, response){
    
    var user = request.body;
    var uid = request.params.uid;
    var username = user.username;
    var password = user.password;
    var role = user.role;
    
    client.query('UPDATE Users SET name = ?, password = ? WHERE uid = ?', [uid], function(err, result){
        if(err){
            response.statusCode = 400;
            console.error(err);
            response.end(err);
            throw err;
        }else {
            response.statusCode = 200;
            response.end();
        }
    });
});

router.delete('/api/users', function(request, response){
    
});

function isUserInList(username, onSuccess, onError){
    client.query('SELECT * FROM Users WHERE Users.name = ?', [username], function(err, results){
       if(err){
           onError(err);
           throw err;
       }else{
           if(results.length){
               onSuccess(true);
           }else{
               onSuccess(false);
           }
       }
    });
};

module.exports = router;