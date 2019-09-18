var debug = require('debug')(`funql-api:loader ${`${Date.now()}`.white}`)
module.exports = app => {
  return async function loadApiFunctions (options = {}) {
    // options.path

    var path = require('path')
    // let readdirPath = path.join(process.cwd(), options.path)
    let readdirPath = options.path
    var sander = require('sander')
    let files = await sander.readdir(readdirPath)
    files = files
      .filter(f => f !== 'index.js')
      .filter(f => {
        return f.indexOf('.js') !== -1
      })

    var self = {}

    // debug(`Reading ${files.length} api funtions from ${options.path}`)

    files.forEach(f => {
      let requirePath = path.join(options.path, f)
      self[f.split('.')[0]] = require(requirePath)
    })
    Object.keys(self)
      .map((k, index) => {
        var mod = self[k]
        return {
          name: k,
          handler: mod.handler ? mod.handler : mod
        }
      })
      .forEach(fn => {
        let impl = fn.handler(app)
        if (impl instanceof Promise) {
          impl
            .then(handler => onReady(app, fn, handler, options))
            .catch(onError)
        } else {
          onReady(app, fn, impl, options)
        }
      })
  }
}

function onReady (app, fn, impl, options = {}) {
  // console.log('TRACE DEF', options)

  app.api = app.api || []
  if (typeof app.api[fn.name] !== 'undefined') {
    debug('API Function file', fn.name, 'exists. Skipping...')
  } else {
    // debug('API Function file', fn.name, 'loaded')
    app.api[fn.name] = function () {
      let optionsScope = {}
      if (typeof options.scope === 'function') {
        optionsScope = options.scope(this) || {}
      }
      if (typeof options.scope === 'object') {
        optionsScope = options.scope
      }
      var mergedScope = Object.assign({}, this, optionsScope)

      let r = null // final result

      // middlwares
      if (options.middlewares) {
        let args = arguments
        return new Promise(async (resolve, reject) => {
          try {
            let res = await Promise.all(
              options.middlewares.map(m => m.apply(mergedScope, [app]))
            )
            if (res.find(r => !!r && !!r.err)) {
              r = res.find(r => !!r.err)
              resolvePromise(resolve, r)
            } else {
              let finalResult = callApiFunction(args)
              if (finalResult instanceof Promise) {
                finalResult = await finalResult
              }
              resolve(finalResult)
            }
          } catch (err) {
            rejectPromise(reject, err)
          }
        })
      }

      return callApiFunction(arguments)

      async function resolvePromise (resolve, r) {
        r = await r
        debug(
          'api call',
          fn.name,
          r instanceof Array
            ? 'Responded with ' + r.length + ' items'
            : `Responded with object ${printKeys(r)}`
        )
        resolve(r)
      }

      function rejectPromise (reject, err) {
        debug('api call', fn.name, `Responded with error`, `${err.stack}`.red)
        reject(err)
      }

      function callApiFunction (args) {
        if (r === null) {
          r = impl.apply(mergedScope || {}, args)
        }
        if (r instanceof Promise) {
          return new Promise(async (resolve, reject) => {
            try {
              resolvePromise(resolve, r)
            } catch (err) {
              rejectPromise(reject, err)
            }
          })
        } else {
          debug(
            'api call',
            fn.name,
            r instanceof Array
              ? 'Responded with ' + r.length + ' items'
              : `Responded with object ${printKeys(r)}`
          )
          return r
        }
      }
    }
  }
}

function onError (err) {
  console.error('ERROR (Function)', err.stack || err)
  process.exit(1)
}

function printKeys (object = {}) {
  if (!object) {
    return object
  }
  let keys = Object.keys(object)
  if (keys.length > 10) {
    let count = keys.length
    keys = keys.filter((k, index) => index < 10)
    return `{${keys.join(', ')}... (${count} more)}`
  } else {
    return `{${keys.join(', ')}}`
  }
}