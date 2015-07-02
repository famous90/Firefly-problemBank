// extract modules
var http = require('http');
var express = require('express');
var mysql = require('mysql');
var fs = require('fs');
var path = require('path');

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

app.post('/problem', function(request, response){
    
    var question = request.param('question');
    var answer = request.param('answer');
    var hasImage = false;
    var insertId = {};
    
    console.log('INSERT PROBLEM http post request : start with '+question+', '+answers);

    
    // case for problem with image
    if(request.files.uploadImage.size){
        hasImage = true;
    }
    
    if(question && answer){
        
        client.query('INSERT INTO problems (question, answer, hasImage) VALUES(?, ?, ?)', [question, answer, hasImage], function(error, info){
            
            insertId = info.insertId;    
            console.log('INSERT PROBLEM http post request : complete and insert them to db completely with problem id :'+insertId);
            
            if(hasImage){

                var imageFileName = 'problem_image_'+insertId;
                var imageFileExtension = path.extname(request.files.uploadImage.path);
                var newPath = 'public/asset/images/'+imageFileName + imageFileExtension;

                console.log('image upload path :'+newPath);

                fs.readFile(request.files.uploadImage.path, function(err, data){

                    fs.writeFile(newPath, data, 'binary', function(saveError){
                        if(saveError){ 
                            response.statusCode = 400;
                            console.log('INSERT PROBLEM http post request : saving image error');
                            throw saveError;
                        }else{

                            client.query('INSERT INTO problemImages (name, pid) VALUES(?, ?)', [imageFileName, insertId], function(imageQueryError, imageQueryInfo){
                                if(imageQueryError){
                                    response.statusCode = 400;
                                    console.log('INSERT PROBLEM http post request : image query error');
                                    throw imageQueryError;
                                }else{
                                    console.log('INSERT PROBLEM http post request : image upload complete');
                                    response.redirect('back');  
                                }
                            });
                        }
                    });        
                });
            } else {
                console.log('INSERT PROBLEM http post request : image upload complete');
                response.redirect('back');  
            }

            
        });        
    }else{
        console.log('INSERT PROBLEM http post request : parameter missing');
        response.statusCode = 400;
    }
    
});

app.get('/categories', function(request, response){
    client.query('select * from categories', function(error, data){
        response.send(data);
    });
});

app.post('/category', function(request, response){
    
    var categoryPath = request.param('path');
    var name = request.param('name');
    
    console.log('post category path,name: ' + categoryPath +','+ name);
    
    var query = 'INSERT INTO categories (path, name) VALUES(?, ?)';
    
    client.query(query, [categoryPath, name], function(error, data){
        response.statusCode = 200;
    });
});


http.createServer(app).listen(52273, function(){
    console.log('Server running at http://127.0.0.1:52273');
});