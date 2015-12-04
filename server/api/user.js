var async = require('async');
var router = require('express').Router();
var client = require('../mysql-client');
var User = require('../model/User');
var AuthController = require('../controller/AuthController');

router.post('/api/users', function(request, response){
    
    var uid = {};
    var authkey = {};
    
    async.waterfall([
        
        // get parameters
        function(callback){
            if(!request.body.uid || !request.body.authkey){
                callback(400);
            }
            uid = request.body.uid;
            authkey = request.body.authkey;
            
            callback(null);
        },
        
        // check authorization
        function(callback){
            var authController = new AuthController();
            authController.isAuthorizatedWithRoles(uid, authkey, ['admin'], function(result){
                if(result){
                    callback(null);
                }else{
                    callback(401);
                }
            }, function(err){
                callback(400);
            });
        },
        
        // send users info
        function(callback){
            client.query('SELECT Users.uid, Users.name, Users.role FROM Users', function(err, results){
                if(err){
                    callback(400);
                }else {
                    callback(null, results);
                }
            });            
        },
        
    ], function(err, results){
        if(err){
            response.statusCode = err;
            response.end();
        }else {
            response.statusCode = 200;
            response.send(results);
            response.end();
        }
    });
    
});

router.post('/api/user/create', function(request, response){
    
    if(!request.body.username || !request.body.password){
        response.statusCode = 400;
        response.end('request Error');
        return;
    }
    
    var username = request.body.username;
    var password = request.body.password;
    var role = 'user';
    if(request.body.role){
        role = request.body.role;
    }
    
    async.waterfall([
        
        // check user name duplication
        function(callback){
            isUserInList(username, function(result){
                if(result == true){
                    callback('username duplication');
                }else{
                    callback(null);
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
                }else {
                    callback(null);
                }
            });     
        }
        
    ], function(err, results){
        if(err){
            console.error(err);
            response.statusCode = 400;
            response.end(err);
        }else{
            console.log(results);
            response.statusCode = 200;
            response.end('created user');
        }
    });
});

router.post('/api/users/alter', function(request, response){
    console.log(request.body);
    
    var users = {};
    var authUser = [];
    
    async.waterfall([
        
       // check parameters
        function(callback){
            if(!request.body.users || !request.body.authUser){
                callback(400);
            }
            users = request.body.users;
            authUser = request.body.authUser;
            
            callback(null);
        },
        
        // is authorized
        function(callback){
            var authController = new AuthController();
            authController.isAuthorizatedWithRoles(authUser.uid, authUser.authkey, ['admin'], function(result){
                if(result){
                    callback(null);
                }else{
                    callback(401);
                }
            }, function(err){
                callback(400);
            });
        },
        
        // alter user info
        function(callback){
            console.log(users);
            for(var i=0; i<users.length; i++){
                (function(i){
                    var theUser = users[i];
                    console.log(theUser);
client.query('UPDATE Users SET role = ? WHERE uid = ?', [theUser.newRole, theUser.uid], function(err){
                        if(err, data){
                            callback(400);
                            throw err;
                        }else {
                            if(i == users.length-1){
                                callback(null);   
                            }
                        }
                    });
                })();       
            }
        },
         
        
    ], function(err, result){
        if(err){
            response.statusCode = err;
            response.end();
        } else {
            response.statusCode = 200;
            response.end();
        }
    });
});

router.put('/api/user/:uid', function(request, response){
    
    var user = {};
    var uid = {};
    var username = {};
    var password = {};
    var role = {};
    
    async.waterfall([
        
        // check parameter
        function(callback){
            if(!request.body || !request.params.uid){
                callback(400);
            }
            user = request.body;
            uid = request.params.uid;
            username = user.username;
            password = user.password;
            role = user.role;
            
            callback(null);
        },
        
        // update user
        function(callback){
            client.query('UPDATE Users SET name = ?, password = ?, role = ? WHERE uid = ?', [username, password, role, uid], function(err, result){
                if(err){
                    callback(400);
                    throw err;
                }else {
                    callback(null);
                }
            });
        },
        
    ], function(err, result){
        if(err){
            response.statusCode = err;
            response.end();
        } else {
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