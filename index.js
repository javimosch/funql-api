require('colors')

module.exports = {
    middleware(app, options = {}) {
        require('./src/routes')(app, options)
    }
}