"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const ws = require("ws");
const server_1 = require("../server");
describe('Test Suite Server', () => {
    let s;
    let ss;
    let clients;
    setup(() => {
        console.log('setup');
        s = new server_1.Server().initServer(8080, false);
        ss = new server_1.Server().initServer(8443, true);
        clients = new Array();
        clients.push(new ws('ws://localhost:8080', {}));
        clients.push(new ws('wss://localhost:8443', { rejectUnauthorized: false }));
    });
    teardown(() => {
        console.log('teardown');
        s.close();
        ss.close();
    });
    before((done) => {
        console.log('before');
        done();
    });
    after((done) => {
        let c = 0;
        clients.forEach((client, i, array) => {
            console.log('after');
            client.close(1000);
            c++;
            if (c === clients.length) {
                console.log('after');
                done();
            }
        });
    });
    it('Test echo', (done) => {
        let c = 0;
        try {
            clients.forEach((client, i, array) => {
                client.on('open', () => {
                    client.on('error', (err) => {
                        console.error(err);
                        assert.fail(err.message);
                        done(err);
                    });
                    client.on('close', (code, message) => {
                        console.log(code + ': ' + message);
                        assert.ok(code === 1000);
                        done(new Error('closed'));
                    });
                    client.on('ping', (data) => { client.pong(); });
                    client.on('message', (message) => {
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
                    client.send('hello world', (err) => {
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