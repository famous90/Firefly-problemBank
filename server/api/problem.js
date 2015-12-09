var async = require('async');
var XLSX = require('xlsx');
var multiparty = require('connect-multiparty');
var multipartyMiddleware = multiparty();
var router = require('express').Router();
var client = require('../mysql-client');
var FileDataController = require('../controller/FileDataController');
var AuthController = require('../controller/AuthController');
var StringController = require('../controller/StringController');


router.get('/problems', function(request, response){
    client.query('select * from Problems', function(error, data){
        if(error){
            response.statusCode = 400;
            response.end(error);
            console.error(error);
        }else {
            response.statusCode = 200;
            response.send(data);
            response.end();
        }
    });
});

// create problem
router.post('/api/problem/create', multipartyMiddleware, function(request, response){
    
    var data = JSON.parse(request.body.data);
    var parameters = data.problem;
    var user = data.user;
    var question = parameters.question;
    var answer = parameters.answer;
    var explanation = parameters.explanation;
    var categories = parameters.selections;
    var notAnswerExamples = JSON.stringify(parameters.notAnswerExamples);
    var answerType = parameters.answerType;
    
    var stringController = new StringController();

    var hasQuestionImage = false;
    var hasExplanationImage = false;
    var insertId = {};
    
    console.log(JSON.parse(JSON.stringify(parameters)));
    console.log(JSON.parse(JSON.stringify(user)));
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
        
        // check authorization
        function(callback){
            var authController = new AuthController();
            authController.isAuthorizatedWithRoles(user.uid, user.authkey, ['admin', 'editor'], function(result){
                if(result){
                    callback(null);
                }else{
                    callback(401);
                }
            }, function(err){
                callback(400);
            });
        },
        
        // insert problem
        function(callback){
            client.query('INSERT INTO Problems (question, answer, explanation, notAnswerExamples, answerType) VALUES(?, ?, ?, ?, ?)', [question, answer, explanation, notAnswerExamples, answerType], function(error, info){
                if(error){
                    callback(error);
                }else{
                    insertId = info.insertId;    
                    callback(null, info.insertId);
                }
            });        
        },
        
        // insert problem log
        function(pid, callback){
            var createLog = stringController.getUpdateLogWithUid(user.uid, 'create');
            client.query('INSERT INTO ProblemLogs (pid, log, type) VALUES(?, ?, ?)', [pid, createLog, 'create'], function(error, result){
                if(error){
                    callback(error);
                }else{
                    callback(null, pid);
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
                        }else{
                            subCallback(null);
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
                            subCallback(null);
                        }, function(error){
                            subCallback(error);
                        });                        

                    }else {
                        subCallback(null);
                    }
                }
                
            ], function(error, results){
                if(error){
                    callback(error);
                }else{
                    callback(null);
                }
            });
        },
        
        // increase user's createProblemCount
        function(callback){
            client.query('UPDATE Users SET createProblemCount = createProblemCount+1 WHERE uid = ?', [user.uid], function(err, result){
                if(err){
                    callback(400);
                } else {
                    callback(null);
                }
            })
        }
        
        // callback result
    ], function(err, results){
        if(err){
            response.statusCode = 400;
            response.end(err);
            console.error(err);
        }else {
            response.statusCode = 200;
            response.end();  
        }
    });
    
});

