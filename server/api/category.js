var router = require('express').Router();
var client = require('../mysql-client');
var async = require('async');
var AuthController = require('../controller/AuthController');

router.get('/categories', function(request, response){
    
    client.query('select * from Categories', function(error, data){
        if(error){
            response.statusCode = 400;
            response.end(error);
            console.error(error);
            throw error;
        }else{
            response.statusCode = 200;
            console.log(data);
            response.send(data);
            response.end('success');        
        }
    });
});

router.post('/api/category/create', function(request, response){
    
    var name = {};
    var path = {};
    var uid = {};
    var authkey = {};
    
    async.waterfall([
        
        // check parameters
        function(callback){
            if(!request.body.name || !request.body.path || !request.body.uid || !request.body.authkey){
                callback(400);
            }
            name = request.body.name;
            path = request.body.path;
            uid = request.body.uid;
            authkey = request.body.authkey;
            
            callback(null);
        },
        
        // is authorized
        function(callback){
            var authController = new AuthController();
            authController.isAuthorizatedWithRoles(uid, authkey, ['admin', 'editor'], function(result){
                if(result){
                    callback(null);
                }else {
                    callback(401);
                }
            }, function(){
                callback(400);
            });
        },
        
        // create category
        function(callback){
            client.query('INSERT INTO Categories (name, path) VALUES(?, ?)', [name, path], function(err, info){
                if(err){
                    callback(400);
                    throw err;
                }else{
                    callback(null, info);
                }
            });
        },
        
    ], function(err, result){
        if(err){
            response.statusCode = err;
            response.end();
        } else {
            response.statusCode = 200;
            response.send({cid: result.insertId});
            response.end();
        }
    });
});

router.post('/api/category/delete', function(request, response){
        
    var cid = {};
    var uid = {};
    var authkey = {};
    
    async.waterfall([
        
        // check parameter
        function(callback){
            console.log(request.body);
            if(!request.body.cid || !request.body.uid || !request.body.authkey){
                callback(400);
            }
            cid = request.body.cid;
            uid = request.body.uid;
            authkey = request.body.authkey;
            
            callback(null);
        },
        
        // is authorized
        function(callback){
            var authController = new AuthController();
            authController.isAuthorizatedWithRoles(uid, authkey, ['admin'], function(result){
                if(result){
                    callback(null);
                }else {
                    callback(401);
                }
            }, function(){
                callback(400);
            });
        },
        
        // delete links with cid
        function(callback){
            async.parallel([
                
                // delete categories of cid's children
                function(subCallback) {
                    var queryForChildren = "DELETE FROM Categories WHERE path LIKE '%"+cid+"%'";
                    client.query(queryForChildren, function(error){
                        if(error){
                            subCallback(400);
                            throw error;
                        }else{
                            subCallback(null);
                        }
                    });    
                },
                
                // delete pclinks 
                function(subCallback) {
                    client.query("DELETE FROM PcLinks WHERE cid = ?", [cid], function(error){
                        if(error){
                            subCallback(400);
                            throw error;
                        }else{
                            subCallback(null);
                        }
                    });
                }
                
            ], function(err) {
                if(err){
                    callback(err);
                }else {
                    callback(null);   
                }
            });
        },
        
        // delete category with cid
        function(callback){
            client.query('DELETE FROM Categories WHERE cid=?', [cid], function(err, data){
                if(err){
                    callback(400);
                    throw err;
                }else{
                    callback(null);
                }
            });
        }
        
    ], function(err){
        if(err){
            response.statusCode = err;
            response.end();
        }else{
            response.statusCode = 200;
            response.end('completely category deleted');   
        }
    });
});

module.exports = router;