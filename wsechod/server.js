"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var http = require("http");
var https = require("https");
var ws = require("ws");
var Server = /** @class */ (function () {
    function Server() {
        this.heartbeatInterval = Server.DEFAULT_HEARTBEAT_INTERVAL;
    }
    // constructor() { }
    Server.prototype.initServer = function (listeningPort, ishttps, heartbeatInterval) {
        if (ishttps === void 0) { ishttps = false; }
        this.heartbeatInterval = heartbeatInterval || this.heartbeatInterval;
        var server;
        if (ishttps) {
            var options = { cert: fs.readFileSync('cert.pem'), key: fs.readFileSync('key.pem'), requestCert: false, rejectUnauthorized: false };
            if (fs.existsSync('ca.pem')) {
                options.ca = fs.readFileSync('ca.pem');
            }
            server = https.createServer(options);
            server.maxConnections = 20;
            server.maxHeadersCount = 20;
            server.timeout = 5000;
            server.keepAliveTimeout = 5000;
            server.listen(listeningPort, 'localhost', 20, function () {
                console.log('listening on %s://localhost:%d', (ishttps ? 'wss' : 'ws'), listeningPort);
            });
        }
        else {
            server = http.createServer();
            server.keepAliveTimeout = 5000;
            server.timeout = 5000;
            server.maxConnections = 20;
            server.maxHeadersCount = 20;
            server.listen(listeningPort, 'localhost', 20, function () {
                console.log('listening on %s://localhost:%d', (ishttps ? 'wss' : 'ws'), listeningPort);
            });
        }
        var wss = new ws.Server({ server: server, maxPayload: 50, backlog: 20 });
        this.initHeartbeat(wss);
        wss.on('connection', function (websocket, req) {
            websocket.isAlive = true;
            var address = req.socket.remoteAddress;
            var port = req.socket.remotePort;
            var ip = req.headers['x-forwarded-for'];
            if (ip && ip.length > 0) {
                ip = ip.slice(0, ip.indexOf(','));
                address = ip.slice(0, ip.indexOf(':')).toString();
                port = Number.parseInt(ip.slice(ip.indexOf(':')).toString(), 10);
            }
            console.log('[%s] [%s:%s] connected', new Date().toISOString(), address, port);
            websocket.on('open', function () {
                var timestamp = new Date().toISOString();
                console.log('[%s] [%s:%s] opened', timestamp, address, port);
            });
            websocket.on('message', function (message) {
                var timestamp = new Date().toISOString();
                console.log('[%s] [%s:%s] receiving', timestamp, address, port);
                var len = 0;
                var text = '';
                if (typeof message === 'string') {
                    len = message.length;
                    text = 'chars string';
                }
                else {
                    len = message.byteLength;
                    text = 'bytes';
                }
                timestamp = new Date().toISOString();
                console.log('[%s] [%s:%s] received %d %s', timestamp, address, port, len, text);
                websocket.send(message);
                timestamp = new Date().toISOString();
                console.log('[%s] [%s:%s] sent %d %s', timestamp, address, port, len, text);
            });
            websocket.on('close', function (code, message) {
                var timestamp = new Date().toISOString();
                console.log('[%s] [%s:%s] closed %s (%d)', timestamp, address, port, message, code);
            });
            websocket.on('error', function (err) {
                var timestamp = new Date().toISOString();
                console.log('[%s] [%s:%s] error %s: %s: %s', timestamp, address, port, err.name, err.message, err.stack);
            });
            websocket.on('pong', function (data) {
                websocket.isAlive = true;
            });
        });
        wss.on('error', function (err) {
            var timestamp = new Date().toISOString();
            console.log('[%s] error %s: %s: %s', timestamp, err.name, err.message, err.stack);
        });
        return wss;
    };
    Server.prototype.initHeartbeat = function (wsserver) {
        setInterval(function () {
            wsserver.clients.forEach(function (wss) {
                if (wss.isAlive === false) {
                    var timestamp = new Date().toISOString();
                    console.log('[%s] heartbeat terminate', timestamp);
                    return wss.terminate();
                }
                wss.isAlive = false;
                wss.ping('', false, function (err) {
                    var timestamp = new Date().toISOString();
                    console.log('[%s] error %s: %s: %s', timestamp, err.name, err.message, err.stack);
                });
                // log(LOGTYPE.DEBUG, 'ping');
            });
        }, this.heartbeatInterval);
    };
    Server.DEFAULT_HEARTBEAT_INTERVAL = 4000;
    Server.DEFAULT_PORT = 8080;
    return Server;
}());
exports.Server = Server;
//# sourceMappingURL=server.js.map