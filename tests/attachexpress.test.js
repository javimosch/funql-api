const prepareServer = require('./common').prepareServer

test('Attach functions to express is enabled', done => {
    prepareServer(configure, ready)

    function configure(server, funqlApi) {
        funqlApi.middleware(server, {
            attachToExpress: true,
            api: {
                async foo() {
                    return this.name
                }
            }
        })
    }

    function ready({ axios, endpoint, serverInstance, app }) {
        expect(typeof app.api.foo).toBe('function')
        serverInstance.close()
        done()
    }
})

test('Attach functions to express is disabled', done => {
    prepareServer(configure, ready)

    function configure(server, funqlApi) {
        funqlApi.middleware(server, {
            // attachToExpress: false,
            api: {
                async foo() {
                    return this.name
                }
            }
        })
    }

    function ready({ axios, endpoint, serverInstance, app }) {
        expect(typeof app.api).toBe('undefined')
        serverInstance.close()
        done()
    }
})