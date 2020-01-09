module.exports = {
    prepareServer(configureCallback, readyCallback, options = {}) {
        process.env.DEBUG = 'funql*'
        const funqlApi = require('../index')
        const axios = require('axios')
        const getPort = require('get-port')

        prepareServer(configureCallback, readyCallback)

        async function prepareServer(configureCallback, readyCallback) {
            const express = require('express')
            const server = express()
            
            funqlApi.reset()

            let p = configureCallback(server, funqlApi)
            if (p instanceof Promise) {
                await p
            }

            let port = await getPort()
            let endpoint = `http://localhost:${port}`
            var serverInstance = server.listen(port, () =>
                readyCallback({ endpoint, serverInstance, axios, app: server })
            )
        }
    }
}