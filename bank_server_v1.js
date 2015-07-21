// extract modules
var http = require('http');
var express = require('express');
var mysql = require('mysql');
var fs = require('fs');
var path = require('path');
var os = require('os');


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

app.get('/problemImage?', function(request, response){
    var imageName = request.param('name');
    var type = request.param('type');
    var imageFile = 'public/asset/images/'+imageName+'.'+type;
    
    fs.exists(imageFile, function(exist){
        if(exist){
            response.sendfile(imageFile);     
        }else{
            response.status(403).send('Sorry! Can not find image');
        }
    });
});

app.get('/problems', function(request, response){
        
    client.query('select * from problems', function(error, data){
        response.send(data);
    });
});

app.post('/problem', function(request, response){
    
    var question = request.param('question');
    var answer = request.param('answer');
    var explanation = request.param('explanation');
    var stringWithCategories = request.param('categories');
    var categories = [];
    var hasQuestionImage = false;
    var hasExplanationImage = false;
    var stringWithExamples = request.param('examples');
    var insertId = {};
    
    var tempId = '';
    for(var i=0; i<stringWithCategories.length; i++){
        if(stringWithCategories.charAt(i) == '/'){
            categories.push(tempId);
            tempId = '';
        }else{
            tempId = tempId.concat(stringWithCategories.charAt(i));
        }
    }
    
    console.log(JSON.parse(JSON.stringify(request.files)));
    
    // case for problem/explanation with image
    if(request.files.questionAttached){
        hasQuestionImage = true;
        console.log('QUESTION IMAGE CONTAINED');
    }
    
    if(request.files.explanationAttached){
        hasExplanationImage = true;
        console.log('EXPLANATION IMAGE CONTAINED');
    }
    
    var hasImage = hasQuestionImage || hasExplanationImage;
    if(!hasImage){
        console.log('IMAGE NOT CONTAINED');
    }
    
    
    
    // insert problem to db
    if(question && answer){
        
        client.query('INSERT INTO problems (question, answer, explanation, hasQImage, hasExplnImage, examples) VALUES(?, ?, ?, ?, ?, ?)', [question, answer, explanation, hasQuestionImage, hasExplanationImage, stringWithExamples], function(error, info){
            
            if(error){
                console.log('INSERT PROBLEM http post request : insert problem error with problem');    
                throw error;
                
            }else{
                
                insertId = info.insertId;    
                console.log('INSERT PROBLEM http post request : insert problem complete with id :'+insertId);

                var pclinkQuery = 'INSERT INTO pcLinks (pid, cid) VALUES ';
                for(i=0; i<categories.length; i++){
                    if(i != 0){
                        pclinkQuery += ',';
                    }
                    var cid = categories[i];
                    pclinkQuery += '('+insertId+','+cid+')';
                }

                client.query(pclinkQuery, [insertId, cid], function(cateError){
                    if(cateError){
                        console.log('INSERT PROBLEM http post request : insert problem_category_link error with ('+insertId+', '+cid+')');
                        throw cateError;
                    }else{
                        console.log('INSERT PROBLEM http post request : insert problem_category_link complete');
                    }                

                    if(hasImage){
                        
                        var filePaths = [];
                        var newImageFilePaths = [];
                        var defaultPath = 'public/asset/images/';
                        
                        if(hasQuestionImage){
                            
                            if(request.files.questionAttached.length){
                                for(var i=0; i<request.files.questionAttached.length; i++){
                                    var attachedFilePath = request.files.questionAttached[i].path;
                                    filePaths.push(attachedFilePath);
                                    newImageFilePaths.push( defaultPath + 'question_image_' + insertId + '_' + i + path.extname(attachedFilePath));
                                }                                
                            }else{
                                var attachedFilePath = request.files.questionAttached.path;
                                filePaths.push(attachedFilePath);
                                newImageFilePaths.push( defaultPath + 'question_image_' + insertId + path.extname(attachedFilePath));
                            }
                        }

                        if(hasExplanationImage){
                            
                            if(request.files.explanationAttached.length){
                                for(var i=0; i<request.files.explanationAttached.length; i++){
                                    var attachedFilePath = request.files.explanationAttached[i].path;
                                    filePaths.push(attachedFilePath);
                                    newImageFilePaths.push( defaultPath + 'question_image_' + insertId + '_' + i + path.extname(attachedFilePath));
                                }                                
                            }else{
                                var attachedFilePath = request.files.explanationAttached.path;
                                filePaths.push(attachedFilePath);
                                newImageFilePaths.push( defaultPath + 'explanation_image_' + insertId + path.extname(attachedFilePath));
                            }
                        }
                        
                        
                        var index = 0;
                        for(var i=0; i<filePaths.length; i++){
                            (function(i){
                            var oldPath = '';
                            var newPath = '';
                            oldPath = filePaths[i];
                            newPath = newImageFilePaths[i];
                            
                            fs.readFile(oldPath, function(err, data){
                                
                                if(err){
                                    response.statusCode = 400;
                                    console.log('INSERT PROBLEM http post request : file read error ' + oldPath);
                                    throw err;
                                }else{                                
                                    console.log('INSERT PROBLEM http post request : file read complete ' + oldPath);
                                    fs.writeFile(newPath, data, 'binary', function(saveError){
                                    
                                        if(saveError){ 
                                            response.statusCode = 400;
                                            console.log('INSERT PROBLEM http post request : saving image error');
                                            throw saveError;

                                        }else{

                                            client.query('INSERT INTO problemImages (name, pid) VALUES(?, ?)', [newPath, insertId], function(imageQueryError, imageQueryInfo){
                                                if(imageQueryError){
                                                    response.statusCode = 400;
                                                    console.log('INSERT PROBLEM http post request : image query error');
                                                    throw imageQueryError;
                                                }else{
                                                    console.log('INSERT PROBLEM http post request : image upload complete');
                                                    index++;
                                                    if(index == filePaths.length-1){
                                                        response.redirect('back');
                                                    }
                                                }
                                            });
                                        }
                                    });     
                                }   
                            });                            
                            })(i);
                        }
                        
                        
                    } else {
                        console.log('INSERT PROBLEM http post request : insert problem with only category complete');
                        response.redirect('back');  
                    }
                });                
            }
            
        });        
    }else{
        console.log('INSERT PROBLEM http post request : parameter missing');
        response.statusCode = 400;
    }
    
});


