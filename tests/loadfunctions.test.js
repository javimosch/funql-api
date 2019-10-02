const prepareServer = require('./common').prepareServer

test('Call a function loaded from fs', done => {
    prepareServer(configure, ready)

    async function configure(server, funqlApi) {
        await funqlApi.loadFunctionsFromFolder({
            path: require('path').join(process.cwd(), 'example-functions')
        })
        funqlApi.middleware(server, {
            api: {}
        })
    }

    function ready({ axios, endpoint, serverInstance }) {
        axios
            .post(`${endpoint}/funql-api`, {
                name: 'helloWorld',
                args: ['Luis']
            })
            .then(res => {
                expect(res.data).toBe('Hello Luis')
                serverInstance.close()
                done()
            })
    }
})

test('Functions loaded from fs are replaced by functions passed by param', done => {
    prepareServer(configure, ready)

    async function configure(server, funqlApi) {
        await funqlApi.loadFunctionsFromFolder({
            path: require('path').join(process.cwd(), 'example-functions')
        })
        funqlApi.middleware(server, {
            api: {
                helloWorld() {
                    return 'Hello Param'
                }
            }
        })
    }

    function ready({ axios, endpoint, serverInstance }) {
        axios
            .post(`${endpoint}/funql-api`, {
                name: 'helloWorld',
                args: ['Luis']
            })
            .then(res => {
                expect(res.data).toBe('Hello Param')
                serverInstance.close()
                done()
            })
    }
})

test('Call a function loaded into a namespace', done => {
    prepareServer(configure, ready)

    async function configure(server, funqlApi) {
        await funqlApi.loadFunctionsFromFolder({
            namespace: 'loadedFromFolder',
            path: require('path').join(process.cwd(), 'example-functions')
        })
        funqlApi.middleware(server, {
            api: {
                helloWorld() {
                    return 'Hello Param'
                }
            }
        })
    }

    function ready({ axios, endpoint, serverInstance }) {
        axios
            .post(`${endpoint}/funql-api`, {
                name: 'helloWorld',
                args: ['Foo'],
                namespace: 'loadedFromFolder'
            })
            .then(res => {
                expect(res.data).toBe('Hello Foo')
                serverInstance.close()
                done()
            })
    }
})

test('Transform a function loaded from folder', done => {
    prepareServer(configure, ready)

    async function configure(server, funqlApi) {
        await funqlApi.loadFunctionsFromFolder({
            path: require('path').join(process.cwd(), 'example-functions')
        })
        funqlApi.middleware(server, {})
    }

    function ready({ axios, endpoint, serverInstance }) {
        axios
            .post(`${endpoint}/funql-api`, {
                name: 'helloWorld',
                args: ['Foo'],
                transform: function(originalResponse) {
                    return originalResponse + 'Bar'
                }.toString()
            })
            .then(res => {
                expect(res.data).toBe('Hello FooBar')
                serverInstance.close()
                done()
            })
    }
})

test('Call a function loaded from fs with loader middlewares', done => {
    prepareServer(configure, ready)

    async function configure(server, funqlApi) {
        await funqlApi.loadFunctionsFromFolder({
            path: require('path').join(process.cwd(), 'example-functions'),
            middlewares: [
                async function() {
                    // this.name
                    // this.user
                    // this.req
                    // this.res
                    return {
                        err: 'UPS'
                    }
                }
            ]
        })
        funqlApi.middleware(server, {
            api: {}
        })
    }

    function ready({ axios, endpoint, serverInstance }) {
        axios
            .post(`${endpoint}/funql-api`, {
                name: 'helloWorld',
                args: ['Luis']
            })
            .then(res => {
                expect(res.data.err).toBe('UPS')
                serverInstance.close()
                done()
            })
    }
})

test('Call a function loaded from fs with custom params', done => {
    prepareServer(configure, ready)

    async function configure(server, funqlApi) {
        server.foo = 'FOO'
        await funqlApi.loadFunctionsFromFolder({
            params: [server],
            path: require('path').join(process.cwd(), 'example-functions'),
            middlewares: [
                app => {
                    if (!app.foo) return { err: 500 }
                }
            ]
        })
        funqlApi.middleware(server, {
            api: {}
        })
    }

    function ready({ axios, endpoint, serverInstance }) {
        axios
            .post(`${endpoint}/funql-api`, {
                name: 'getScopeKeyValue',
                args: ['foo']
            })
            .then(res => {
                expect(res.data).toBe('FOO')
                serverInstance.close()
                done()
            })
    }
})