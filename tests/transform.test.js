const prepareServer = require('./common').prepareServer
test('Transforming the response', done => {
    prepareServer(configure, ready)

    function configure(server, funql) {
        funql.middleware(server, {
            api: {
                async bar() {
                    return this.name
                }
            }
        })
    }

    function ready({ endpoint, serverInstance, axios }) {
        axios
            .post(`${endpoint}/funql-api`, {
                name: 'bar',
                transform: function(originalResponse) {
                    return 'BAR'
                }.toString()
            })
            .then(res => {
                expect(res.data).toBe('BAR')
                serverInstance.close()
                done()
            })
    }
})

test('Reading a custom scope inside the transform function', done => {
    prepareServer(configure, ready)

    function configure(server, funql) {
        funql.middleware(server, {
            api: {
                async bar() {
                    return Date.now()
                }
            },
            transformScope: {
                moment: require('moment')
            }
        })
    }

    function ready({ endpoint, serverInstance, axios }) {
        axios
            .post(`${endpoint}/funql-api`, {
                name: 'bar',
                transform: function(originalResponse) {
                    return moment(originalResponse).format('DD-MM-YYYY')
                }.toString()
            })
            .then(res => {
                expect(res.data).toBe(require('moment')().format('DD-MM-YYYY'))
                serverInstance.close()
                done()
            })
    }
})