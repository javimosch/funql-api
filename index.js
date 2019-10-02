require('colors')

let scope = {}

module.exports = {
    reset() {
        scope = {}
    },
    async loadFunctionsFromFolder(options = {}) {
        let fn = require('./src/loader')(scope)
        await fn(options)
    },
    middleware(app, options = {}) {
        options.api = options.api || {}
        options.api = {
            ...scope.api,
            ...options.api
        }
        require('./src/routes')(app, options)
    }
}