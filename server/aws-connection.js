var AWS = require('aws-sdk');

var awsConnection = {};
awsConnection.AWS = AWS;
// aws
AWS.config.update({
    accessKeyId: "AKIAJ5M4777I2ENGEWHA",
    secretAccessKey: "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",
    region: 'ap-northeast-1'
});

awsConnection.s3Bucket = 'problem-bank';
// aws for local test
//AWS.config.update({
//    accessKeyId: "AKIAIEXRFJXTWX4IQXNA",
//    secretAccessKey: "PcVXrBmESiTyjr/D2ZjAZ9U5rPEE90aXK+Nw3Tf0",
//    region: 'ap-northeast-1'
//});
//var s3Bucket = 'example-photo-90.image';

module.exports = awsConnection;