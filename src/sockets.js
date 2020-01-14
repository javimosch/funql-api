const { getDebugInstance, calculateElapsed, stringify } = require('./utils')

module.exports = {
    onSocketConnected(socket, api, scope) {

        const debug = getDebugInstance('sockets')

        socket.on("executeFunction", async function(params) {
            const elapsed = calculateElapsed()

            const ns = params.ns || params.namespace

            let rootScope = api

            if (!!ns) {
                function moveRootScope(ns) {
                    let parts = ns.split('.')
                    try {
                        rootScope = rootScope[parts[0]]
                    } catch (err) {
                        throw new Error('INVALID_NAMESPACE')
                    }
                    parts.shift()
                    if (parts.length == 0) {
                        return
                    } else {
                        moveRootScope(parts.join('.'))
                    }
                }
                moveRootScope(ns)
            }

            debug(params.name, 'params', params)


            let r = await rootScope[params.name].apply(this, params.args || []);


            debug(
                params.name,
                `took ${elapsed()}`,
                r instanceof Array ?
                'response has ' + r.length + ' items' :
                `response is ${stringify(r)}`,
                r instanceof Array ? `First item is ${stringify(r[0])}` : ''
            )

            socket.emit(`fn_${params.id}`, r);
        });
    }
};