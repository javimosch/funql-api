import funql from '../../index.js'
import express from 'express'
const app = express()

const path = process.cwd()+`/examples/client/browser/cdn`;

funql.middleware(app,{
    allowCORS:true,
    api:{
        helloWorld(){
            return "HELLO WORLD"
        }
    }
})

app.listen(3000,()=>console.log('LISTEN 3000'));
