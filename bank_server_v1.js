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
    var imageFile = 'public/asset/images/'+imageName;
    
    fs.exists(imageFile, function(exist){
        if(exist){
            response.sendfile(imageFile);
        }else{
            console.log('image no exist');
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
    
    var parameters = JSON.parse(request.param('data'));
    var question = parameters.question;
    var answer = parameters.answer;
    var explanation = parameters.explanation;
    var categories = parameters.categories;
    var examples = parameters.examples;
    var answerType = parameters.answerType;
    
    var hasQuestionImage = false;
    var hasExplanationImage = false;
    var insertId = {};
    
    console.log(JSON.parse(JSON.stringify(categories)));
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
        
        client.query('INSERT INTO problems (question, answer, explanation, hasQImage, hasExplnImage, examples, answerType) VALUES(?, ?, ?, ?, ?, ?, ?)', [question, answer, explanation, hasQuestionImage, hasExplanationImage, examples, answerType], function(error, info){
            
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

                    // image insert
                    if(hasImage){
                        
                        var fileDataArray = new Array();
                        function fileDateSet (path, newPath, type, fileName){
                            this.path = path;
                            this.newPath = newPath;
                            this.type = type;
                            this.fileName = fileName;
                        }
                        
                        var defaultPath = 'public/asset/images/';
                        
                        if(hasQuestionImage){
                            
                            if(request.files.questionAttached.length){
                                for(var i=0; i<request.files.questionAttached.length; i++){
                                    var attachedFilePath = request.files.questionAttached[i].path;
                                    var fileName = 'question_image_' + insertId + '_' + i + path.extname(attachedFilePath);
                                    var newPath = defaultPath + fileName;
                                    var theFileDataSet = new fileDateSet(attachedFilePath, newPath, 'question', fileName);
                                    fileDataArray.push(theFileDataSet);
                                }                                
                            }else{
                                var attachedFilePath = request.files.questionAttached.path;
                                var fileName = 'question_image_' + insertId + path.extname(attachedFilePath);
                                var newPath = defaultPath + fileName;
                                var theFileDataSet = new fileDateSet(attachedFilePath, newPath, 'question', fileName);
                                fileDataArray.push(theFileDataSet);
                            }
                        }

                        if(hasExplanationImage){
                            
                            if(request.files.explanationAttached.length){
                                for(var i=0; i<request.files.explanationAttached.length; i++){
                                    var attachedFilePath = request.files.explanationAttached[i].path;
                                    var fileName = 'explanation_image_' + insertId + '_' + i + path.extname(attachedFilePath);
                                    var newPath = defaultPath + fileName;
                                    var theFileDataSet = new fileDateSet(attachedFilePath, newPath, 'explanation', fileName);
                                    fileDataArray.push(theFileDataSet);
                                }                                
                            }else{
                                var attachedFilePath = request.files.explanationAttached.path;
                                var fileName = 'explanation_image_' + insertId + path.extname(attachedFilePath);
                                var newPath = defaultPath + fileName;
                                var theFileDataSet = new fileDateSet(attachedFilePath, newPath, 'explanation', fileName);
                                fileDataArray.push(theFileDataSet);
                            }
                        }
                        
                        var index = 0;
                        for(var i=0; i<fileDataArray.length; i++){
                            (function(i){
                            var fileData = fileDataArray[i];
                            
                            fs.readFile(fileData.path, function(err, data){
                                
                                if(err){
                                    response.statusCode = 400;
                                    console.log('INSERT PROBLEM http post request : file read error ' + fileData.path);
                                    throw err;
                                }else{                                
                                    console.log('INSERT PROBLEM http post request : file read complete');
                                    fs.writeFile(fileData.newPath, data, 'binary', function(saveError){
                                    
                                        if(saveError){ 
                                            response.statusCode = 400;
                                            console.log('INSERT PROBLEM http post request : saving image error');
                                            throw saveError;

                                        }else{

                                            client.query('INSERT INTO problemImages (name, pid, imageType) VALUES(?, ?, ?)', [fileData.fileName, insertId, fileData.type], function(imageQueryError, imageQueryInfo){
                                                if(imageQueryError){
                                                    response.statusCode = 400;
                                                    console.log('INSERT PROBLEM http post request : image query error');
                                                    throw imageQueryError;
                                                }else{
                                                    console.log('INSERT PROBLEM http post request : image upload complete');
                                                    if(index == fileDataArray.length-1){
                                                        console.log('last image uploaded');
                                                        response.redirect('back');
                                                    }
                                                    index++;
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
        response.end('error');
    }
    
});


app.post('/load_problems', function(request, response){
    
    var categories = JSON.parse(request.param('categories'));
    var responseResults = {
        problems: [],
        pcLinks: [],
        problemImages: []
    };
    
    var problemsQuery = 'SELECT DISTINCT problems.* FROM problems RIGHT JOIN pcLinks ON problems.pid = pcLinks.pid';
    if(categories.length){
        
        console.log('LOAD PROBLEMS : with category');
        problemsQuery += ' WHERE (';
    
        for(var i=0; i<categories.length; i++){
            problemsQuery += 'pcLinks.cid = '+categories[i];
            if(i != categories.length - 1){
                problemsQuery += ' || ';
            }
        }
        problemsQuery += ')';
        
    }else {
        console.log('LOAD PROBLEMS : without category');
    }
    problemsQuery += ' ORDER BY RAND() LIMIT 20';
    
    client.query(problemsQuery, function(error, problemResults){
        if(error){
            console.log('LOAD PROBLEMS : load problems error');
            throw error;
        }else{
            console.log('LOAD PROBLEMS : load problems complete');
            console.log(JSON.parse(JSON.stringify(problemResults)));
            
            responseResults.problems = problemResults;
            
            var pclinkQuery = 'SELECT DISTINCT * FROM pcLinks WHERE (';
            for(var i=0; i<problemResults.length; i++){
                pclinkQuery += 'pid = '+problemResults[i].pid;
                if(i != problemResults.length - 1){
                    pclinkQuery += ' || ';
                }
            }
            pclinkQuery += ') ORDER BY pid';
            
            client.query(pclinkQuery, function(pclinkError, pcLinkResults){
                if(pclinkError){
                    console.log('LOAD PROBLEMS : load pclink error');
                    throw pclinkError;
                }else{
                    console.log('LOAD PROBLEMS : load pclink complete');
                    console.log(JSON.parse(JSON.stringify(pcLinkResults)));

                    responseResults.pcLinks = pcLinkResults;
                    
                    var imageQuery = 'SELECT DISTINCT * FROM problemImages WHERE (';
                    for(var i=0; i<problemResults.length; i++){ 
                        imageQuery += 'pid = '+problemResults[i].pid;
                        if(i != problemResults.length - 1){
                            imageQuery += ' || ';
                        }
                    }
                    imageQuery += ') ORDER BY pid';

                    client.query(imageQuery, function(imageError, imageResults){
                        if(imageError){
                            console.log('LOAD PROBLEMS : load problem images error');
                            throw imageError;
                        }else{
                            console.log('LOAD PROBLEMS : load problem images complete');
                            console.log(JSON.parse(JSON.stringify(imageResults)));

                            responseResults.problemImages = imageResults;
                            response.send(responseResults);
                            response.end('loaded');
                        }
                    });
                }
            });
//            response.send(data);
//            response.end('loaded');
            
        }
    });
});

app.put('/problem/:pid', function(request, response){
    
    var parameters = JSON.parse(request.param('data'));
    var pid = request.param('pid');
    var question = parameters.question;
    var answer = parameters.answer;
    var explanation = parameters.explanation;
    var examples = parameters.examples;
    var answerType = parameters.answerType;
    var newCategories = parameters.alterCategories.new;
    var deleteCategories = parameters.alterCategories.delete;
    
    console.log(JSON.parse(JSON.stringify(parameters)));

    // update problem
    client.query('UPDATE problems SET question = ?, answer = ?, explanation = ?, examples = ?, answerType = ? WHERE pid = ?', [question, answer, explanation, examples, answerType, pid], function(error, data){
        if(error){
            response.statusCode = 400;
            console.log('UPDATE PROBLEM : update problem error with problem id '+pid);
            throw error;
        }else {
            console.log('UPDATE PROBLEM : update problem complete');
            response.end('updated');
        }
     });
        
    // insert pclink
    if(newCategories.length){
        var insertQuery = 'INSERT INTO pcLinks (pid, cid) VALUES ';
        for(i=0; i<newCategories.length; i++){
            if(i != 0){
                insertQuery += ',';
            }
            var cid = newCategories[i];
            insertQuery += '('+pid+','+cid+')';
        }
        client.query(insertQuery, function(err, results){
            if(err){
                response.statusCode = 400;
                console.log('UPDATE PROBLEM : insert pclinks error with problem id '+pid);
                throw err;
            }else {
                console.log('UPDATE PROBLEM : insert pclinks complete');
            }
        });        
    }
        
    // delete pclink
    if(deleteCategories.length){
        var deleteQuery = 'DELETE FROM pcLinks WHERE ';
        for(i=0; i<deleteCategories.length; i++){
            if(i != 0){
                deleteQuery += '||';
            }
            var cid = deleteCategories[i];
            deleteQuery += '(pid='+pid+'&&cid='+cid+')';
        }
        client.query(deleteQuery, function(err, results){
            if(err){
                response.statusCode = 400;
                console.log('UPDATE PROBLEM : delete pclinks error with problem id '+pid);
                throw err;
            }else {
                console.log('UPDATE PROBLEM : delete pclinks complete');
            }
        });        
    }
    
    // insert problem images
    if(request.files.questionAttached || request.files.explanationAttached){
        var fileDataArray = new Array();
        function fileDateSet (path, newPath, type, fileName){
            this.path = path;
            this.newPath = newPath;
            this.type = type;
            this.fileName = fileName;
        }

        var defaultPath = 'public/asset/images/';

        if(request.files.questionAttached){

            if(request.files.questionAttached.length){
                for(var i=0; i<request.files.questionAttached.length; i++){
                    var attachedFilePath = request.files.questionAttached[i].path;
                    var fileName = 'question_image_' + insertId + '_' + i + path.extname(attachedFilePath);
                    var newPath = defaultPath + fileName;
                    var theFileDataSet = new fileDateSet(attachedFilePath, newPath, 'question', fileName);
                    fileDataArray.push(theFileDataSet);
                }                                
            }else{
                var attachedFilePath = request.files.questionAttached.path;
                var fileName = 'question_image_' + insertId + path.extname(attachedFilePath);
                var newPath = defaultPath + fileName;
                var theFileDataSet = new fileDateSet(attachedFilePath, newPath, 'question', fileName);
                fileDataArray.push(theFileDataSet);
            }
        }

        if(request.files.explanationAttached){

            if(request.files.explanationAttached.length){
                for(var i=0; i<request.files.explanationAttached.length; i++){
                    var attachedFilePath = request.files.explanationAttached[i].path;
                    var fileName = 'explanation_image_' + insertId + '_' + i + path.extname(attachedFilePath);
                    var newPath = defaultPath + fileName;
                    var theFileDataSet = new fileDateSet(attachedFilePath, newPath, 'explanation', fileName);
                    fileDataArray.push(theFileDataSet);
                }                                
            }else{
                var attachedFilePath = request.files.explanationAttached.path;
                var fileName = 'explanation_image_' + insertId + path.extname(attachedFilePath);
                var newPath = defaultPath + fileName;
                var theFileDataSet = new fileDateSet(attachedFilePath, newPath, 'explanation', fileName);
                fileDataArray.push(theFileDataSet);
            }
        }

        var index = 0;
        for(var i=0; i<fileDataArray.length; i++){
            (function(i){
            var fileData = fileDataArray[i];

            fs.readFile(fileData.path, function(err, data){

                if(err){
                    response.statusCode = 400;
                    console.log('UPDATE PROBLEM http post request : file read error');
                    throw err;
                }else{                                
                    console.log('UPDATE PROBLEM http post request : file read complete');
                    fs.writeFile(fileData.newPath, data, 'binary', function(saveError){
                        if(saveError){ 
                            response.statusCode = 400;
                            console.log('UPDATE PROBLEM http post request : saving image error');
                            throw saveError;

                        }else{

                            client.query('UPDATE INTO problemImages (name, pid, imageType) VALUES(?, ?, ?)', [fileData.fileName, insertId, fileData.type], function(imageQueryError, imageQueryInfo){
                                if(imageQueryError){
                                    response.statusCode = 400;
                                    console.log('UPDATE PROBLEM http post request : image query error');
                                    throw imageQueryError;
                                }else{
                                    console.log('UPDATE PROBLEM http post request : image upload complete');
                                    if(index == fileDataArray.length-1){
                                        console.log('last image uploaded');
                                        response.redirect('back');
                                    }
                                    index++;
                                }
                            });
                        }
                    });     
                }   
            });                            
            })(i);
        }

    }
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
    var path = request.param('absPath');
//    var parentRelativePath = request.param('parentRelativePath');
    
    console.log('post category path,name: ' + categoryPath +','+ name +', parentId : '+ parentId);
    var insertCategoryOrder = 0;
    
    client.query('INSERT INTO categories (name, path) VALUES(?, ?)', [name, absPath], function(insertError, insertInfo){
        if(insertError){
            response.statusCode = 400;
            console.log('INSERT CATEGORY http post request : insert category error');
            throw insertError;
        }else{
            console.log('INSERT CATEGORY http post request : insert category complete');
            response.end('inserted');
        }
    });

//    client.query('select * from categories where path = ?', [categoryPath], function(error, results){
//
//        insertCategoryOrder = results.length;
//        var relativePath = parentRelativePath + insertCategoryOrder.toString() + '/';
//
//        if(error){
//            response.statusCode = 400;
//            console.log('INSERT CATEGORY http post request : count parent path error');
//            throw saveError;
//        }else{
//            
//            console.log('INSERT CATEGORY http post request : count parent path complete');
//            client.query('INSERT INTO categories (name, path) VALUES(?, ?)', [name, categoryPath], function(insertError, insertInfo){
//                if(insertError){
//                    response.statusCode = 400;
//                    console.log('INSERT CATEGORY http post request : insert category error');
//                    throw insertError;
//                }else{
//                    console.log('INSERT CATEGORY http post request : insert category complete');
//                    response.end('inserted');
//                }
//            });
//        }
//    });
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
http.createServer(app).listen(3000, function(req, res){
    
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