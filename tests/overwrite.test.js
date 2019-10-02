const prepareServer = require('./common').prepareServer

test('Forbid overwrite function loaded from folder', done => {
    prepareServer(configure, ready)

    async function configure(server, funqlApi) {
        await funqlApi.loadFunctionsFromFolder({
            path: require('path').join(process.cwd(), 'example-functions')
        })
        await funqlApi.loadFunctionsFromFolder({
            path: require('path').join(process.cwd(), 'example-functions-two')
        })
        funqlApi.middleware(server, {})
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

test('Allow overwrite function loaded from folder', done => {
    prepareServer(configure, ready)

    async function configure(server, funqlApi) {
        await funqlApi.loadFunctionsFromFolder({
            path: require('path').join(process.cwd(), 'example-functions')
        })
        await funqlApi.loadFunctionsFromFolder({
            path: require('path').join(process.cwd(), 'example-functions-two'),
            allowOverwrite: true
        })
        funqlApi.middleware(server, {})
    }

    function ready({ axios, endpoint, serverInstance }) {
        axios
            .post(`${endpoint}/funql-api`, {
                name: 'helloWorld',
                args: ['Luis']
            })
            .then(res => {
                expect(res.data).toBe('Hello Two')
                serverInstance.close()
                done()
            })
    }
})