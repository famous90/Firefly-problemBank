var router = require('express').Router();
var client = require('../mysql-client');
var User = require('../model/User');

router.post('/api/authenticate', function(request, response){
    console.log(JSON.parse(JSON.stringify(request.body)));
    var username = request.body.username;
    var password = request.body.password;
    
    client.query('SELECT uid, name, role FROM Users WHERE name = ? AND password = ?', [username, password], function (err, results){
        if(err){
            response.statusCode = 520;
            response.end('login error');
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