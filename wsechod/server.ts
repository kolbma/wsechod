import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as ws from 'ws';

export class Server {
  static readonly DEFAULT_HEARTBEAT_INTERVAL = 4000;
  static readonly DEFAULT_PORT = 8080;

  private heartbeatInterval: number = Server.DEFAULT_HEARTBEAT_INTERVAL;

  // constructor() { }

  initServer(listeningPort: number, ishttps: boolean = false, heartbeatInterval?: number): ws.Server {
    this.heartbeatInterval = heartbeatInterval || this.heartbeatInterval;

    let server: http.Server | https.Server;
    if (ishttps) {
      const options = { cert: fs.readFileSync('cert.pem'), key: fs.readFileSync('key.pem'), requestCert: false, rejectUnauthorized: false };
      if (fs.existsSync('ca.pem')) {
        (options as any).ca = fs.readFileSync('ca.pem');
      }
      server = https.createServer(options);
      server.maxConnections = 20;
      (server as any).maxHeadersCount = 20;
      (server as any).timeout = 5000;
      (server as any).keepAliveTimeout = 5000;
      server.listen(listeningPort, 'localhost', 20, () => {
        console.log('listening on %s://localhost:%d', (ishttps ? 'wss' : 'ws'), listeningPort);
      });
    } else {
      server = http.createServer();
      server.keepAliveTimeout = 5000;
      server.timeout = 5000;
      server.maxConnections = 20;
      server.maxHeadersCount = 20;
      server.listen(listeningPort, 'localhost', 20, () => {
        console.log('listening on %s://localhost:%d', (ishttps ? 'wss' : 'ws'), listeningPort);
      });
    }

    const wss = new ws.Server({ server, maxPayload: 50, backlog: 20 });

    this.initHeartbeat(wss);

    wss.on('connection', (websocket: ws, req: http.IncomingMessage) => {
      (websocket as any).isAlive = true;
      let address = req.socket.remoteAddress;
      let port = req.socket.remotePort;
      let ip = req.headers['x-forwarded-for'];
      if (ip && ip.length > 0) {
        ip = ip.slice(0, ip.indexOf(','));
        address = ip.slice(0, ip.indexOf(':')).toString();
        port = Number.parseInt(ip.slice(ip.indexOf(':')).toString(), 10);
      }
      console.log('[%s] [%s:%s] connected', new Date().toISOString(), address, port);

      websocket.on('open', () => {
        const timestamp = new Date().toISOString();
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
        } else {
          len = (message as ArrayBuffer).byteLength;
          text = 'bytes';
        }
        timestamp = new Date().toISOString();
        console.log('[%s] [%s:%s] received %d %s', timestamp, address, port, len, text);
        websocket.send(message);
        timestamp = new Date().toISOString();
        console.log('[%s] [%s:%s] sent %d %s', timestamp, address, port, len, text);
      });

      websocket.on('close', (code, message) => {
        const timestamp = new Date().toISOString();
        console.log('[%s] [%s:%s] closed %s (%d)', timestamp, address, port, message, code);
      });

      websocket.on('error', (err) => {
        const timestamp = new Date().toISOString();
        console.log('[%s] [%s:%s] error %s: %s: %s', timestamp, address, port, err.name, err.message, err.stack);
      });

      websocket.on('pong', (data) => {
        (websocket as any).isAlive = true;
      });
    });

    wss.on('error', (err) => {
      const timestamp = new Date().toISOString();
      console.log('[%s] error %s: %s: %s', timestamp, err.name, err.message, err.stack);
    });

    return wss;
  }

  private initHeartbeat(wsserver: ws.Server) {
    setInterval(() => {
      wsserver.clients.forEach((wss) => {
        if ((wss as any).isAlive === false) {
          const timestamp = new Date().toISOString();
          console.log('[%s] heartbeat terminate', timestamp);
          return wss.terminate();
        }
        (wss as any).isAlive = false;
        wss.ping('', false, (err: Error) => {
          const timestamp = new Date().toISOString();
          console.log('[%s] error %s: %s: %s', timestamp, err.name, err.message, err.stack);
        });
        // log(LOGTYPE.DEBUG, 'ping');
      });
    }, this.heartbeatInterval);
  }
}
