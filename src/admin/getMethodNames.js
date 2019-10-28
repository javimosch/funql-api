module.exports = (app, middlewareOptions, funqlScope) =>
    async function getMethodNames() {
        return Object.keys(app.api).filter(key => {
            return typeof app.api[key] === 'function' && !!funqlScope.apiInfo[key]
        })
    }