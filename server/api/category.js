var router = require('express').Router();
var client = require('../mysql-client');
var async = require('async');

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

router.post('/category', function(request, response){
    var name = request.body.name;
    var path = request.body.path;
    
    client.query('INSERT INTO Categories (name, path) VALUES(?, ?)', [name, path], function(err, info){
        if(err){
            response.statusCode = 400;
            response.end(err);
            console.error(err);
            throw err;
        }else{
            response.statusCode = 200;
            response.send({cid: info.insertId});
            response.end('inserted');
        }
    });
});

router.delete('/category/:cid', function(request, response){
        
    var cid = request.params.cid;
    
    async.waterfall([
        
        // delete links with cid
        function(callback){
            async.parallel([
                
                // delete categories of cid's children
                function(subCallback) {
                    var queryForChildren = "DELETE FROM Categories WHERE path LIKE '%"+cid+"%'";
                    client.query(queryForChildren, function(error){
                        if(error){
                            subCallback(error);
                            throw error;
                        }else{
                            console.log('DELETE CATEGORY : completely delete children categories');
                            subCallback(null);
                        }
                    });    
                },
                
                // delete pclinks 
                function(subCallback) {
                    client.query("DELETE FROM PcLinks WHERE cid = ?", [cid], function(error){
                        if(error){
                            subCallback(error);
                            throw error;
                        }else{
                            console.log('DELETE CATEGORY : completely delete pclinks');
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
                    callback(err);
                    throw err;
                }else{
                    callback(null);
                }
            });
        }
        
    ], function(err){
        if(err){
            response.statusCode = 400;
            response.end(err);
            console.error(err);
        }else{
            console.log('DELETE CATEGORY : delete category complete');
            response.end('completely category deleted');   
        }
    });
});

module.exports = router;