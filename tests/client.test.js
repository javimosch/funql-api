const prepareServer = require('./common').prepareServer

test('Returning the api method name', done => {
    prepareServer(configure, ready)

    function configure(server, funqlApi) {
        funqlApi.middleware(server, {
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
                console.log(res.data)
                expect(res.data).toBe('foo')
                serverInstance.close()
                done()
            })
    }
})