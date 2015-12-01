var mysql = require('mysql');

// local DB for test
var client = mysql.createConnection({
    user: 'root',
    password: 'q1w2e3r4',
    database: 'bank'
});

// AWS RDS
var rdsEndpoint = {
    host: 'problembankdbinstance.cu3kda75wdql.ap-northeast-1.rds.amazonaws.com',
    database: 'problemBankDB',
    user: 'bankAdmin',
    password: 'q1w2e3r4',
    port: 3306
};

//var client = mysql.createConnection({
//    host: rdsEndpoint.host,
//    user: rdsEndpoint.user,
//    password: rdsEndpoint.password,
//    port: rdsEndpoint.port,
//    database: rdsEndpoint.database
//});

module.exports = client;