app.post('/load_problems', function(request, response){
    
    var categories = JSON.parse(request.param('categories'));    
    var query = 'SELECT DISTINCT problems.*, pcLinks.cid FROM problems RIGHT JOIN pcLinks ON problems.pid = pcLinks.pid';
    
    if(categories.length){
        
        console.log('LOAD PROBLEMS : with category');
        query += ' WHERE problems.pid in (SELECT pid from pcLinks WHERE ';
    
        for(var i=0; i<categories.length; i++){
            query += 'cid = '+categories[i].cid;
            if(i != categories.length - 1){
                query += ' | ';   
            }
        }
        query += ')';
        
    }else {
        console.log('LOAD PROBLEMS : without category');
    }
    query += ' ORDER BY problems.pid';
    
    client.query(query, function(error, data){
        if(error){
            console.log('LOAD PROBLEMS : error');
            throw error;
        }else{
            console.log('LOAD PROBLEMS : complete');
//            console.log(JSON.parse(JSON.stringify(data)));
            response.send(data);
            response.end('loaded');
        }
    });
});

app.put('/problem/:pid', function(request, response){
    
    var pid = request.param('pid');
    var question = request.param('question');
    var answer = request.param('answer');
    var explanation = request.param('explanation');
    var examples = request.param('examples');
//    var query = 'UPDATE problems SET question = ?, answer = ?, explanation = ?, examples = ? WHERE pid = ?';
    
//    if (question) query += 'question="' + question + '" ';
//    if (answer) query += ', answer="' + answer + '" ';
//    if (explanation) query += ', explanation="' + explanation + '" ';
//    if (examples) query += ', examples="' + examples + '" ';
//    query += 'WHERE pid=' + pid;

    client.query('UPDATE problems SET question = ?, answer = ?, explanation = ?, examples = ? WHERE pid = ?', [question, answer, explanation, examples, pid], function(error, data){
        if(error){
            response.statusCode = 400;
            console.log('UPDATE PROBLEM : error with problem id '+pid);
            throw error;
        }else {
            console.log('UPDATE PROBLEM : complete');
            response.end('updated');
        }
     });
});

