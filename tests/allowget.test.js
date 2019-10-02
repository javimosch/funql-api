const prepareServer = require('./common').prepareServer

test('Allow get is enabled', done => {
    prepareServer(configure, ready)

    function configure(server, funqlApi) {
        funqlApi.middleware(server, {
            allowGet: true,
            api: {
                async foo() {
                    return this.name
                }
            }
        })
    }

    function ready({ axios, endpoint, serverInstance }) {
        let body = {
            name: 'foo'
        }
        body = require('btoa')(JSON.stringify(body))

        axios.get(`${endpoint}/funql-api?body=${body}`).then(res => {
            expect(res.data).toBe('foo')
            serverInstance.close()
            done()
        })
    }
})

test('Allow get is disabled', done => {
    prepareServer(configure, ready)

    function configure(server, funqlApi) {
        funqlApi.middleware(server, {
            allowGet: false,
            api: {
                async foo() {
                    return this.name
                }
            }
        })
    }

    function ready({ axios, endpoint, serverInstance }) {
        let body = {
            name: 'foo'
        }
        body = require('btoa')(JSON.stringify(body))
        axios.get(`${endpoint}/funql-api?body=${body}`).catch(err => {
            expect(err.response.status).toBe(404)
            serverInstance.close()
            done()
        })
    }
})