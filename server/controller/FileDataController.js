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

function writeImageData (fileDataArray, pid, onSuccess, onError) {
    for(var i=0; i<fileDataArray.length; i++){        
        (function(i){
            var fileData = fileDataArray[i];
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
                function(callback){
                    fs.readFile(fileData.path, function (err, data) {
                        if(err){
                            callback(err);
                        }else {
                            callback(null, data);
                        }
                    });
                },
                
                // upload to s3
                function(data, callback){
                    s3obj.upload({
                        ACL: "public-read",
                        Body: data
                    }, function(error, result){
                        if (error) {
                            callback(error);
                        } else {
                            console.log("Successfully uploaded data to myBucket/myKey");
                            console.log(JSON.parse(JSON.stringify(result)));
                            callback(null, result);
                        }
                    });
                },
                
                // insert to db
                function(result, callback){
                    client.query('INSERT INTO ProblemImages (pid, imageType, location, s3_object_key) VALUES(?, ?, ?, ?)', [pid, fileData.type, result.Location, key], function(err, info){
                        if(err){
                            callback(err);
                        }else{
                            console.log('write file '+fileData.fileName);
                            callback(null);
                        }
                    });
                }
                
                // after call back
            ], function(err, results){
                if(err){
                    console.error(err);
                    onError(err);
                }else{
                    if(i == fileDataArray.length-1){
                        console.log('last image inserted');
                        onSuccess();
                        return;
                    }
                }
            });                            
        })(i);
    }                            
};

function getImageDataSet (data, imageType, pid){
    
    var theImageDataArray = new Array();
    var filePath, fileName, theFileDataSet;
    
    // if data is array
    if(data.length){
        for(var i=0; i<data.length; i++){
            filePath = data[i].path;
            fileName = imageType.substring(0, 2).toUpperCase() + '_' + pid + '_' + i + '_' + randomString.generate(20) + fspath.extname(filePath);
        }                                
    }else{
        filePath = data.path;
        fileName = imageType.substring(0, 2).toUpperCase() + '_' + pid + '_' + randomString.generate(20) + fspath.extname(filePath);
    }
    theFileDataSet = new File(filePath, imageType, fileName);
    theImageDataArray.push(theFileDataSet);
    
    return theImageDataArray;
};

function deleteImageFromS3andDB (data, pid, types, onSuccess, onError) {
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
        function(callback){
            s3.deleteObjects(params, function(err, data){
                if (err) {
                    callback(err);
                } else {
                    console.log(data);           // successful response
                    callback(null);   
                }
            });
        },
        
        // delete images from db
        function(callback){
            var query = 'delete from ProblemImages where (pid = ?)';
            if(types.length == 1){
                query += ' && (imageType = "' + types[0] + '")';   
            }
            client.query(query, [pid], function(err, data){
                if(err){
                    callback(err);
                }else {
                    callback(null);
                }
            });
        }
        
        // after async waterfall 
    ], function(err, results){
        if (err) {
            onError(err);
            console.error(err);
        } else {
            console.log(results);           // successful response 
            onSuccess();
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