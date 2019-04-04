"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var yargs = require("yargs");
var server_1 = require("./server");
var listeningPort = server_1.Server.DEFAULT_PORT;
var heartbeatInterval = server_1.Server.DEFAULT_HEARTBEAT_INTERVAL;
var year = new Date().getFullYear();
var yargsObj = yargs
    .version('1.0.1')
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
var argv = yargsObj.argv;
if (argv.port && argv.port > 1024) {
    listeningPort = argv.port;
}
if (argv.heartbeat && argv.heartbeat > 0) {
    heartbeatInterval = argv.heartbeat;
}
new server_1.Server().initServer(listeningPort, false, heartbeatInterval);
new server_1.Server().initServer(listeningPort + 1, true, heartbeatInterval);
//# sourceMappingURL=app.js.map