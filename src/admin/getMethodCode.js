module.exports = (app, middlewareOptions, mainScope) => {
    function methodExists(name) {
        return !!Object.keys(app.api).find(key => {
            if (typeof app.api[key] === 'function') {
                return key === name
            } else {
                return !!Object.keys(app.api[key]).find(subkey => {
                    return subkey === name
                })
            }
        })
    }

    return async function getMethodCode(name) {
        if (!name) {
            return {
                err: 'NAME_REQUIRED'
            }
        }
        const sander = require('sander')

        let filePath = ''
        try {
            filePath = mainScope.apiInfo[name].path
        } catch (err) {}

        const exists = !!filePath && (await sander.exists(filePath))
        if (exists) {
            return (await sander.readFile(filePath)).toString('utf-8')
        } else {
            if (methodExists(name)) {
                return {
                    err: 'MEMORY_METHOD'
                }
            } else {
                return {
                    err: 'MISTMACH'
                }
            }
        }
    }
}