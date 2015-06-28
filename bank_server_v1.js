// extract modules
var http = require('http');
var express = require('express');
var mysql = require('mysql');

// connect with DB
var client = mysql.createConnection({
    user: 'root',
    password: 'q1w2e3r4',
    database: 'bank'
});

// make web server
var app = express();
app.use(express.static('public'));
app.use(express.bodyParser());
app.use(app.router);



app.get('/problems', function(request, response){
    client.query('select * from problems', function(error, data){
        response.send(data);
    });
});

app.get('/categories', function(request, response){
    client.query('select * from categories', function(error, data){
        response.send(data);
    });
});

app.post('/category', function(request, response){
    
    var path = request.param('path');
    var name = request.param('name');
    
    console.log('post category path,name: ' + path +','+ name);
    
    var query = 'INSERT INTO categories (path, name) VALUES(?, ?)';
    
    client.query(query, [path, name], function(error, data){
//        response.writeHead(200, {"Content-Type": "text/plain"});
    });
});


http.createServer(app).listen(52273, function(){
    console.log('Server running at http://127.0.0.1:52273');
});
