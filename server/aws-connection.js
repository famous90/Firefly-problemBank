var AWS = require('aws-sdk');
var Passport = require('./passport');

var awsConnection = {};
awsConnection.AWS = AWS;
// aws
AWS.config.update({
    accessKeyId: Passport.awsTicket.accessKeyId,
    secretAccessKey: Passport.awsTicket.secretAccessKey,
    region: 'ap-northeast-1'
});
awsConnection.s3Bucket = 'problem-bank';

module.exports = awsConnection;