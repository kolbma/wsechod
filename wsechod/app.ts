import * as yargs from 'yargs';
import { Server } from './server';

let listeningPort = Server.DEFAULT_PORT;
let heartbeatInterval = Server.DEFAULT_HEARTBEAT_INTERVAL;

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

let argv: any = yargsObj.argv;

if (argv.port && argv.port > 1024) {
    listeningPort = argv.port;
}
if (argv.heartbeat && argv.heartbeat > 0) {
    heartbeatInterval = argv.heartbeat;
}


new Server().initServer(listeningPort, false, heartbeatInterval);
new Server().initServer(listeningPort + 1, true, heartbeatInterval);