// update problem
router.put('/problem/:pid', multipartyMiddleware, function(request, response){
    
    var data = JSON.parse(request.body.data);
    var parameters = data.problem;
    var user = data.user;
    var pid = request.params.pid;
    var question = parameters.question;
    var answer = parameters.answer;
    var explanation = parameters.explanation;
    var notAnswerExamples = JSON.stringify(parameters.notAnswerExamples);
    var answerType = parameters.answerType;
    var newCategories = parameters.alterSelections.new;
    var deleteCategories = parameters.alterSelections.delete;
    
    var stringController = new StringController();
    
    console.log('pid : '+pid);
    console.log(JSON.parse(JSON.stringify(parameters)));
    console.log(JSON.parse(JSON.stringify(request.files)));
    
    async.parallel([
        
        // update problem content
        function(callback){
            
            async.waterfall([
                
                // update problem
                function(subCallback){
                    var query = 'UPDATE Problems SET question = ?, answer = ?, explanation = ?, notAnswerExamples = ?, answerType = ? WHERE pid = ?';
                    client.query(query, [question, answer, explanation, notAnswerExamples, answerType, pid], function(error, data){
                        if(error){
                            subCallback(error);
                        }else {
                            subCallback(null);
                        }
                    });
                },
                
                // insert problem log
                function(subCallback){
                    var updateLog = stringController.getUpdateLogWithUid(user.uid, 'update');
                    client.query('INSERT INTO ProblemLogs (pid, log, type) VALUES (?, ?, ?)', [pid, updateLog, 'update'], function(err, result){
                        if(err){
                            subCallback(err);
                        } else {
                            subCallback(null);
                        }
                    });
                }
                
            ], function(err, result){
                if(err){
                    callback(err);
                } else {
                    callback(null);
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
            response.statusCode = 200;
            response.end('deleted');   
        }
    });
});

router.post('/api/problem/create/excel', multipartyMiddleware, function(request, response){
    
    var file = {};
    var data = {};
    var user = {};
    var categories = {};
        
    async.waterfall([
        
        // check parameter
        function(callback){
            if(!request.body.data || !request.files.file){
                callback({message:'no parameter', statusCode:400});
            }

            file = request.files.file;
            data = JSON.parse(request.body.data);
            user = data.user;
            categories = data.categories;
            
            callback(null);
        },
        
        // is authorized
        function(callback){
            var authController = new AuthController();
            authController.isAuthorizatedWithRoles(user.uid, user.authkey, ['admin', 'editor'], function(result){
                if(result){
                    callback(null);
                }else{
                    callback({message:'not authorized', statusCode:401});
                }
            }, function(err){
                callback({message:err.code, error: err, statusCode:400});
            });
        },
        
        // insert problems
        function(callback){
            // insert array to mysql
            setProblemsFromExcel(file, function(data){
                client.query('INSERT INTO Problems (question, explanation, answer, notAnswerExamples, answerType) VALUES ?', [data], function(err, result){
                    if(err){
                        callback({message: err.code, error: err, statusCode: 400});
                    }else {
                        callback(null, result);
                    }
                })
            });
        },
        
        // insert pclink
        function(data, callback){
            setPids(data, function(pids){
                setPclinksArrayForQueryFromPCids(pids, categories, function(results){
                    client.query('INSERT INTO PcLinks (pid, cid) VALUES ?', results, function(err){
                        if(err){
                            callback({message: err.code, error: err, statusCode: 400});
                        }else{
                            callback(null, pids);
                        }                
                    });        
                })
            }, function(err){
                callback({message: err, statusCode:400});
            });
        },
        
        // insert problem log
        function(pids, callback){
            setUpdateLogArrayForQueryFromPids(pids, user.uid, 'create', function(results){
                client.query('INSERT INTO ProblemLogs (pid, log, type) VALUES ?', [results], function(err, result){
                    if(err){
                        callback({error: err, message:err.code, statusCode:400});
                    }else{
                        callback(null);
                    }
                });
            });
        }
        
    ], function(err, result){
        if(err){
            console.error(err);
            response.statusCode = err.statusCode;
            response.end(err.message);
        } else {
            response.statusCode = 200;
            response.end();
        }
    })
});

router.post('/load_problems', function(request, response){
    
    var categories = JSON.parse(request.body.categories);
    var problemNumber = request.body.problemNumber;
    var responseResults = {
        problems: [],
        pcLinks: [],
        problemImages: []
    };
    var stringController = new StringController();
    
    async.waterfall([
        
        // load problems
        function(callback){
            var query = 'SELECT DISTINCT Problems.* FROM Problems RIGHT JOIN PcLinks ON Problems.pid = PcLinks.pid';
            
            // connect category query
            if(categories.length){
                query += ' WHERE PcLinks.cid in ';
                query += stringController.getQueryForMultiCondition(categories, 'integer');
            }
//            query += ' ORDER BY RAND() LIMIT ' + problemNumber;
            query += ' ORDER BY pid LIMIT ' + problemNumber;

            client.query(query, function(err, results){
                if(err){
                    callback({message: err, statusCode: 400});
                }else{
                    if(results.length){
                        responseResults.problems = results;
                        callback(null, results);   
                    }else {
                        callback({message: 'no problem', statusCode: 400});
                    }
                }
            });        
        },
        
        // load categories and images
        function(problems, callback){
            
            async.parallel([
                
                // load categories
                function(subCallback){
                    var query = 'SELECT DISTINCT * FROM PcLinks WHERE pid in ';
                    query += stringController.getQueryForMultiConditionInProblems(problems);
                    query += ' ORDER BY pid';

                    client.query(query, function(error, results){
                        if(error){
                            subCallback({message: error, statusCode: 400});
                        }else{
                            responseResults.pcLinks = results;
                            subCallback(null);
                        }
                    });
                },
                
                // load images
                function(subCallback){
                    var query = 'SELECT DISTINCT * FROM ProblemImages WHERE pid in ';
                    query += stringController.getQueryForMultiConditionInProblems(problems);
                    query += ' ORDER BY pid';
                    
                    client.query(query, function(err, results){
                        if(err){
                            subCallback({message: err, statusCode: 400});
                        }else{
                            responseResults.problemImages = results;
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
            response.statusCode = err.statusCode;
            response.end(err.message);
            console.error(err.message);
        }else{
            response.statusCode = 200;
            console.log(responseResults);
            response.send(responseResults);
            response.end();
        }
    });
    
});

module.exports = router;

function setProblemsFromExcel(file, callback){
    var problems = new Array();
    
    var workbook = XLSX.readFile(file.path);    //  get excel file
    var sheet_name_list = workbook.SheetNames;  
    
    for(var i=0; i<sheet_name_list.length; i++){    // seperate sheet
        var theSheet = sheet_name_list[i];
        var worksheet = workbook.Sheets[theSheet];
        var theProblem;

        for (z in worksheet) {     // get text from the sheet
            /* all keys that do not begin with "!" correspond to cell addresses */
            if(z[0] === '!') continue;

            switch(z.charAt(0)){
                case 'A': {     // question
                    if(theProblem){
                        getArrayForQueryFromProblem(theProblem, function(result){
                            problems.push(result);
                        });
                    }
                    theProblem = {
                        question: {},
                        explanation: {},
                        answer: {},
                        notAnswerExamples: [
                            {content: {}},
                            {content: {}},
                            {content: {}},
                            {content: {}}
                        ],
                        answerType: 'single'
                    };

                    theProblem.question = worksheet[z].v;
                    break;
                }
                case 'B': {     // explanation
                    theProblem.explanation = worksheet[z].v;
                    break;
                }
                case 'C': {     // answer
                    theProblem.answer = worksheet[z].v;
                    break;
                }
                case 'D': {     // first example with not answer
                    theProblem.notAnswerExamples[0].content = worksheet[z].v;
                    theProblem.answerType = 'multiple'
                    break;
                }
                case 'E': {     // second example with not answer
                    theProblem.notAnswerExamples[1].content = worksheet[z].v;
                    break;
                }
                case 'F': {     // third example with not answer
                    theProblem.notAnswerExamples[2].content = worksheet[z].v;
                    break;
                }
                case 'G': {     // fourth example with not answer
                    theProblem.notAnswerExamples[3].content = worksheet[z].v;
                    break;
                }
                default: {      // not allowed if other cell input
                    continue;    
                }
            }
        }
        getArrayForQueryFromProblem(theProblem, function(result){
            problems.push(result);
        });
    }
    
    callback(problems);
}

function getArrayForQueryFromProblem(problem, callback){
    var theArray = new Array();
    for(theObject in problem){
        var theValue = problem[theObject];
        if(theObject == 'notAnswerExamples'){
            theArray.push(JSON.stringify(theValue));
        }else {
            theArray.push(theValue);
        }
    }
    callback(theArray);
}

function setPids(data, onSuccess, onError){
    if(!data.insertId){
        onError('not inserted');
    }
    
    var theArray = new Array();
    var pid = data.insertId;
    for(var i=0; i<data.affectedRows; i++){
        theArray.push(pid++);
    }
    
    onSuccess(theArray);
}

function setPclinksArrayForQueryFromPCids(pids, cids, callback){
    var theArray = new Array();
    for(var i=0; i<pids.length; i++){
        var pid = pids[i];
        for(var j=0; j<cids.length; j++){
            var pclink = [pid, cids[j]];
            theArray.push(pclink);
        }
    }
    
    callback(theArray);
}

function setUpdateLogArrayForQueryFromPids(pids, uid, type, callback){
    var stringController = new StringController();
    var theArray = new Array();
    
    for(var i=0; i<pids.length; i++){
        var updateLog = stringController.getUpdateLogWithUid(uid, type);
        theArray.push([pids[i], updateLog, type]);
    }
    
    callback(theArray);
}