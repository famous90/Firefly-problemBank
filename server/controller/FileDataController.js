var File = require('../model/File');
var fs = require('fs');
var fspath = require('path');
var randomString = require('randomstring');
var async = require('async');
var awsConnection = require('../aws-connection');
var client = require('../mysql-client');
var AWS = awsConnection.AWS;

function FileDataController (){
}

FileDataController.prototype.writeImageData = writeImageData;
FileDataController.prototype.getImageDataSet = getImageDataSet;
FileDataController.prototype.deleteImageFromS3andDB = deleteImageFromS3andDB;

function writeImageData (fileDataArray, pid, callback) {
    console.log(JSON.parse(JSON.stringify(fileDataArray)));
    for(var i=0; i<fileDataArray.length; i++){        
        (function(i){
            var fileData = fileDataArray[i];
            console.log('file data');
            console.log(fileData);
            var filename = fileData.fileName;
            var key = 'images/' + filename;
            var s3obj = new AWS.S3({
                params: {
                    Bucket: awsConnection.s3Bucket, 
                    Key: key
            }});
            
            async.waterfall([
                
                // read file
                function(asyncCallback){
                    fs.readFile(fileData.path, function (err, data) {
                        if(err){
                            console.log('file read error');
                            throw err; 
                        }else {
                            asyncCallback(null, data);
                        }
                    });
                },
                
                // upload to s3
                function(data, asyncCallback){
                    s3obj.upload({
                        ACL: "public-read",
                        Body: data
                    }, function(error, result){
                        if (error) {       
                            console.log("Error uploading data: ", error);
                            throw error;
                        } else {
                            console.log("Successfully uploaded data to myBucket/myKey");
                            console.log(JSON.parse(JSON.stringify(result)));
                            asyncCallback(null, result);
                        }
                    });
                },
                
                // insert to db
                function(result, asyncCallback){
                    client.query('INSERT INTO ProblemImages (pid, imageType, location, s3_object_key) VALUES(?, ?, ?, ?)', [pid, fileData.type, result.Location, key], function(err, info){
                        if(err){
                            throw err;
                        }else{
                            console.log('write file '+fileData.fileName);
                            asyncCallback(null);
                        }
                    });
                }
                
                // after call back
            ], function(err, results){
                if(err){
                    throw err;
                }else{
                    if(i == fileDataArray.length-1){
                        console.log('last image inserted');
                        callback();
                        return;
                    }
                }
            });                            
        })(i);
    }                            
};

function getImageDataSet (data, imageType, pid){
    
    var theImageDataArray = new Array();
    
    // if data is array
    if(data.length){
        for(var i=0; i<data.length; i++){
            var filePath = data[i].path;
            var fileName = imageType.substring(0, 2).toUpperCase() + '_' + pid + '_' + i + '_' + randomString.generate(20) + fspath.extname(filePath);
            var theFileDataSet = new File(filePath, imageType, fileName);
            theImageDataArray.push(theFileDataSet);
        }                                
    }else{
        var filePath = data.path;
        var fileName = imageType.substring(0, 2).toUpperCase() + '_' + pid + '_' + randomString.generate(20) + fspath.extname(filePath);
        var theFileDataSet = new File(filePath, imageType, fileName);
        theImageDataArray.push(theFileDataSet);
    }
    
    return theImageDataArray;
};

function deleteImageFromS3andDB (data, pid, types, callback) {
    var objects = getBucketObjects(data);
    var s3 = new AWS.S3();
    var params = {
        Bucket: awsConnection.s3Bucket,
        Delete: {
            Objects: objects
        },
        RequestPayer: 'requester'
    };
    
    async.waterfall([
        
        // request delete images to s3
        function(asyncCallback){
            s3.deleteObjects(params, function(err, data){
                if (err) {
                    console.error(err); // an error occurred
                    throw err;
                } else {
                    console.log(data);           // successful response
                    asyncCallback(null);   
                }
            });
        },
        
        // delete images from db
        function(asyncCallback){
            var query = 'delete from ProblemImages where (pid = ?)';
            if(types.length == 1){
                query += ' && (imageType = "' + types[0] + '")';   
            }
            client.query(query, [pid], function(err, data){
                if(err){
                    console.error(err);
                    throw err;
                }else {
                    asyncCallback(null);
                }
            });
        }
        
        // after async waterfall 
    ], function(err, results){
        if (err) {
            console.log(err, err.stack); // an error occurred
            throw err;
        } else {
            console.log(results);           // successful response 
            callback();
        }
    });
};

function getBucketObjects (data){
    var objects = new Array();
    
    for(var i=0; i<data.length; i++){
        var object = {
            Key: data[i].s3_object_key  
        };
        objects.push(object);
    }
    
    return objects;
};



module.exports = FileDataController;