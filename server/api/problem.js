var async = require('async');
var XLSX = require('xlsx');
var multiparty = require('connect-multiparty');
var multipartyMiddleware = multiparty();
var router = require('express').Router();
var client = require('../mysql-client');
var FileDataController = require('../controller/FileDataController');
var AuthController = require('../controller/AuthController');
var StringController = require('../controller/StringController');
var Problem = require('../model/Problem');

// get all problems
router.get('/api/problems', function(request, response){
    var user;
    
    async.waterfall([
        
        // check parameter
        function(callback){
            if(!request.body.user){
                callback({message:'no parameter', error:{}, statusCode:400});
            }

            user = request.body.user;
            
            callback(null);
        },
        
        // is authorized
        function(callback){
            var authController = new AuthController();
            authController.isAuthorizatedWithRoles(user.uid, user.authkey, ['admin'], function(result){
                if(result){
                    callback(null);
                }else{
                    callback({message:'not authorized', statusCode:401});
                }
            }, function(err){
                callback({message:err.code, error: err, statusCode:400});
            });
        }, 
        
        // get problems
        function(callback){
            client.query('select * from Problems', function(err, data){
                if(err){
                    callback({message:err.code, error: err, statusCode:400});
                }else {
                    callback(null, data);
                }
            });
        }
        
    ], function(err, result){
        if(err){
            console.error(err);
            response.statusCode = err.statusCode;
            response.end(err.message);
        } else {
            response.statusCode = 200;
            response.send(result);
            response.end();
        }
    })
});

// get problem with pid
router.get('/api/problem/:pid', function(request, response){  
    var user, pid;
    
    async.waterfall([
        
        // check parameter
        function(callback){
            if(!request.body.user || !request.params.pid){
                callback({message:'no parameter', error:{}, statusCode:400});
            }

            user = request.body.user;
            pid = request.params.pid;
            
            callback(null);
        },
        
        // is authorized
        function(callback){
            var authController = new AuthController();
            authController.isAuthorizatedWithRoles(user.uid, user.authkey, ['admin'], function(result){
                if(result){
                    callback(null);
                }else{
                    callback({message:'not authorized', statusCode:401});
                }
            }, function(err){
                callback({message:err.code, error: err, statusCode:400});
            });
        }, 
        
        // get problems
        function(callback){
            client.query('SELECT * FROM Problems WHERE pid = ?', [pid], function(err, data){
                if(err){
                    callback({message:err.code, error: err, statusCode:400});
                }else {
                    callback(null, data);
                }
            });
        }
        
    ], function(err, result){
        if(err){
            console.error(err);
            response.statusCode = err.statusCode;
            response.end(err.message);
        } else {
            response.statusCode = 200;
            response.send(result);
            response.end();
        }
    })
});

