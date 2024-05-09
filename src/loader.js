const { getDebugInstance } = require('./utils')
const fs = require('fs').promises;
const isDirectory = async path => (await fs.stat(path)).isDirectory()


var debug, debugWarn, debugError
module.exports = mainScope => {
    debug = getDebugInstance('loader')
    debugWarn = getDebugInstance('loader', 2)
    debugError = getDebugInstance('loader', 1)

    return async function loadApiFunctions(options = {}) {
        // The function file will be called with definitionArgs as parameters
        let definitionArgs = [mainScope]
        if (options.params) {
            options.params.reverse().forEach(p => definitionArgs.unshift(p))
        }

        var path = require('path')
        // let readdirPath = path.join(process.cwd(), options.path)
        let readdirPath = options.path
        var sander = require('sander')

        if (!(await isDirectory(readdirPath))) {
            debugError(
                'Failed to load api functions from',
                readdirPath
            )
            return
        }

        let files = await sander.readdir(readdirPath)

        /*
        console.log('READIR',{
            readdirPath,
            files
        })*/

        files = files
            .filter(f => f !== 'index.js')
            .filter(f => {
                return f.indexOf('.js') !== -1
            })

        var self = {}

        // debug(`Reading ${files.length} api funtions from ${options.path}`)

        for (const f of files) {
            let requirePath = path.join(options.path, f)

            mainScope.apiInfo = mainScope.apiInfo || {}
            let name = f.split('.js').join('')
            mainScope.apiInfo[name] =
                mainScope.apiInfo[name] || {}

            mainScope.apiInfo[name].path = requirePath

            mainScope.apiInfo[name].namespace = options.namespace || ""

            var requireFromString = require('require-from-string');
            //self[f.split('.')[0]] = require(requirePath)
            const requirePathStr = await fs.readFile(requirePath, 'utf8');
            self[f.split('.')[0]] = requireFromString(requirePathStr);


        }
        let count = 0
        Object.keys(self)
            .map((k, index) => {
                var mod = self[k]
                return {
                    name: k,
                    handler: mod.handler ? mod.handler : mod
                }
            })
            .filter(fn => {
                if (typeof fn.handler !== 'function') {
                    debugError(`${fn.name} failed to load`)
                    return false
                }
                return true
            })
            .forEach(fn => {
                let impl = fn.handler.apply(fn, definitionArgs)
                if (impl instanceof Promise) {
                    impl
                        .then(handler => {
                            onReady(mainScope, fn, handler, options)
                            count++
                        })
                        .catch(err => {
                            debugError(
                                `${fn.name} failed to load implementation with`,
                                err.stack || err
                            )
                        })
                } else {
                    onReady(mainScope, fn, impl, options)
                    count++
                }
            })

        let ns = options.namespace ? ` into namespace '${options.namespace}'` : ''

        const readdirShortPath = readdirPath
            .split(__dirname)
            .join('')
            .split(process.cwd())
            .join('')
        debug(
            `${count} functions loaded from ${readdirShortPath
                .split(process.cwd())
                .join('')}${ns}`
        )
    }
}

function onReady(mainScope, fn, impl, options = {}) {
    // console.log('TRACE DEF', options)

    if (typeof impl !== 'function') {
        debugWarn(
            fn.name.yellow,
            'has an invalid implementation (check funql-api docs)'.red
        )
    }

    mainScope.api = mainScope.api || {}

    functionParent = mainScope.api

    if (options.namespace) {
        functionParent[options.namespace] = functionParent[options.namespace] || {}
        functionParent = functionParent[options.namespace]
    }

    let allowOverwrite = false

    if (options.allowOverwrite === true) {
        allowOverwrite = true
    }

    if (!allowOverwrite && typeof functionParent[fn.name] !== 'undefined') {
        debugWarn(fn.name, ' duplicated. Skipping. (overwrite is disabled)')
    } else {

        //debug('API Function file', fn.handler.toString(), 'loaded')
        //debug('API Function file', fn.name, 'loaded')

        functionParent[fn.name] = function () {
            let optionsScope = {}
            if (typeof options.scope === 'function') {
                optionsScope = options.scope(this) || {}
            }
            if (typeof options.scope === 'object') {
                optionsScope = options.scope
            }
            var mergedScope = Object.assign({}, this, optionsScope)

            let r = null // final result

            let middlewareArgs = [mainScope]
            if (options.params) {
                options.params.reverse().forEach(p => middlewareArgs.unshift(p))
            }

            // middlwares
            if (options.middlewares) {
                let args = arguments
                let middlewareScope = Object.assign({},mergedScope,{
                    params:args
                })
                return new Promise(async (resolve, reject) => {
                    try {

                        for (let middleware of options.middlewares) {
                            let res = middleware.apply(middlewareScope, middlewareArgs)
                            if(res instanceof Promise){
                                res = await res
                            }
                            if (!!res && !!res.err) {
                                return resolvePromise(resolve, res)
                            }
                        }

                        let finalResult = callApiFunction(args)
                        if (finalResult instanceof Promise) {
                            finalResult = await finalResult
                        }
                        resolve(finalResult)

                    } catch (err) {
                        rejectPromise(reject, err)
                    }
                })
            }

            return callApiFunction(arguments)

            async function resolvePromise(resolve, r) {
                r = await r
                r = r === undefined ? {} : r
                const debugFn = r.err ? debugWarn : debug
                debugFn(
                    fn.name,
                    r instanceof Array ?
                        'response has ' + r.length + ' items' :
                        `response is ${stringify(r)}`,
                    r instanceof Array ? `First item is ${stringify(r[0])}` : ''
                )
                resolve(r)
            }

            function rejectPromise(reject, err) {
                reject(err)
            }

            function callApiFunction(args) {
                if (r === null) {
                    r = impl.apply(mergedScope || {}, args)
                }
                if (r instanceof Promise) {
                    return new Promise(async (resolve, reject) => {
                        try {
                            await resolvePromise(resolve, r)
                        } catch (err) {
                            rejectPromise(reject, err)
                        }
                    })
                } else {
                    debug(
                        fn.name,
                        r instanceof Array ?
                            'response has ' + r.length + ' items' :
                            `response is ${stringify(r)}`,
                        r instanceof Array ? `First item is ${stringify(r[0])}` : ''
                    )
                    return r
                }
            }
        }
    }
}

function stringify(object = {}) {
    const { parse, stringify } = require('flatted/cjs')
    return stringify(object)
}