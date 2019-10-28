module.exports = app =>
    function helloWorld(name) {
        return `Hello ${name || 'stranger'}!`
    }