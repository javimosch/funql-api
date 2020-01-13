module.exports = {
    prepareServer(configureCallback, readyCallback, options = {}) {
        process.env.DEBUG = 'funql*'
        const funql = require('../index')
        const axios = require('axios')
        const getPort = require('get-port')

        prepareServer(configureCallback, readyCallback)

        async function prepareServer(configureCallback, readyCallback) {
            const express = require('express')
            const server = express()

            funql.reset()

            let p = configureCallback(server, funql)
            if (p instanceof Promise) {
                await p
            }

            let port = await getPort()
            let endpoint = `http://localhost:${port}`

            if (options.customServer) {
                options.customServer({ endpoint, axios, app: server, funql, port }).then(serverInstance => {
                    readyCallback({ endpoint, serverInstance, axios, app: server, port })
                })
            } else {
                var serverInstance = server.listen(port, () =>
                    readyCallback({ endpoint, serverInstance, axios, app: server, port })
                )
            }


        }
    }
}