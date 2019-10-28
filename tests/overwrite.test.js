const prepareServer = require('./common').prepareServer
const functionsFolderPath = 'examples/common/functions_folder_one'
const functionsFolderPathAlternative = 'examples/common/functions_folder_two'
test('Forbid overwrite function loaded from folder', done => {
    prepareServer(configure, ready)

    async function configure(server, funqlApi) {
        await funqlApi.loadFunctionsFromFolder({
            path: require('path').join(process.cwd(), functionsFolderPath)
        })
        await funqlApi.loadFunctionsFromFolder({
            path: require('path').join(process.cwd(), functionsFolderPathAlternative)
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
            path: require('path').join(process.cwd(), functionsFolderPath)
        })
        await funqlApi.loadFunctionsFromFolder({
            path: require('path').join(process.cwd(), functionsFolderPathAlternative),
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