export default async function funql(name, args = [], options = {}) {
    if (!name) {
        throw new Error('NAME_REQUIRED')
    }

    options.transform = !!options.transform && typeof options.transform !== 'string' ?
        options.transform.toString() :
        options.transform

    const debug = getDebugInstance(`funql`, 4)
    const endpoint = process.env.VUE_APP_FUNQL_ENDPOINT
    const url = `${endpoint}/funql-api`
    const request = {
        ...options,
        name: name,
        args: args,
        namespace: process.env.VUE_APP_FUNQL_NAMESPACE || options.namespace || options.ns
    }
    const elapsed = calculateElapsed()
    const rawResponse = await fetch(`${url}?n=${name}&ns=${request.namespace}`, {
        method: 'POST',
        mode: 'cors',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
    })
    const response = await rawResponse.json()
    debug(name, elapsed(), {
        request,
        response
    })
    if (response.err) {
        response.err =
            typeof response.err === 'object' ?
            JSON.stringify(response.err) :
            response.err
        throw new Error(response.err)
    } else {
        return response
    }
}

export function calculateElapsed() {
    var startDate = new Date()
    return function() {
        var endDate = new Date()
        var seconds = (endDate.getTime() - startDate.getTime()) / 1000
        return seconds + 's'
    }
}

export function getDebugInstance(name, level = 4) {
    let levelLabel = {
        1: 'ERROR',
        2: 'WARN',
        3: 'INFO',
        4: 'DEBUG'
    }

    let debugEnv = parseInt(process.env.VUE_APP_DEBUG) || 'funql*'
    localStorage.debug = (localStorage.debug || '') + `,${debugEnv}`

    let _level = parseInt(process.env.VUE_APP_DEBUG_LEVEL) || 4

    if (level > _level) {
        return () => {}
    } else {
        return require('debug')(
                `${`funql:${name}`.padEnd(15, ' ')} ${levelLabel[level].padEnd(
        7,
        ' '
      )} ${`${Date.now()}`}`
    )
  }
}