var http = require('http');
var request = require('request');
var db = require('./db');
var pull = require('./pull/pull');

http.createServer(function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/plain'
    });
}).listen(3000);

setInterval(pull.getIssue, 5000)
