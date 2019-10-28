;
(async() => {
    const express = require('express')
    const app = express()

    const funql = require('../../index')
    await funql.loadFunctionsFromFolder({
        path: require('path').join(__dirname, 'methods')
    })

    await funql.middleware(app, {
        allowGet: true,
        attachToExpress: true,
        allowCORS: true,
        admin: {
            path: '/__funql'
        },
        api: {
            async foo() {
                return this.name
            }
        }
    })

    const PORT = 3000
    app.listen(PORT, () => {
        console.log('READY AT', PORT)
    })
})()