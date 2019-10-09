function clousureEval(_evalCode, _scope) {
    return (function() {
        eval(_evalCode)
    }.apply(_scope))
}

function getDebugInstance(name) {
    return require('debug')(
            `${`funql:${name}`.padEnd(15, ' ')} ${`${Date.now()}`.white}`
  )
}

module.exports = (app, options = {}) => {
  var debug = getDebugInstance('routes')

  var api = options.api || {}

  if (options.attachToExpress) {
    app.api = api || {}
    api = app.api
  }

  if (options.allowGet) {
    if (!options.getMiddlewares) {
      app.get('/funql-api', getGetHandler())
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
    app.post('/funql-api', getPostHandler())
    debug('Post loaded without middlewares')
  } else {
    let args = []
    args.unshift(getPostHandler())
    options.postMiddlewares
      .reverse()
      .forEach(middleware => args.unshift(middleware))

    if (options.allowCORS) {
      if (options.allowCORS === true) {
        args.unshift(require('cors')())
        app.options('/funql-api', require('cors')())
      } else {
        if (['object', 'string'].includes(typeof options.allowCORS)) {
          let urls = options.allowCORS
          urls = typeof urls === 'string' ? [urls] : urls
          urls = urls.filter(url => !!url && typeof url === 'string')
          if (urls.length > 0) {
            args.unshift(getCorsWhitelistMiddleware(urls))
            app.options('/funql-api', require('cors')())
          }
        }
      }
    }

    function getCorsWhitelistMiddleware (whitelist) {
      var corsOptionsDelegate = function (req, callback) {
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

    args.unshift('/funql-api')
    app.post.apply(app, args)
    // debug('Post loaded with ', options.postMiddlewares.length, 'middlewares')
  }

  function getGetHandler () {
    return async function configureFunqlRoute (req, res) {
      res.header('Access-Control-Allow-Origin', req.headers.origin)
      res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept'
      )

      let body = req.query.body
      body = body.split('PLUS').join('+')
      let data = JSON.parse(require('atob')(body))
      if (data.transformEncoded) {
        data.transform = require('atob')(data.transform)
      }
      await executeFunql(data, req, res)
    }
  }

  function getPostHandler () {
    return async function configureFunqlRoute (req, res) {
      if (req.query.multiparty === '1') {
        var multiparty = require('multiparty')
        var form = new multiparty.Form()
        var util = require('util')
        form.parse(req, async function (err, fields, files) {
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
          await executeFunql(data, req, res)
        })
      } else {
        let data = req.body
        await executeFunql(data, req, res)
      }
    }
  }

  async function executeFunql (data, req, res) {
    let name = data.name
    let functionScope = {
      req,
      name
    }

    let apiFunction = api[name]

    if (data.namespace) {
      try {
        apiFunction = api[data.namespace][name]
      } catch (err) {}
    }

    if (!apiFunction || typeof apiFunction !== 'function') {
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
            let clousureScope = Object.assign(
              {
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
              : `response is ${stringify(result)}`
          )
        }
        res.json(result)
      } catch (err) {
        console.error(data, (err.stack || err || `Empty error`).toString().red)
        res.json({
          err: '500'
        })
      }
    }
  }
}

function stringify (object = {}) {
  const { parse, stringify } = require('flatted/cjs')
  return stringify(object)
}