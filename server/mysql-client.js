var mysql = require('mysql');
var Passport = require('./passport');

// local DB for test
//var client = mysql.createConnection({
//    user: 'root',
//    password: 'q1w2e3r4',
//    database: 'bank'
//});

// AWS RDS
var rdsEndpoint = Passport.rdsTicket;

var client = mysql.createConnection({
    host: rdsEndpoint.host,
    user: rdsEndpoint.user,
    password: rdsEndpoint.password,
    port: rdsEndpoint.port,
    database: rdsEndpoint.database
});

module.exports = client;
