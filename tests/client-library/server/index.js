const express = require('express')
const app = express()

require('../../../index').middleware(app,{
    api:{
        helloWorld(){
            return "HELLO WORLD"
        }
    }
})

app.listen(3000,()=>console.log('LISTEN 3000'))