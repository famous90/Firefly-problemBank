// extract modules
var express = require('express');
var http = require('http');
var mysql = require('mysql');
var fs = require('fs');
var path = require('path');
var os = require('os');
var async = require('async');


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
//app.use(app.router);  


// object
function fileDateSet (path, newPath, type, fileName){
    this.path = path;
    this.newPath = newPath;
    this.type = type;
    this.fileName = fileName;
}

function getImageDataArray (array, data, imageType, insertStr){
    var defaultPath = 'public/asset/images/';
    
    if(data.length){
        for(var i=0; i<data.length; i++){
            var filePath = data[i].path;
            var fileName = imageType + '_image_' + insertStr + '_' + i + path.extname(filePath);
            var newPath = defaultPath + fileName;
            var theFileDataSet = new fileDateSet(filePath, newPath, imageType, fileName);
            array.push(theFileDataSet);
        }                                
    }else{
        var filePath = data.path;
        var fileName = imageType + '_image_' + insertStr + path.extname(filePath);
        var newPath = defaultPath + fileName;
        var theFileDataSet = new fileDateSet(filePath, newPath, imageType, fileName);
        array.push(theFileDataSet);
    }
}

function writeImageData (fileDataArray, pid, callback) {
    console.log(JSON.parse(JSON.stringify(fileDataArray)));
    for(var i=0; i<fileDataArray.length; i++){        
        (function(i){
            var fileData = fileDataArray[i];

            fs.readFile(fileData.path, function(err, data){
                if(err){
                    throw err;
                }else{                                
                    fs.writeFile(fileData.newPath, data, 'binary', function(writeError){
                        if(writeError){ 
                            throw writeError;
                        }else{

                            client.query('INSERT INTO problemImages (name, pid, imageType) VALUES(?, ?, ?)', [fileData.fileName, pid, fileData.type], function(imageQueryError, imageQueryInfo){
                                if(imageQueryError){
                                    throw imageQueryError;
                                }else{
                                    console.log('write file '+fileData.fileName);
                                    if(i == fileDataArray.length-1){
                                        console.log('last image uploaded');
                                        callback();
                                        return;
                                    }
                                }
                            });
                        }
                    });     
                }   
            });                            
        })(i);
    }                            
}

// Exception Handler 등록
process.on('uncaughtException', function (err) {
    console.log('Caught exception: ' + err);
    // 추후 trace를 하게 위해서 err.stack 을 사용하여 logging하시기 바랍니다.
    // Published story에서 beautifule logging winston 참조
});

// restful api
app.get('/problemImage?', function(request, response){
    var imageName = request.param('name');
    if(!imageName){
        return;
    }
    
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
    var notAnswerExamples = parameters.notAnswerExamples;
    var answerType = parameters.answerType;
    
    var hasQuestionImage = false;
    var hasExplanationImage = false;
    var insertId = {};
    
    console.log(JSON.parse(JSON.stringify(parameters)));
    console.log(JSON.parse(JSON.stringify(request.files)));
    
    if(!(question && answer)){
        return;
    }
    
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
    
    
    async.waterfall([
        
        // insert problem
        function(callback){
            client.query('INSERT INTO problems (question, answer, explanation, hasQImage, hasExplnImage, notAnswerExamples, answerType) VALUES(?, ?, ?, ?, ?, ?, ?)', [question, answer, explanation, hasQuestionImage, hasExplanationImage, notAnswerExamples, answerType], function(error, info){

                if(error){
                    console.log('INSERT PROBLEM : insert problem error with problem');    
                    throw error;

                }else{

                    insertId = info.insertId;    
                    console.log('INSERT PROBLEM : insert problem complete with id :'+insertId);
                    callback(null, info.insertId);
                }
            });        
        },
        
        // insert pclink and images
        function(pid, callback){
            
            async.parallel([
                
                // insert pclink
                function(subCallback){
                    var pclinkQuery = 'INSERT INTO pcLinks (pid, cid) VALUES ';
                    for(i=0; i<categories.length; i++){
                        if(i != 0){
                            pclinkQuery += ',';
                        }
                        var cid = categories[i];
                        pclinkQuery += '('+pid+','+cid+')';
                    }

                    client.query(pclinkQuery, [pid, cid], function(cateError){
                        if(cateError){
                            console.log('INSERT PROBLEM : insert problem_category_link error with ('+pid+', '+cid+')');
                            throw cateError;
                        }else{
                            console.log('INSERT PROBLEM : insert problem_category_link complete');
                            subCallback(null, 'categories');
                        }                
                    });                
                },
                
                // insert images
                function(subCallback){
                    if(hasImage){
                        var fileDataArray = new Array();
                        var defaultPath = 'public/asset/images/';

                        if(hasQuestionImage){
                            getImageDataArray(fileDataArray, request.files.questionAttached, 'question', pid);
                        }
                        if(hasExplanationImage){
                            getImageDataArray(fileDataArray, request.files.explanationAttached, 'explanation', pid);   
                        }

                        writeImageData(fileDataArray, pid, function(){
                            subCallback(null, 'images');
                        });                        

                    }else {
                        subCallback(null, 'images');
                    }
                }
                
            ], function(error, results){
                if(error){
                    throw error;
                }else{
                    callback(null);   
                }
            });
        }
        
        // callback result
    ], function(err, results){
        if(err){
            throw err;
        }else {
            response.end('insert');   
        }
    });
    
});


