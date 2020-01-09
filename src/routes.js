function clousureEval(_evalCode, _scope) {
    return (function() {
        eval(_evalCode)
    }.apply(_scope))
}

const { getDebugInstance } = require('./utils')

module.exports = (app, options = {}) => {
        var prettyjson = require('prettyjson')
        var debug = getDebugInstance('routes')
        var debugWarn = getDebugInstance('routes', 2)
        var debugError = getDebugInstance('routes', 1)


        if(options.bodyParser!==false){
            const express = require('express')
            app.use(options.bodyParser||express.json(typeof options.bodyParser==='object'?options.bodyParser:{
                limit:"50mb"
            }))
        }
        /*
        options.bodyParser = typeof options.bodyParser === 'undefined' ? true : options.bodyParser
        if(options.bodyParser!==false){
            const bodyParser = require('body-parser')
            const bodyParserOptions = typeof options.bodyParser === 'object' ? options.bodyParser : {
                limit: '10mb'
            }
            app.use(
                bodyParser.json(bodyParserOptions)
            ) 
        }else{
            debugWarn('bodyParser disabled, please implement your own bodyParser middleware to use POST route')
        }*/

        var api = options.api || {}
        

        if (options.attachToExpress) {
            app.api = api || {}
            api = app.api
        }

        if (options.allowGet) {
            if (!options.getMiddlewares) {
                app.get('/funql-api', getGetHandler())
                app.get('/funql-api/:name', getGetHandler())
                app.get('/funql-api/:name/:namespace', getGetHandler())
            } else {
                let args = []
                args.unshift(getGetHandler())
                options.getMiddlewares
                    .reverse()
                    .forEach(middleware => args.unshift(middleware))
                args.unshift('/funql-api')
                app.get.apply(app, args)
            }
        }

        if (!options.postMiddlewares) {
            let args = []
            args.unshift(getPostHandler())
            unshiftCorsMiddleware(args)
            args.unshift('/funql-api')
            app.post.apply(app, args)
            debug('POST available without middlewares under /funql-api')
        } else {
            let args = []
            args.unshift(getPostHandler())
            options.postMiddlewares
                .reverse()
                .forEach(middleware => args.unshift(middleware))
            unshiftCorsMiddleware(args)
            args.unshift('/funql-api')
            app.post.apply(app, args)
            debug(`POST available with ${options.postMiddlewares.length} middlewares under /funql-api`)
        }

        function unshiftCorsMiddleware(args){
            if (options.allowCORS) {
                if (options.allowCORS === true) {
                    args.unshift(require('cors')())
                    app.options('/funql-api', require('cors')())
                    debug(`CORS enabled for *`)
                } else {
                    if (['object', 'string'].includes(typeof options.allowCORS)) {
                        let urls = options.allowCORS
                        urls = typeof urls === 'string' ? [urls] : urls
                        urls = urls.filter(url => !!url && typeof url === 'string')
                        if (urls.length > 0) {
                            args.unshift(getCorsWhitelistMiddleware(urls))
                            app.options('/funql-api', require('cors')())
                            debug(`CORS enabled for `,urls)
                        }
                    }
                }
            }

            function getCorsWhitelistMiddleware(whitelist) {
                var corsOptionsDelegate = function(req, callback) {
                    var corsOptions
                    if (whitelist.indexOf(req.header('Origin')) !== -1) {
                        corsOptions = { origin: true } // reflect (enable) the requested origin in the CORS response
                    } else {
                        corsOptions = { origin: false } // disable CORS for this request
                    }
                    callback(null, corsOptions) // callback expects two parameters: error and options
                }
                return require('cors')(corsOptionsDelegate)
            }
        }

        function getGetHandler() {
            return async function configureFunqlRoute(req, res) {
                res.header('Access-Control-Allow-Origin', req.headers.origin)
                res.header(
                    'Access-Control-Allow-Headers',
                    'Origin, X-Requested-With, Content-Type, Accept'
                )

                let body = req.query.body || ''
                body = body.split('PLUS').join('+')
                let data = {}
                try {
                    data = JSON.parse(require('atob')(body))
                } catch (err) {}
                if (data.transformEncoded) {
                    data.transform = require('atob')(data.transform)
                }
                data.name = req.query.name || data.name || req.params.name
                data.namespace = req.query.ns || req.query.namespace || data.namespace || req.params.namespace
                debug(data.name, 'GET', prettyjson.render(data))
                await executeFunql(data, req, res)
            }
        }

        function getPostHandler() {
            return async function configureFunqlRoute(req, res) {
                if (req.query.multiparty === '1') {
                    var multiparty = require('multiparty')
                    var form = new multiparty.Form()
                    var util = require('util')
                    form.parse(req, async function(err, fields, files) {
                        debug('multiparty', util.inspect({ fields: fields, files: files }))
                        let data = {
                            name: fields._funqlName
                        }
                        if (fields._funqlTransform) {
                            data.transform = fields._funqlTransform
                        }
                        let arg = {}
                        Object.keys(fields)
                            .filter(k => k.indexOf('_') !== 0)
                            .forEach(k => {
                                arg[k] = fields[k][0]
                            })

                        let filesArg = {}
                        Object.keys(files).forEach(k => {
                            filesArg[k] = files[k][0]
                        })

                        data.args = [arg, filesArg]
                        debug(data.name)
                        await executeFunql(data, req, res)
                    })
                } else {
                    let data = req.body

                    if(!req.body && options.bodyParser === false){
                        debugError('POST route requires a bodyParser middleware')
                        return res.status(500).json({err:500})
                    }

                        // debug('POST',prettyjson.render(data))
                    debug(data.name)
                    await executeFunql(data, req, res)
                }
            }
        }

        async function executeFunql(data, req, res) {
            let name = data.name
            let functionScope = {
                req,
                name
            }

            let rootObject = api[name]

            let apiFunction = api[name]

            if (data.namespace) {
                try {

                    if(!api[data.namespace]){
                        debugWarn(`Requested namespace '${data.namespace}' do not exists.`)
                    }

                    rootObject =  api[data.namespace] || {}
                    apiFunction = api[data.namespace][name]
                } catch (err) {}
            }

            if (!apiFunction || typeof apiFunction !== 'function') {
                debugWarn(data.name, `response is INVALID_NAME`)
                res.json({
                    err: 'INVALID_NAME'
                })
            } else {
                try {
                    data.args = !(data.args instanceof Array) ? [data.args] : data.args
                    if (data.args && data.args.length === 1 && data.args[0] === null) {
                        data.args = null
                    }
                    let result = await apiFunction.apply(functionScope, data.args || [])

                    if (data.transform && typeof data.transform === 'string') {
                        var transformHandler = result => {
                                var __handler = {}
                                let clousureScope = Object.assign({
                                        __handler,
                                        args: data.args
                                    },
                                    options.transformScope || {}
                                )
                                let clousureEvalString = `
              ${Object.keys(clousureScope).map(k => `let ${k} = _scope['${k}']`)
    .join(`;
    `) +
                `;
    `}
              this.__handler.fn = ${data.transform}`
            clousureEval(clousureEvalString, clousureScope)
            return __handler.fn(result)
          }

          let transformed = transformHandler(result)

          if (transformed instanceof Promise) {
            result = await transformed
          } else {
            result = transformed
          }

          debug(
            'Transformed',
            data.name,
            result instanceof Array
              ? 'response has ' + result.length + ' items'
              : `response is ${stringify(result)}`,
            result instanceof Array
              ? `First item is ${stringify(result[0])}`
              : undefined
          )
        }
        res.json(result)
      } catch (err) {
        debugError(
          data.name,
          'response with error',
          (err.stack||err).toString().red
        )
        res.status(500).json({err:500})
      }
    }
  }
}

function stringify (object = {}) {
  const { parse, stringify } = require('flatted/cjs')
  return stringify(object)
}