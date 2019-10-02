function getDebugInstance(name) {
    return require('debug')(
            `${`funql-api:${name}`.padEnd(15, ' ')} ${`${Date.now()}`.white}`
  )
}

var debug
module.exports = mainScope => {
  debug = getDebugInstance('loader')
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
      .filter(fn => {
        if (typeof fn.handler !== 'function') {
          debug(`${fn.name} failed to load`)
          return false
        }
        return true
      })
      .forEach(fn => {
        let impl = fn.handler(mainScope)
        if (impl instanceof Promise) {
          impl
            .then(handler => onReady(mainScope, fn, handler, options))
            .catch(onError)
        } else {
          onReady(mainScope, fn, impl, options)
        }
      })
  }
}

function onReady (mainScope, fn, impl, options = {}) {
  // console.log('TRACE DEF', options)

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
    debug(fn.name, ' duplicated. Skipping. (overwrite is disabled)')
  } else {
    // debug('API Function file', fn.name, 'loaded')
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
          'Initial',
          fn.name,
          r instanceof Array
            ? 'response has ' + r.length + ' items'
            : `response is ${stringify(r)}`
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
            'Initial',
            fn.name,
            r instanceof Array
              ? 'response has ' + r.length + ' items'
              : `response is ${stringify(r)}`
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

function stringify (object = {}) {
  const { parse, stringify } = require('flatted/cjs')
  return stringify(object)
}