app.post('/load_problems', function(request, response){
    
    var categories = JSON.parse(request.param('categories'));
    var problemNumber = request.param('problemNumber');
    var responseResults = {
        problems: [],
        pcLinks: [],
        problemImages: []
    };
    
    async.waterfall([
        
        // load problems
        function(callback){
            var problemsQuery = 'SELECT DISTINCT problems.* FROM problems RIGHT JOIN pcLinks ON problems.pid = pcLinks.pid';
            
            // connect category query
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
//            problemsQuery += ' ORDER BY RAND() LIMIT ' + problemNumber;
            problemsQuery += ' ORDER BY pid LIMIT ' + problemNumber;

            client.query(problemsQuery, function(error, problemResults){
                if(error){
                    console.log('LOAD PROBLEMS : load problems error');
                    throw error;
                }else{
                    console.log('LOAD PROBLEMS : load problems complete');
                    console.log(JSON.parse(JSON.stringify(problemResults)));
                    
                    responseResults.problems = problemResults;
                    callback(null, problemResults);
                }
            });        
        },
        
        
        // load categories and images
        function(problemResults, callback){
            
            async.parallel([
                
                // load categories
                function(subCallback){
                    var pclinkQuery = 'SELECT DISTINCT * FROM pcLinks WHERE (';
                    for(var i=0; i<problemResults.length; i++){
                        pclinkQuery += 'pid = '+problemResults[i].pid;
                        if(i != problemResults.length - 1){
                            pclinkQuery += ' || ';
                        }
                    }
                    pclinkQuery += ') ORDER BY pid';

                    client.query(pclinkQuery, function(error, results){
                        if(error){
                            console.log('LOAD PROBLEMS : load pclink error');
                            throw error;
                        }else{
                            console.log('LOAD PROBLEMS : load pclink complete');
                            console.log(JSON.parse(JSON.stringify(results)));

                            responseResults.pcLinks = results;
                            subCallback(null);
                        }
                    });
                },
                
                // load images
                function(subCallback){
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
                            subCallback(null);
                        }
                    });
                }
            ], function(err, results){
                if(err){
                    throw err;
                }else{
                    callback(null);    
                }
            });
        }
        
        // callback results
    ], function(err, results){
        if(err){
            throw err;
        }else{
            response.send(responseResults);
            response.end('loaded');
        }
    });
    
});

app.put('/problem/:pid', function(request, response){
    
    var parameters = JSON.parse(request.param('data'));
    var pid = request.param('pid');
    var question = parameters.question;
    var answer = parameters.answer;
    var explanation = parameters.explanation;
    var notAnswerExamples = parameters.notAnswerExamples;
    var answerType = parameters.answerType;
    var newCategories = parameters.alterCategories.new;
    var deleteCategories = parameters.alterCategories.delete;
    
    console.log('pid : '+pid);
    console.log(JSON.parse(JSON.stringify(parameters)));
    
    async.parallel([
        
        // update problem content
        function(callback){
            client.query('UPDATE problems SET question = ?, answer = ?, explanation = ?, notAnswerExamples = ?, answerType = ? WHERE pid = ?', [question, answer, explanation, notAnswerExamples, answerType, pid], function(error, data){
                if(error){
                    console.log('UPDATE PROBLEM : update problem error with problem id '+pid);
                    callback(error);
                    throw error;
                }else {
                    console.log('UPDATE PROBLEM : update problem complete');
                    callback(null, 'problem');
                }
            });
        }, 
        
        // insert new category
        function(callback){
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
                        console.log('UPDATE PROBLEM : insert pclinks error with problem id '+pid);
                        throw err;
                    }else {
                        console.log('UPDATE PROBLEM : insert pclinks complete');
                        callback(null, 'new category');
                    }
                });        
            }else {
                callback(null, 'new category');
            }
        }, 
        
        // delete exist category
        function(callback){
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
                        console.log('UPDATE PROBLEM : delete pclinks error with problem id '+pid);
                        throw err;
                    }else {
                        console.log('UPDATE PROBLEM : delete pclinks complete');
                        callback(null, 'delete category');
                    }
                });        
            }else {
                callback(null, 'delete category');
            }
        }, 
        
        // image file update
        function(callback){
            if(request.files.questionAttached || request.files.explanationAttached){
                var fileDataArray = new Array();

                var defaultPath = 'public/asset/images/';

                if(request.files.questionAttached){
                    getImageDataArray(fileDataArray, request.files.questionAttached, 'question', pid);
                }
                if(request.files.explanationAttached){
                    getImageDataArray(fileDataArray, request.files.explanationAttached, 'explanation', pid);
                }

                writeImageData(fileDataArray, pid, function(){
                    callback(null, 'file insert', fileDataArray);
                });
                
            }else {
                callback(null, 'file insert');
            }
        }
        
        //  callback result
    ], function(err, results){
        console.log(arguments);
        if(err){
            response.statusCode = 400;
            throw err;
        }else {
            if(results[3].length > 1){
                var fileData = results[3][1];
                var jsonFileData = JSON.stringify(fileData);
                response.send({
                    'files': jsonFileData
                });
            }
            response.end('updated');   
        }
    });
});

