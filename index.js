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
    async middleware(app, options = {}) {
        if (options.admin) {
            await this.loadFunctionsFromFolder({
                params: [app, options, scope],
                namespace: '__funql',
                path: require('path').join(__dirname, `src/admin`)
            })
            const { getDebugInstance } = require('./src/utils')
            const debugInfo = getDebugInstance('index', 3)
            debugInfo(`Admin exposed to /__funql`)
            app.use(
                `/__funql`,
                require('express').static(require('path').join(__dirname, 'admin/dist'))
            )
        }

        options.api = options.api || {}
        options.api = {
            ...scope.api,
            ...options.api
        }

        require('./src/routes')(app, options)
    }
}