const prepareServer = require("./common").prepareServer;

const fqlOptions = {
    connectionMode: "sockets"
}

function prepareTest(ready) {
    prepareServer(configure, ready, {
        customServer: async function({ funql, port }) {
            await funql.listen(port);
            return funql.getHttpServer();
        }
    });

    async function configure(server, funqlApi) {
        await funqlApi.middleware(server, {
            sockets: true,
            api: {
                async helloWorld() {
                    return "HELLO WORLD";
                },
                async giveMeThoseArguments(a, b, c, d) {
                    return [a, b, c, d];
                },
                "v1.helloWorldV1": function() {
                    return "HELLO V1"
                },
                v2: {
                    helloV2() {
                        return 'helloV2'
                    }
                },
                v3: {
                    clients: {
                        getAll() {
                            return ['FOO', 'BAR']
                        }
                    }
                }
            }
        });
    }
}

test("Can call a simple function", done => {
    prepareTest(async function({ axios, endpoint, serverInstance, port }) {
        const funql = require("../client.cjs");
        const fql = funql.createClient(`http://localhost:${port}`, fqlOptions);
        let response = await fql("helloWorld")
        expect(response).toBe("HELLO WORLD");
        serverInstance.close();
        setTimeout(() => done(), 2000)
    })
});



test("Can call a function with arguments", done => {
    prepareTest(function({ axios, endpoint, serverInstance, port }) {
        const funql = require("../client.cjs");
        const fql = funql.createClient(`http://localhost:${port}`, fqlOptions);
        fql("giveMeThoseArguments", [1, 2, 3, 4]).then(response => {
            expect(response).toStrictEqual([1, 2, 3, 4]);
            serverInstance.close();
            setTimeout(() => done(), 2000)
        }).catch(console.error)
    })
});

test("Can call a function with  path namespace", done => {
    prepareTest(function({ axios, endpoint, serverInstance, port }) {
        const funql = require("../client.cjs");
        const fql = funql.createClient(`http://localhost:${port}`, fqlOptions);
        fql("v1.helloWorldV1").then(response => {
            expect(response).toBe(`HELLO V1`);
            serverInstance.close();
            setTimeout(() => done(), 2000)
        }).catch(console.error)
    })
});

test("Can call a function with real namespace", done => {
    prepareTest(function({ axios, endpoint, serverInstance, port }) {
        const funql = require("../client.cjs");
        const fql = funql.createClient(`http://localhost:${port}`, fqlOptions);
        fql("helloV2", [], {
            ns: "v2"
        }).then(response => {
            expect(response).toBe(`helloV2`);
            serverInstance.close();
            setTimeout(() => done(), 2000)
        }).catch(console.error)
    })
});

test("Can call a function with real namespace (deep)", done => {
    prepareTest(function({ axios, endpoint, serverInstance, port }) {
        const funql = require("../client.cjs");
        const fql = funql.createClient(`http://localhost:${port}`, fqlOptions);
        fql("getAll", [], {
            ns: "v3.clients"
        }).then(response => {
            expect(response).toStrictEqual([`FOO`, `BAR`]);
            serverInstance.close();
            setTimeout(() => done(), 2000)
        }).catch(console.error)
    })
});