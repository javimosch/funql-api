module.exports = {
    prepareServer(configureCallback, readyCallback) {
        process.env.DEBUG = 'funql*'
        const funqlApi = require('../index')
        const axios = require('axios')
        const getPort = require('get-port')

        prepareServer(configureCallback, readyCallback)

        async function prepareServer(configureCallback, readyCallback) {
            const express = require('express')
            const server = express()
            const bodyParser = require('body-parser')
            server.use(
                bodyParser.json({
                    limit: '50mb'
                })
            )
            configureCallback(server, funqlApi)
            let port = await getPort()
            let endpoint = `http://localhost:${port}`
            var serverInstance = server.listen(port, () =>
                readyCallback({ endpoint, serverInstance, axios })
            )
        }
    }
}