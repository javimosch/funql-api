const prepareServer = require('./common').prepareServer

test('Calling a function under a namespace', done => {
    prepareServer(configure, ready)

    function configure(server, funqlApi) {
        funqlApi.middleware(server, {
            api: {
                async foo() {
                    return this.name
                },
                backend: {
                    bar() {
                        return 'BAR'
                    }
                }
            }
        })
    }

    function ready({ axios, endpoint, serverInstance }) {
        axios
            .post(`${endpoint}/funql-api`, {
                name: 'bar',
                namespace: 'backend'
            })
            .then(res => {
                expect(res.data).toBe('BAR')
                serverInstance.close()
                done()
            })
    }
})

test('Calling an invalid function under a namespace', done => {
    prepareServer(configure, ready)

    function configure(server, funqlApi) {
        funqlApi.middleware(server, {
            api: {
                async foo() {
                    return this.name
                },
                backend: {
                    bar() {
                        return 'BAR'
                    }
                }
            }
        })
    }

    function ready({ axios, endpoint, serverInstance }) {
        axios
            .post(`${endpoint}/funql-api`, {
                name: 'bar',
                namespace: 'this_namspace_doesnt_exists'
            })
            .then(res => {
                expect(res.data.err).toBe('INVALID_NAME')
                serverInstance.close()
                done()
            })
    }
})