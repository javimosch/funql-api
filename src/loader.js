function getDebugInstance(name) {
    return require('debug')(
            `${`funql:${name}`.padEnd(15, ' ')} ${`${Date.now()}`.white}`
  )
}

var debug
module.exports = mainScope => {
  debug = getDebugInstance('loader')
  return async function loadApiFunctions (options = {}) {
    // The function file will be called with definitionArgs as parameters
    let definitionArgs = [mainScope]
    if (options.params) {
      options.params.reverse().forEach(p => definitionArgs.unshift(p))
    }

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
          debug(`${fn.name} failed to load`)
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
            .catch(onError)
        } else {
          onReady(mainScope, fn, impl, options)
          count++
        }
      })

    let ns = options.namespace ? ` into namespace ${options.namespace}` : ''

    debug(
      `${count} functions loaded from ${readdirPath
        .split(process.cwd())
        .join('')}${ns}`
    )
  }
}

function onReady (mainScope, fn, impl, options = {}) {
  // console.log('TRACE DEF', options)

  if (typeof impl !== 'function') {
    debug(
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

      let middlewareArgs = [mainScope]
      if (options.params) {
        options.params.reverse().forEach(p => middlewareArgs.unshift(p))
      }

      // middlwares
      if (options.middlewares) {
        let args = arguments
        return new Promise(async (resolve, reject) => {
          try {
            let res = await Promise.all(
              options.middlewares.map(m => m.apply(mergedScope, middlewareArgs))
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
          fn.name,
          r instanceof Array
            ? 'response has ' + r.length + ' items'
            : `response is ${stringify(r)}`,
          r instanceof Array ? `First item is ${stringify(r[0])}` : undefined
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
            fn.name,
            r instanceof Array
              ? 'response has ' + r.length + ' items'
              : `response is ${stringify(r)}`,
            r instanceof Array ? `First item is ${stringify(r[0])}` : undefined
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