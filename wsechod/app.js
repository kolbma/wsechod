"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yargs = require("yargs");
const server_1 = require("./server");
let listeningPort = server_1.Server.DEFAULT_PORT;
let heartbeatInterval = server_1.Server.DEFAULT_HEARTBEAT_INTERVAL;
let year = new Date().getFullYear();
let yargsObj = yargs
    .version('1.0.0')
    .usage('Usage: $0 [options]')
    .describe('port', 'Specify the listening port')
    .number('port')
    .nargs('port', 1)
    .describe('heartbeat', 'Specify milliseconds for client heartbeat')
    .number('heartbeat')
    .nargs('heartbeat', 1)
    .help('h')
    .alias('h', 'help')
    .epilog('Copyright ' + year + ' by Markus Kolb');
let argv = yargsObj.argv;
if (argv.port && argv.port > 1024) {
    listeningPort = argv.port;
}
if (argv.heartbeat && argv.heartbeat > 0) {
    heartbeatInterval = argv.heartbeat;
}
new server_1.Server().initServer(listeningPort, false, heartbeatInterval);
new server_1.Server().initServer(listeningPort + 1, true, heartbeatInterval);
//# sourceMappingURL=app.js.map