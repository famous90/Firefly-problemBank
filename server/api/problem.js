var async = require('async');
var multiparty = require('connect-multiparty');
var multipartyMiddleware = multiparty();
var router = require('express').Router();
var client = require('../mysql-client');
var FileDataController = require('../controller/FileDataController');


router.get('/problems', function(request, response){
    
    client.query('select * from Problems', function(error, data){
        if(error){
            response.statusCode = 400;
            response.end(error);
            console.error(error);
            throw error;
        }else {
            response.statusCode = 200;
            response.send(data);
            response.end();
        }
    });
});

router.post('/problem', multipartyMiddleware, function(request, response){
    
    var parameters = JSON.parse(request.body.data).problem;
    var question = parameters.question;
    var answer = parameters.answer;
    var explanation = parameters.explanation;
    var categories = parameters.selections;
    var notAnswerExamples = JSON.stringify(parameters.notAnswerExamples);
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
            client.query('INSERT INTO Problems (question, answer, explanation, notAnswerExamples, answerType) VALUES(?, ?, ?, ?, ?)', [question, answer, explanation, notAnswerExamples, answerType], function(error, info){
                if(error){
                    callback(error);
                    throw error;
                }else{
                    insertId = info.insertId;    
                    callback(null, info.insertId);
                }
            });        
        },
        
        // insert pclink and images
        function(pid, callback){
            
            async.parallel([
                
                // insert pclink
                function(subCallback){
                    var pclinkQuery = 'INSERT INTO PcLinks (pid, cid) VALUES ';
                    for(i=0; i<categories.length; i++){
                        if(i != 0){
                            pclinkQuery += ',';
                        }
                        var cid = categories[i];
                        pclinkQuery += '('+pid+','+cid+')';
                    }

                    client.query(pclinkQuery, [pid, cid], function(cateError){
                        if(cateError){
                            subCallback(cateError);
                            throw cateError;
                        }else{
                            subCallback(null, 'categories');
                        }                
                    });                
                },
                
                // insert images
                function(subCallback){
                    if(hasImage){
                        var fileDataController = new FileDataController();
                        var fileDataArray = new Array();

                        if(hasQuestionImage){
                            var qstImages = fileDataController.getImageDataSet(request.files.questionAttached, 'question', pid);
                            fileDataArray.push.apply(fileDataArray, qstImages);
                        }
                        if(hasExplanationImage){
                            var explnImages = fileDataController.getImageDataSet(request.files.explanationAttached, 'explanation', pid);
                            fileDataArray.push.apply(fileDataArray, explnImages);
                        }

                        fileDataController.writeImageData(fileDataArray, pid, function(){
                            subCallback(null, 'images');
                        }, function(error){
                            subCallback(error);
                        });                        

                    }else {
                        subCallback(null, 'images');
                    }
                }
                
            ], function(error, results){
                if(error){
                    callback(error);
                    throw error;
                }else{
                    callback(null);   
                }
            });
        }
        
        // callback result
    ], function(err, results){
        if(err){
            response.statusCode = 400;
            response.end(err);
            console.error(err);
            throw err;
        }else {
            response.statusCode = 200;
            response.end('insert');  
        }
    });
    
});

