"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const http = require("http");
const https = require("https");
const ws = require("ws");
class Server {
    constructor() {
        this.heartbeatInterval = Server.DEFAULT_HEARTBEAT_INTERVAL;
    }
    initServer(listeningPort, ishttps = false, heartbeatInterval) {
        this.heartbeatInterval = heartbeatInterval | this.heartbeatInterval;
        let server;
        if (ishttps) {
            let options = { cert: fs.readFileSync('cert.pem'), key: fs.readFileSync('key.pem'), requestCert: false, rejectUnauthorized: false };
            if (fs.existsSync('ca.pem')) {
                options.ca = fs.readFileSync('ca.pem');
            }
            server = https.createServer(options);
            server.maxConnections = 20;
            server.maxHeadersCount = 20;
            server.timeout = 5000;
            server.keepAliveTimeout = 5000;
            server.listen(listeningPort, "localhost", 20, () => {
                console.log('listening on %s://localhost:%d', (ishttps ? 'wss' : 'ws'), listeningPort);
            });
        }
        else {
            server = http.createServer();
            server.keepAliveTimeout = 5000;
            server.timeout = 5000;
            server.maxConnections = 20;
            server.maxHeadersCount = 20;
            server.listen(listeningPort, "localhost", 20, () => {
                console.log('listening on %s://localhost:%d', (ishttps ? 'wss' : 'ws'), listeningPort);
            });
        }
        const wss = new ws.Server({ server: server, maxPayload: 50, backlog: 20 });
        this.initHeartbeat(wss);
        wss.on('connection', (websocket, req) => {
            websocket.isAlive = true;
            let address = req.socket.remoteAddress;
            let port = req.socket.remotePort;
            let ip = req.headers['x-forwarded-for'];
            if (ip && ip.length > 0) {
                ip = ip.slice(0, ip.indexOf(','));
                address = ip.slice(0, ip.indexOf(':')).toString();
                port = Number.parseInt(ip.slice(ip.indexOf(':')).toString());
            }
            let timestamp = new Date().toISOString();
            console.log('[%s] [%s:%s] connected', timestamp, address, port);
            websocket.on('open', () => {
                let timestamp = new Date().toISOString();
                console.log('[%s] [%s:%s] opened', timestamp, address, port);
            });
            websocket.on('message', (message) => {
                let timestamp = new Date().toISOString();
                console.log('[%s] [%s:%s] receiving', timestamp, address, port);
                let len = 0;
                let text = '';
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
            websocket.on('close', (code, message) => {
                let timestamp = new Date().toISOString();
                console.log('[%s] [%s:%s] closed %s (%d)', timestamp, address, port, message, code);
            });
            websocket.on('error', (err) => {
                let timestamp = new Date().toISOString();
                console.log('[%s] [%s:%s] error %s: %s: %s', timestamp, address, port, err.name, err.message, err.stack);
            });
            websocket.on('pong', (data) => {
                websocket.isAlive = true;
            });
        });
        wss.on('error', (err) => {
            let timestamp = new Date().toISOString();
            console.log('[%s] error %s: %s: %s', timestamp, err.name, err.message, err.stack);
        });
        return wss;
    }
    initHeartbeat(wsserver) {
        setInterval(() => {
            wsserver.clients.forEach((ws) => {
                var x = ws;
                if (ws.isAlive === false) {
                    let timestamp = new Date().toISOString();
                    console.log('[%s] heartbeat terminate', timestamp);
                    return ws.terminate();
                }
                ;
                ws.isAlive = false;
                ws.ping('', false, true);
                //log(LOGTYPE.DEBUG, 'ping');
            });
        }, this.heartbeatInterval);
    }
}
Server.DEFAULT_HEARTBEAT_INTERVAL = 4000;
Server.DEFAULT_PORT = 8080;
exports.Server = Server;
//# sourceMappingURL=server.js.map