app.del('/problem/:pid', function(request, response){
        
    var pid = Number(request.param('pid'));
    
    client.query('DELETE FROM pcLinks WHERE pid = ?', [pid], function(error, results){
        
        if(error){
            response.statusCode = 400;
            console.log('DELETE PROBLEM http delete request : delete pclinks error with problem id '+pid);
            throw error;
        
        }else{
            console.log('DELETE PROBLEM http delete request : delete pclinks complete');
        }
    });

    
    client.query('SELECT * FROM problemImages WHERE pid = ?', [pid], function(error, results){

        if(error){
            response.statusCode = 400;
            console.log('DELETE PROBLEM http delete request : select problemImages error with problem id '+pid);
            throw error;

        }else{

            if(results.length){
                for(var i=0; i<results.length; i++){
                    (function(i){
                        var imagePath = results[i].name;

                        fs.unlink(imagePath, function (removeFileError) {
                            if (removeFileError) {
                                console.log('DELETE PROBLEM http delete request : delete image file error with path '+imagePath);
                                throw removeFileError;
                            }else{
                                console.log('DELETE PROBLEM http delete request : delete image file complete with path '+imagePath);
                                client.query('DELETE FROM problemImages WHERE pid = ?', [pid], function(removeError, data){
                                    if(removeError){
                                        response.statusCode = 400;
                                        console.log('DELETE PROBLEM http delete request : delete problemImages error with problemImages id '+results[i].imgid);
                                        throw removeError;

                                    }else{
                                        console.log('DELETE PROBLEM http delete request : delete problemImages complete with problemImages id '+results[i].imgid);
                                    }
                                });

                            }
                        });
                    })(i);
                }
                console.log('DELETE PROBLEM http delete request : select problemImages complete');   
            }else console.log('DELETE PROBLEM http delete request : no images in problem');
        }
    });    
    
    client.query('DELETE FROM problems WHERE pid = ?', [pid], function(error, results){
        
        if(error){
            response.statusCode = 400;
            console.log('DELETE PROBLEM http delete request : delete problem error with problem id '+pid);
            throw error;
        
        }else{
            console.log('DELETE PROBLEM http delete request : delete problem complete');
            response.statusCode = 200;
            response.send('OK');
        }
    });
});

app.get('/categories', function(request, response){
    client.query('select * from categories', function(error, data){
        if(error){
            console.log('LOAD ALL CATEGORIES : error');
            throw error;
        }else{
            console.log('LOAD ALL CATEGORIES : complete');
            response.send(data);
            response.end('success');
        }
    });
});

app.post('/category', function(request, response){
    
    var categoryPath = request.param('path');  
    var name = request.param('name');
    var parentId = request.param('parentId');
    var parentRelativePath = request.param('parentRelativePath');
    
    console.log('post category path,name: ' + categoryPath +','+ name +', parentId : '+ parentId + ' re_path : '+parentRelativePath);
    var insertCategoryOrder = 0;
    
    
    client.query('select * from categories where path = ?', [categoryPath], function(error, results){

        insertCategoryOrder = results.length;
        var relativePath = parentRelativePath + insertCategoryOrder.toString() + '/';

        if(error){
            response.statusCode = 400;
            console.log('INSERT CATEGORY http post request : count parent path error');
            throw saveError;
        }else{
            
            console.log('INSERT CATEGORY http post request : count parent path complete');
            client.query('INSERT INTO categories (name, path, relativePath) VALUES(?, ?, ?)', [name, categoryPath, relativePath], function(insertError, insertInfo){
                if(insertError){
                    response.statusCode = 400;
                    console.log('INSERT CATEGORY http post request : insert category error');
                    throw insertError;
                }else{
                    console.log('INSERT CATEGORY http post request : insert category complete');
                    response.send('OK');
                }
            });
        }
    });
});

app.del('/category/:cid', function(request, response){
        
    var cid = Number(request.param('cid'));
    
    
    client.query('SELECT * FROM categories WHERE cid='+cid, function(error, results){
        
        if(error){
            response.statusCode = 400;
            console.log('DELETE CATEGORY http post request : select category error');
            throw error;
        
        }else{
            console.log('DELETE CATEGORY http post request : select category complete');

            var deletingCategoryPath = results[0].path;
            deletingCategoryPath = deletingCategoryPath + cid.toString() + '/';
            
            client.query('DELETE FROM categories WHERE path LIKE "%'+deletingCategoryPath+'%"', function(error2){
                
                if(error2){
                    response.statusCode = 400;
                    console.log('DELETE CATEGORY http post request : select children categories error');
                    throw error2;
                
                }else{
                
                    client.query('DELETE FROM categories WHERE cid=?', [cid], function(err, data){
                        
                        if(err){
                            response.statusCode = 400;
                            console.log('DELETE CATEGORY http post request : delete category error');
                            throw err;
                            
                        }else{
                            console.log('DELETE CATEGORY http post request : delete category complete');
                            response.send('OK');   
                        }
                    });
                }
            });        
        }
    });
});



// check server running
http.createServer(app).listen(8080, function(){
    
    var ifaces = os.networkInterfaces();

    Object.keys(ifaces).forEach(function (ifname) {
        var alias = 0;

        ifaces[ifname].forEach(function (iface) {
            if ('IPv4' !== iface.family || iface.internal !== false) {
                  // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                return;
            }

            if (alias >= 1) {
                // this single interface has multiple ipv4 addresses
                console.log(ifname + ':' + alias, iface.address);
            } else {
                // this interface has only one ipv4 adress
                console.log(ifname, iface.address);
            }
        });
    });
    console.log('Server running');
});