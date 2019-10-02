const prepareServer = require('./common').prepareServer

test('Adding a simple post middleware', done => {
    prepareServer(configure, ready)

    function configure(server, funqlApi) {
        funqlApi.middleware(server, {
            postMiddlewares: [
                function(req, res, next) {
                    res.json('THIS_ROUTE_COULD_BE_PROTECTED')
                }
            ],
            api: {
                async foo() {
                    return this.name
                }
            }
        })
    }

    function ready({ axios, endpoint, serverInstance }) {
        axios
            .post(`${endpoint}/funql-api`, {
                name: 'foo'
            })
            .then(res => {
                expect(res.data).toBe('THIS_ROUTE_COULD_BE_PROTECTED')
                serverInstance.close()
                done()
            })
    }
})

test('Adding a simple get middleware', done => {
    prepareServer(configure, ready)

    function configure(server, funqlApi) {
        funqlApi.middleware(server, {
            allowGet: true,
            getMiddlewares: [
                function(req, res, next) {
                    res.json('YOU_CANT_GET_ME')
                }
            ],
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
            expect(res.data).toBe('YOU_CANT_GET_ME')
            serverInstance.close()
            done()
        })
    }
})