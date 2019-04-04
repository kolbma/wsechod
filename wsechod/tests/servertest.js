"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require("assert");
var ws = require("ws");
var server_1 = require("../server");
describe('Test Suite Server', function () {
    var s;
    var ss;
    var clients;
    before(function (done) {
        console.log('setup');
        s = new server_1.Server().initServer(8080, false);
        ss = new server_1.Server().initServer(8443, true);
        clients = new Array();
        clients.push(new ws('ws://localhost:8080', {}));
        clients.push(new ws('wss://localhost:8443', { rejectUnauthorized: false }));
        done();
    });
    after(function (done) {
        for (var _i = 0, clients_1 = clients; _i < clients_1.length; _i++) {
            var client = clients_1[_i];
            client.close(1000);
        }
        setTimeout(function () {
            s.close();
            ss.close();
            done();
        }, 500);
    });
    it('Test echo', function (done) {
        var c = 0;
        try {
            clients.forEach(function (client, i, array) {
                client.on('open', function () {
                    client.on('error', function (err) {
                        console.error(err);
                        assert.fail(err.message);
                        done(err);
                    });
                    client.on('close', function (code, message) {
                        // console.log(code + ': ' + message);
                        if (code !== 1000) {
                            assert.ok(code === 1000);
                            done(new Error('closed'));
                        }
                    });
                    client.on('ping', function (data) { client.pong(); });
                    client.on('message', function (message) {
                        if (message === 'hello world') {
                            c++;
                            console.log('message ok');
                            if (c === clients.length) {
                                assert.ok('finished');
                                done();
                            }
                        }
                        else {
                            console.log('message wrong');
                            assert.notStrictEqual(message, 'hello world');
                            done(new Error('message not expected: ' + message));
                        }
                    });
                    client.send('hello world', function (err) {
                        if (err) {
                            console.error(err);
                            assert.fail(err.message);
                            done(err);
                        }
                        console.log('sent');
                    });
                });
            });
        }
        catch (err) {
            console.error(err);
        }
    }).timeout(5000);
});
//# sourceMappingURL=servertest.js.map