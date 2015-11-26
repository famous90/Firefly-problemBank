// extract modules
var express = require('express');
var http = require('http');
var os = require('os');
var fs = require('fs');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.json());
app.use(express.static(__dirname+'/public'));

//app.use(require('./server'));
// router
app.use(require('./server/api/category'));
app.use(require('./server/api/problem'));
app.use(require('./server/api/login'));
app.use(require('./server/api/image'));
app.use(require('./server/api/user'));


// home page
app.get(['/', '/index.html'], function(req, res){
    fs.readFile('./public/index.html', function(err, data){
        res.contentType('text/html');
        res.send(data);
    });
});



// check server running
http.createServer(app).listen(process.env.PORT || 3000, function(req, res){
    
    var ifaces = os.networkInterfaces();

    Object.keys(ifaces).forEach(function (ifname) {
        var alias = 0;

        ifaces[ifname].forEach(function (iface) {
            if ('IPv4' !== iface.family || iface.internal !== false) {
                  // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                return;
            }

            if (alias >= 1) {
                // this single interface has multiple ipv4 addresses
                console.log(ifname + ':' + alias, iface.address);
            } else {
                // this interface has only one ipv4 adress
                console.log(ifname, iface.address);
            }
        });
    });
    console.log('Server running');
});