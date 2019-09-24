function clousureEval(_evalCode, _scope) {
    return (function() {
        eval(_evalCode)
    }.apply(_scope))
}

module.exports = (app, options = {}) => {
        var api = options.api || {}

        var debug = require('debug')(`funql-api:routes ${`${Date.now()}`.white}`)
  app.get('/funql-api', async function configureFunqlRoute (req, res) {
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
  })

  app.post('/funql-api', async function configureFunqlRoute (req, res) {
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
      debug(`DATA`, req.body)
      let data = req.body
      await executeFunql(data, req, res)
    }
  })

  async function executeFunql (data, req, res) {
    let name = data.name
    let functionScope = {
      req,
      name
    }

    if (!api[name]) {
      res.json({
        err: 'INVALID_NAME'
      })
    } else {
      try {
        if (data.args && data.args.length === 1 && data.args[0] === null) {
          data.args = null
        }
        let result = await api[name].apply(functionScope, data.args || [])

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
            console.log('EVALUATING', clousureEvalString)
            clousureEval(clousureEvalString, clousureScope)
            return __handler.fn(result)
          }

          let transformed = transformHandler(result)

          if (transformed instanceof Promise) {
            result = await transformed
          } else {
            result = transformed
          }
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