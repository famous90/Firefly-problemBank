var router = require('express').Router();
var client = require('../mysql-client');
var async = require('async');

router.get('/categories', function(request, response){
    
    console.log(request.headers);

    client.query('select * from Categories', function(error, data){
        if(error){
            console.error('LOAD ALL CATEGORIES : error');
            throw error;
        }else{
            console.log('LOAD ALL CATEGORIES : complete ' + data.length);
            response.send(data);
            response.end('success');        
        }
    });
});

router.post('/category', function(request, response){

    console.log(request.headers);

    var name = request.body.name;
    var path = request.body.path;
    
    console.log('post category path,name: ' + path +','+ name);
    
    client.query('INSERT INTO Categories (name, path) VALUES(?, ?)', [name, path], function(err, info){
        if(err){
            console.log('INSERT CATEGORY : insert category error');
            throw err;
        }else{
            console.log('INSERT CATEGORY : insert category complete');
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
                            response.statusCode = 400;
                            console.log('DELETE CATEGORY : select children categories error');
                            subCallback(null);
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
                            response.statusCode = 400;
                            console.log('DELETE CATEGORY : select pclinks error');
                            subCallback(null);
                            throw error;
                        }else{
                            console.log('DELETE CATEGORY : completely delete pclinks');
                            subCallback(null);
                        }
                    });
                }
                
            ], function(err) {
                if(err){
                    throw err;
                }
                callback(null);
            });
        },
        
        // delete category with cid
        function(callback){
            client.query('DELETE FROM Categories WHERE cid=?', [cid], function(err, data){
                if(err){
                    response.statusCode = 400;
                    console.log('DELETE CATEGORY : delete category error');
                    throw err;
                }else{
                    callback(null);
                }
            });
        }
        
    ], function(err){
        if(err){
            response.statusCode = 400;
            response.end('ERROR');
        }else{
            console.log('DELETE CATEGORY : delete category complete');
            response.end('OK');   
        }
    });
});

module.exports = router;