app.del('/problem/:pid', function(request, response){
        
    var pid = Number(request.param('pid'));
    
    async.parallel([
        
        // delete pclinks
        function(callback){
            client.query('DELETE FROM pcLinks WHERE pid = ?', [pid], function(error, results){
                if(error){
                    console.error('DELETE PROBLEM : delete pclinks error with problem id '+pid);
                    throw error;
                }else{
                    console.log('DELETE PROBLEM : delete pclinks complete');
                    callback(null);
                }
            });
        },
        
        // delete images
        function(callback){
            
            async.waterfall([
                
                // find images
                function(subCallback){
                    var queryForProblemImages = 'SELECT * FROM problemImages WHERE pid = ?';
                    client.query(queryForProblemImages, [pid], function(error, results){
                        if(error){
                            console.log('DELETE PROBLEM : select problemImages error with problem id '+pid);
                            throw error;
                        }else{
                            console.log('DELETE PROBLEM : select problemImages complete');
                            subCallback(null, results);
                        }
                    });    
                },
                
                // delete image files
                function(results, subCallback){
                    if(results.length){
                        for(var i=0; i<results.length; i++){
                            (function(i){
                                var imagePath = results[i].name;

                                fs.unlink(imagePath, function (removeFileError) {
                                    if (removeFileError) {
                                        console.log('DELETE PROBLEM : delete image file error with path '+imagePath);
                                        throw removeFileError;
                                    }else{
                                        console.log('DELETE PROBLEM : delete image file complete with path '+imagePath);    
                                        if(i==(results.length-1)){
                                            console.log('DELETE PROBLEM : select problemImages complete');
                                            subCallback(null);
                                        }
                                    }
                                });
                            })(i);
                        }
                    }else {
                        console.log('DELETE PROBLEM : no images in problem');
                        subCallback(null);
                    }
                },
                
                // delete problem images
                function(subCallback){
                    client.query('DELETE FROM problemImages WHERE pid = ?', [pid], function(removeError, data){
                        if(removeError){
                            response.statusCode = 400;
                            console.log('DELETE PROBLEM : delete problemImages error with problemImages id '+results[i].imgid);
                            throw removeError;

                        }else{
                            console.log('DELETE PROBLEM : delete problemImages complete with problemImages id '+results[i].imgid);
                            subCallback(null);
                        }
                    });
                }
            ], function(err, results){
                callback(null);
            });
        },
        
        // delete problem
        function(callback){
            client.query('DELETE FROM problems WHERE pid = ?', [pid], function(error, results){
                if(error){
                    console.log('DELETE PROBLEM : delete problem error with problem id '+pid);
                    throw error;
                }else{
                    console.log('DELETE PROBLEM : delete problem complete');
                    callback(null);
                }
            });
        }
    ], function(err, results){
        response.end('deleted');
    });
});

app.get('/categories', function(request, response){
    client.query('select * from categories', function(error, data){
        if(error){
            console.error('LOAD ALL CATEGORIES : error');
            throw error;
        }else{
            console.log('LOAD ALL CATEGORIES : complete');
            response.send(data);
            response.end('success');
        }
    });
});

app.post('/category', function(request, response){
    
    var name = request.param('name');
    var parentId = request.param('parentId');
    var path = request.param('path');
    
    console.log('post category path,name: ' + path +','+ name +', parentId : '+ parentId);
    
    client.query('INSERT INTO categories (name, path) VALUES(?, ?)', [name, path], function(err, info){
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

app.del('/category/:cid', function(request, response){
        
    var cid = Number(request.param('cid'));
    
    
    client.query('SELECT * FROM categories WHERE cid='+cid, function(error, results){
        
        if(error){
            response.statusCode = 400;
            console.log('DELETE CATEGORY : select category error');
            throw error;
        
        }else{
            console.log('DELETE CATEGORY : select category complete');

            var deletingCategoryPath = results[0].path;
            deletingCategoryPath = deletingCategoryPath + cid.toString() + '/';
            
            client.query('DELETE FROM categories WHERE path LIKE "%'+deletingCategoryPath+'%"', function(error2){
                
                if(error2){
                    response.statusCode = 400;
                    console.log('DELETE CATEGORY : select children categories error');
                    throw error2;
                
                }else{
                
                    client.query('DELETE FROM categories WHERE cid=?', [cid], function(err, data){
                        
                        if(err){
                            response.statusCode = 400;
                            console.log('DELETE CATEGORY : delete category error');
                            throw err;
                            
                        }else{
                            console.log('DELETE CATEGORY : delete category complete');
                            response.send('OK');   
                        }
                    });
                }
            });        
        }
    });
});

// check server running
//http.createServer(app).listen(process.env.PORT || 3000, function(req, res){
http.createServer(app).listen(process.env.PORT || 3000, function(req, res){
    
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