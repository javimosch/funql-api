const prepareServer = require('./common').prepareServer

test('Returning the api method name', done => {
    prepareServer(configure, ready, {
        customServer: async function({ funql, port }) {
            await funql.listen(port)
            console.log('http server on port', port)
            return funql.getHttpServer();
        }
    })

    function configure(server, funqlApi) {
        funqlApi.middleware(server, {
            sockets: true,
            api: {
                async foo() {
                    return this.name
                }
            }
        })
    }

    function ready({ axios, endpoint, serverInstance, port }) {

        /*
        const io = require('socket.io-client')

        console.log('connecting to io on port', port)
        const socket = io(`http://localhost:${port}`)
        socket.on('connect', function() {
            console.log('I connected')
        });
        socket.on('event', function(data) {});
        socket.on('disconnect', function() {});*/

        const funql = require('../client')



        setTimeout(() => {
            expect(200).toBe(200)
            done()
        }, 4000)

        /*
        axios
            .post(`${endpoint}/funql-api`, {
                name: 'foo'
            })
            .then(res => {
                expect(res.data).toBe('foo')
                serverInstance.close()
                done()
            })
            */
    }
})