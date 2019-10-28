module.exports = app =>
    async function getScopeKeyValue(keyName) {
        return app[keyName]
    }