router.put('/problem/:pid', multipartyMiddleware, function(request, response){
    
    var parameters = JSON.parse(request.body.data).problem;
    var pid = request.params.pid;
    var question = parameters.question;
    var answer = parameters.answer;
    var explanation = parameters.explanation;
    var notAnswerExamples = JSON.stringify(parameters.notAnswerExamples);
    var answerType = parameters.answerType;
    var newCategories = parameters.alterSelections.new;
    var deleteCategories = parameters.alterSelections.delete;
    
    console.log('pid : '+pid);
    console.log(JSON.parse(JSON.stringify(parameters)));
    console.log(JSON.parse(JSON.stringify(request.files)));
    
    async.parallel([
        
        // update problem content
        function(callback){
            client.query('UPDATE Problems SET question = ?, answer = ?, explanation = ?, notAnswerExamples = ?, answerType = ? WHERE pid = ?', [question, answer, explanation, notAnswerExamples, answerType, pid], function(error, data){
                if(error){
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
                var insertQuery = 'INSERT INTO PcLinks (pid, cid) VALUES ';
                for(i=0; i<newCategories.length; i++){
                    if(i != 0){
                        insertQuery += ',';
                    }
                    var cid = newCategories[i];
                    insertQuery += '('+pid+','+cid+')';
                }
                client.query(insertQuery, function(err, results){
                    if(err){
                        callback(err);
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
                var deleteQuery = 'DELETE FROM PcLinks WHERE ';
                for(i=0; i<deleteCategories.length; i++){
                    if(i != 0){
                        deleteQuery += '||';
                    }
                    var cid = deleteCategories[i];
                    deleteQuery += '(pid='+pid+'&&cid='+cid+')';
                }
                client.query(deleteQuery, function(err, results){
                    if(err){
                        callback(err);
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
                var fileDataController = new FileDataController();
                var newFiles = new Array();
                var imageTypes = new Array();

                if(request.files.questionAttached){
                    var qstnImages = fileDataController.getImageDataSet(request.files.questionAttached, 'question', pid);
                    newFiles.push.apply(newFiles, qstImages);
                    imageTypes.push('question');
                }
                if(request.files.explanationAttached){
                    var explnImages = fileDataController.getImageDataSet(request.files.explanationAttached, 'explanation', pid);
                    newFiles.push.apply(newFiles, explnImages);
                    imageTypes.push('explanation');
                }
                console.log('new files');
                console.log(JSON.parse(JSON.stringify(newFiles)));
                console.log(JSON.parse(JSON.stringify(imageTypes)));
                
                // change images
                async.waterfall([    
                    // get images
                    function(subCallback){
                        var getQuery = 'select * from ProblemImages where (pid = ?)';
                        if(imageTypes.length == 1){
                            getQuery += ' && (imageType = "' + imageTypes[0] + '")'; 
                        }
                        client.query(getQuery, [pid], function(err, results){
                            if(err){
                                subCallback(err);
                                throw err;
                            }else {
                                subCallback(null, results);
                            }
                        });
                        
                    },
                    
                    // delete images
                    function(results, subCallback){
                        if(results && results.length > 0){
                            fileDataController.deleteImageFromS3andDB(results, pid, imageTypes, function(){
                                subCallback(null);
                            }, function(error){
                                subCallback(error);
                            });        
                        }else {
                            subCallback(null);
                        }
                    },
                    
                    // insert images
                    function(subCallback){
                        fileDataController.writeImageData(newFiles, pid, function(){
                            subCallback(null);
                        }, function(error){
                            subCallback(error);
                        });    
                    }
                    
                    // after call back
                ], function(err, result){
                    if(err){
                        callback(err);
                    }else {
                        callback(null, 'file insert', newFiles);   
                    }
                });
            }else {
                callback(null, 'file insert');
            }
        }
        
        //  callback result
    ], function(err, results){
        if(err){
            response.statusCode = 400;
            response.end(err);
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

router.delete('/problem/:pid', function(request, response){
        
    var pid = request.params.pid;
    
    async.parallel([
        
        // delete pclinks
        function(callback){
            client.query('DELETE FROM PcLinks WHERE pid = ?', [pid], function(error, results){
                if(error){
                    callback(error);
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
                    var queryForProblemImages = 'SELECT * FROM ProblemImages WHERE pid = ?';
                    client.query(queryForProblemImages, [pid], function(error, results){
                        if(error){
                            subCallback(error);
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
                        var fileDataController = new FileDataController();
                        fileDataController.deleteImageFromS3andDB(results, pid, '', function(){
                            subCallback(null);
                        }, function(error){
                            subCallback(error);
                        });
                    }else{
                        subCallback(null);
                    }
                        
                }
            ], function(err, results){
                if(err){
                    callback(err);
                }else{
                    callback(null);   
                }
            });
        },
        
        // delete problem
        function(callback){
            client.query('DELETE FROM Problems WHERE pid = ?', [pid], function(error, results){
                if(error){
                    callback(error);
                    throw error;
                }else{
                    console.log('DELETE PROBLEM : delete problem complete');
                    callback(null);
                }
            });
        }
    ], function(err){
        if(err){
            response.statusCode = 400;
            response.end(err);
            console.error(err);
        }else {
            console.log('DELETE PROBLEM : delete problem transaction complete');
            response.end('deleted');   
        }
    });
});

router.post('/load_problems', function(request, response){
    
    var categories = JSON.parse(request.body.categories);
    var problemNumber = request.body.problemNumber;
    var responseResults = {
        problems: [],
        pcLinks: [],
        problemImages: []
    };
    
    console.log(categories);
    
    async.waterfall([
        
        // load problems
        function(callback){
            var problemsQuery = 'SELECT DISTINCT Problems.* FROM Problems RIGHT JOIN PcLinks ON Problems.pid = PcLinks.pid';
            
            // connect category query
            if(categories.length){
                problemsQuery += ' WHERE (';
                for(var i=0; i<categories.length; i++){
                    problemsQuery += 'PcLinks.cid = '+categories[i];
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
                    callback(error);
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
                    var pclinkQuery = 'SELECT DISTINCT * FROM PcLinks WHERE (';
                    for(var i=0; i<problemResults.length; i++){
                        pclinkQuery += 'pid = '+problemResults[i].pid;
                        if(i != problemResults.length - 1){
                            pclinkQuery += ' || ';
                        }
                    }
                    pclinkQuery += ') ORDER BY pid';

                    client.query(pclinkQuery, function(error, results){
                        if(error){
                            subCallback(error);
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
                    var imageQuery = 'SELECT DISTINCT * FROM ProblemImages WHERE (';
                    for(var i=0; i<problemResults.length; i++){ 
                        imageQuery += 'pid = '+problemResults[i].pid;
                        if(i != problemResults.length - 1){
                            imageQuery += ' || ';
                        }
                    }
                    imageQuery += ') ORDER BY pid';
                    
                    client.query(imageQuery, function(imageError, imageResults){
                        if(imageError){
                            subCallback(imageError);
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
                    callback(err);
                }else{
                    callback(null);    
                }
            });
        }
        
        // callback results
    ], function(err, results){
        if(err){
            response.statusCode = 400;
            response.end(err);
        }else{
            response.statusCode = 200;
            response.send(responseResults);
            response.end('loaded');
        }
    });
    
});

module.exports = router;