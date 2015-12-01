var router = require('express').Router();
var client = require('../mysql-client');
var User = require('../model/User');

router.post('/api/authenticate', function(request, response){
    
    if(!request.body.username || !request.body.password){
        response.statusCode = 400;
        response.end('request Error');
        return;
    }
    
    var username = request.body.username;
    var password = request.body.password;
    
    client.query('SELECT Users.uid, Users.name, Users.role FROM Users WHERE name = ? AND password = ?', [username, password], function (err, results){
        if(err){
            response.statusCode = 400;
            response.end(err);
            console.error(err);
            throw err;
        }else {
            console.log(JSON.parse(JSON.stringify(results)));
            if(results.length){
                var theUser = new User(results[0]);
                response.statusCode = 200;
                response.send({user: theUser});
                response.end('user checked');
            }else{
                response.statusCode = 401;
                response.end('username or password is incorrect');
            }
        }
    });
});

module.exports = router;