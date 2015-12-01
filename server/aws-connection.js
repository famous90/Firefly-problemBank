var AWS = require('aws-sdk');

var awsConnection = {};
awsConnection.AWS = AWS;
// aws
AWS.config.update({
    region: 'ap-northeast-1'
});
awsConnection.s3Bucket = 'problem-bank';

module.exports = awsConnection;