// create problem
router.post('/api/problem/create', multipartyMiddleware, function(request, response){
    
    var problem, user, pid;

    var hasQuestionImage = false;
    var hasExplanationImage = false;
    var insertId = {};
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
    
    async.waterfall([
        
        // check parameter
        function(callback){
            var data = JSON.parse(request.body.data);
            if(!data || !data.problem || !data.user){
                callback({message:'no parameter', error:{}, statusCode: 400});
            }
            
            problem = new Problem(data.problem);
            user = data.user;
            callback(null);
        },
        
        // check authorization
        function(callback){
            var authController = new AuthController();
            authController.isAuthorizatedWithRoles(user.uid, user.authkey, ['admin', 'editor'], function(result){
                if(result){
                    callback(null);
                }else{
                    callback({message:'not authorized', error:{}, statusCode: 401});
                }
            }, function(err){
                callback({message:JSON.stringify(err), error:err, statusCode: 400});
            });
        },
        
        // insert problem
        function(callback){
            var query = 'INSERT INTO Problems (question, answer, explanation, notAnswerExamples, answerType) VALUES(?, ?, ?, ?, ?)';
            client.query(query, [problem.question, problem.answer, problem.explanation, problem.notAnswerExamples, problem.answerType], function(error, info){
                if(error){
                    callback(error);
                }else{
                    pid = info.insertId;    
                    callback(null);
                }
            });        
        },
        
        // insert problem log
        function(callback){
            var createLog = getProblemLogWithUid(user.uid, 'create');
            insertProblemLogsWithLogs([[Number(pid), createLog, 'create']], function(result){
                callback(null);
            }, function(err){
                callback(err);
            });
        },
        
        // insert pclink and images
        function(callback){
            
            async.parallel([
                
                // insert pclink
                function(subCallback){
                    var query = 'INSERT INTO PcLinks (pid, cid) VALUES ';
                    for(i=0; i<problem.categories.length; i++){
                        if(i != 0){
                            query += ',';
                        }
                        var cid = problem.categories[i];
                        query += '('+pid+','+cid+')';
                    }

                    client.query(query, [pid, cid], function(err){
                        if(err){
                            subCallback(err);
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
            var query = 'UPDATE Users SET createProblemCount = createProblemCount+1 WHERE uid = ?';
            client.query(query, [user.uid], function(err, result){
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
    
//    var data = JSON.parse(request.body.data);
//    var parameters = data.problem;
//    var user = data.user;
//    var pid = request.params.pid;
//    var question = parameters.question;
//    var answer = parameters.answer;
//    var explanation = parameters.explanation;
//    var notAnswerExamples = JSON.stringify(parameters.notAnswerExamples);
//    var answerType = parameters.answerType;
//    var newCategories = parameters.alterSelections.new;
//    var deleteCategories = parameters.alterSelections.delete;
//        
//    console.log('pid : '+pid);
//    console.log(JSON.parse(JSON.stringify(parameters)));
//    console.log(JSON.parse(JSON. stringify(request.files)));
    
    var pid, problem, user;
    
    async.waterfall([
        
        // check parameter
        function(callback){
            var data = JSON.parse(request.body.data);
            if(!data || !data.problem || !data.user || !request.params.pid){
                callback({message:'no parameter', error:{}, statusCode: 400});
            }
            
            problem = new Problem(data.problem);
            user = data.user;
            pid = request.params.pid;
            callback(null);
        },
        
        // check authorization
        function(callback){
            var authController = new AuthController();
            authController.isAuthorizatedWithRoles(user.uid, user.authkey, ['admin', 'editor'], function(result){
                if(result){
                    callback(null);
                }else{
                    callback({message:'not authorized', error:{}, statusCode: 401});
                }
            }, function(err){
                callback({message:JSON.stringify(err), error:err, statusCode: 400});
            });
        },
        
        // update problem
        function(callback){
            var query = 'UPDATE Problems SET question = ?, answer = ?, explanation = ?, notAnswerExamples = ?, answerType = ? WHERE pid = ?';
            client.query(query, [problem.question, problem.answer, problem.explanation, problem.notAnswerExamples, problem.answerType, pid], function(err, data){
                if(err){
                    callback({message:err.code, error:err, statusCode:400});
                }else {
                    callback(null);
                }
            });
        },

        // insert problem log
        function(callback){
            var updateLog = getProblemLogWithUid(user.uid, 'update');
            insertProblemLogsWithLogs([[Number(pid), updateLog, 'update']], function(result){
                callback(null);
            }, function(err){
                callback({message:err.code, error:err, statusCode:400});
            });
        },
        
        function(callback){
            
            async.parallel([
                // insert new category
                function(subCallback){
                    if(problem.newCategories.length){
                        var insertQuery = 'INSERT INTO PcLinks (pid, cid) VALUES ';
                        for(i=0; i<problem.newCategories.length; i++){
                            if(i != 0){
                                insertQuery += ',';
                            }
                            var cid = problem.newCategories[i];
                            insertQuery += '('+pid+','+cid+')';
                        }
                        client.query(insertQuery, function(err, results){
                            if(err){
                                subCallback(err);
                            }else {
                                subCallback(null, 'new category');
                            }
                        });        
                    }else {
                        subCallback(null);
                    }
                }, 

                // delete exist category
                function(subCallback){
                    if(problem.deleteCategories.length){
                        var deleteQuery = 'DELETE FROM PcLinks WHERE ';
                        for(i=0; i<problem.deleteCategories.length; i++){
                            if(i != 0){
                                deleteQuery += '||';
                            }
                            var cid = problem.deleteCategories[i];
                            deleteQuery += '(pid='+pid+'&&cid='+cid+')';
                        }
                        client.query(deleteQuery, function(err, results){
                            if(err){
                                subCallback(err);
                            }else {
                                subCallback(null);
                            }
                        });        
                    }else {
                        subCallback(null);
                    }
                }, 

                // image file update
                function(subCallback){
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
//                        async.waterfall([    
//                            // get images
//                            function(subCallback){
//                                var getQuery = 'select * from ProblemImages where (pid = ?)';
//                                if(imageTypes.length == 1){
//                                    getQuery += ' && (imageType = "' + imageTypes[0] + '")'; 
//                                }
//                                client.query(getQuery, [pid], function(err, results){
//                                    if(err){
//                                        subCallback(err);
//                                    }else {
//                                        subCallback(null, results);
//                                    }
//                                });
//
//                            },
//
//                            // delete images
//                            function(results, subCallback){
//                                if(results && results.length > 0){
//                                    fileDataController.deleteImageFromS3andDB(results, pid, imageTypes, function(){
//                                        subCallback(null);
//                                    }, function(error){
//                                        subCallback(error);
//                                    });        
//                                }else {
//                                    subCallback(null);
//                                }
//                            },
//
//                            // insert images
//                            function(subCallback){
//                                fileDataController.writeImageData(newFiles, pid, function(){
//                                    subCallback(null);
//                                }, function(error){
//                                    subCallback(error);
//                                });    
//                            }
//
//                            // after call back
//                        ], function(err, result){
//                            if(err){
//                                subCallback(err);
//                            }else {
                                subCallback(null);   
//                            }
//                        });
                    }else {
                        subCallback(null);
                    }
                }

                //  callback result
            ], function(err, results){
                if(err){
                    callback(err);
                }else {
                    callback(null);
//                    if(results[3].length > 1){
//                        var fileData = results[3][1];
//                        var jsonFileData = JSON.stringify(fileData);
//                        response.send({
//                            'files': jsonFileData
//                        });
//                    }
//                    response.end('updated');   
                }
            });
            
        }
                
        // callback result
    ], function(err, results){
        if(err){
            response.statusCode = 400;
            response.end(err.message);
            console.error(err);
        }else {
            response.statusCode = 200;
            response.end();  
        }
    });
});

// delete problem
router.post('/api/problem/delete', function(request, response){
        
    var pid, user;
    
    async.waterfall([
        
        // check parameters
        function(callback){
            if(!request.body.pid || !request.body.user){
                callback({message:'no parameter', error:{}, statusCode:401});
            }
            pid = request.body.pid;
            user = request.body.user;
            console.log(user);
    
            callback(null);
        },
        
        // check authorization
        function(callback){
            var authController = new AuthController();
            authController.isAuthorizatedWithRoles(user.uid, user.authkey, ['admin'], function(result){
                if(result){
                    callback(null);
                }else{
                    callback({message:'not authorized', error:{}, statusCode:401});
                }
            }, function(err){
                callback({message:err.code, error:err, statusCode:400});
            });
        },
        
        // find images
        function(callback){
            var query = 'SELECT * FROM ProblemImages WHERE pid = ?';
            client.query(query, [pid], function(error, results){
                if(error){
                    callback({message:error.code, error:error, statusCode:400});
                }else{
                    callback(null, results);
                }
            });    
        },

        // delete image files
        function(results, callback){
            if(results.length){
                var fileDataController = new FileDataController();
                fileDataController.deleteImageFromS3andDB(results, pid, '', function(){
                    callback(null);
                }, function(error){
                    callback({message:JSON.stringify(error), error:error, statusCode:400});
                });
            }else{
                callback(null);
            }

        },
        
        // delete pclinks
        function(callback){
            var query = 'DELETE FROM pcLinks WHERE pid = ?';
            client.query(query, [pid], function(err){
                if(err){
                    callback({message: err.code, error: err, statusCode:400});
                } else{
                    callback(null);
                } 
            });
        },
        
        // find problem creater
        function(callback){
            var query = 'SELECT * FROM ProblemLogs WHERE (pid = ? AND type="create")';
            client.query(query, [pid], function(err, result){
                if(err){
                    callback({message: err.code, error: err, statusCode:400});
                } else{
                    var log = JSON.parse(result[0].log);
                    callback(null, log);
                }
            });
        },
        
        // decrease creater's insertProblemCount
        function(log, callback){
            var query = 'UPDATE Users SET createProblemCount = createProblemCount - 1 WHERE uid = ?';
            client.query(query, [log.createdAt], function(err, result){
                if(err){
                    callback({message: err.code, error: err, statusCode:400});
                } else {
                    callback(null);
                }
            });
        },
        
        // delete problem
        function(callback){
            var query = 'DELETE FROM Problems WHERE pid = ?';
            client.query(query, [pid], function(error, results){
                if(error){
                    callback({message:error.code, error:error, statusCode:400});
                }else{
                    callback(null);
                }
            });
        },
        
        // update problem log
        function(callback){
            var deleteLog = getProblemLogWithUid(user.uid, 'delete');
            insertProblemLogsWithLogs([[Number(pid), deleteLog, 'delete']], function(result){
                callback(null);
            }, function(err){
                callback({message:err.code, error:err, statusCode:400});
            });
        }
        
    ], function(err, results){
        if(err){
            console.error(err);
            response.statusCode = err.statusCode;
            response.end();
//            response.end(err.message);
        }else {
            response.statusCode = 200;
            response.end();   
        }
    });
});

// create problems from excel
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
                    client.query('INSERT INTO PcLinks (pid, cid) VALUES ?', [results], function(err){
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
                insertProblemLogsWithLogs(results, function(result){
                    callback(null);
                }, function(err){
                    callback({error: err, message:err.code, statusCode:400});
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

// load problems with categories
router.post('/load_problems', function(request, response){
    
    var categories = request.body.categories;
//    var categories = JSON.parse(request.body.categories);
    var numberOfProblems = request.body.numberOfProblems;
    var responseResults = {
        problems: [],
        pcLinks: [],
        problemImages: []
    };
    var stringController = new StringController();
    
    async.waterfall([
        
        // get problems with categories
        function(callback){
            var query = 'SELECT DISTINCT Problems.* FROM Problems RIGHT JOIN PcLinks ON Problems.pid = PcLinks.pid';
            
            // connect category query
            if(categories.length){
                query += ' WHERE PcLinks.cid in ';
                query += stringController.getQueryForMultiCondition(categories, 'integer');
            }
//            query += ' ORDER BY RAND() LIMIT ' + numberOfProblems;
            query += ' ORDER BY pid LIMIT ' + numberOfProblems;
            console.log(query);
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


//
// set exam problem
//
// set start problem
router.post('/api/problem/solve/start', function(request, response){
    var category, user;
    
    async.waterfall([
        
        // check parameter
        function(callback){
            if(!request.body.cid || !request.body.user){
                callback({message:'missing parameter', error:{}, statusCode:400});
            }
            cid = request.body.cid;
            user = request.body.user;
            
            callback(null);
        },
        
        // is authorized
        function(callback){
            var authController = new AuthController();
            authController.isAuthorizatedWithRoles(user.uid, user.authkey, ['admin', 'editor', 'user'], function(result){
                if(result){
                    callback(null);
                }else{
                    callback({message:'not authorized', error:{}, statusCode: 401});
                }
            }, function(err){
                callback({message:JSON.stringify(err), error:err, statusCode: 400});
            });        
        },
        
        function(callback){
            var query = 'SELECT pid, question, answer, notAnswerExamples, answerType FROM Problems ORDER BY RAND() LIMIT 1';
            client.query(query, function(err, result){
                if(err){
                    callback({message:err.code, error:err, statusCode: 400});
                }else {
                    callback(null, result);
                }
            })
        }
        
    ], function(err, result){
        if(err){
            response.statusCode = err.statusCode;
            response.end(err.message);
            console.error(err);
        } else {
            response.statusCode = 200;
            response.send(result);
            response.end();
            console.log(result);
        }
    });
});

// set next problem
router.post('/api/problem/solve', function(request, response){
    var solveInfo, user;
    
    async.waterfall([
        
        // check parameter
        function(callback){
            for(object in request.body){
                if(typeof object == undefined){
                    callback({message:'missing parameter', error:{}, statusCode:400});    
                }
            }
            solveInfo = request.body.solveInfo;
            user = request.body.user;
            console.log(solveInfo);
            
            callback(null);
        },
        
        // is authorized
        function(callback){
            var authController = new AuthController();
            authController.isAuthorizatedWithRoles(user.uid, user.authkey, ['admin', 'editor', 'user'], function(result){
                if(result){
                    callback(null);
                }else{
                    callback({message:'not authorized', error:{}, statusCode: 401});
                }
            }, function(err){
                callback({message:JSON.stringify(err), error:err, statusCode: 400});
            });        
        },
        
        function(callback){
            var query = 'SELECT pid, question, answer, notAnswerExamples, answerType FROM Problems ORDER BY RAND() LIMIT 1';
            client.query(query, function(err, result){
                if(err){
                    callback({message:err.code, error:err, statusCode: 400});
                }else {
                    callback(null, result);
                }
            })
        }
        
    ], function(err, result){
        if(err){
            response.statusCode = err.statusCode;
            response.end(err.message);
            console.error(err);
        } else {
            response.statusCode = 200;
            response.send(result);
            response.end();
            console.log(result);
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

function getProblemLogWithUid(uid, type){
    var now = new Date();
    var updateInfo = {};
    if(type == 'create'){
        updateInfo = {createdAt:now.getTime(), createdBy:uid};   
    }else if(type == 'delete') {
        updateInfo = {deletedAt:now.getTime(), deletedBy:uid};
    }else {
        updateInfo = {updatedAt:now.getTime(), updatedBy:uid};
    }
    var updatedLog = JSON.stringify(updateInfo);
    
    return updatedLog;
}

function setUpdateLogArrayForQueryFromPids(pids, uid, type, callback){
    var theArray = new Array();
    
    for(var i=0; i<pids.length; i++){
        var updateLog = getProblemLogWithUid(uid, type);
        theArray.push([pids[i], updateLog, type]);
    }
    
    callback(theArray);
}

function insertProblemLogsWithLogs(logs, onSuccess, onError){
    client.query('INSERT INTO ProblemLogs (pid, log, type) VALUES ?', [logs], function(err, result){
        if(err){
            onError(err);
        }else{
            onSuccess(result);
        }
    });
}