import funql from '../../../../index.js'
import express from 'express'
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express()
app.use('/', express.static(__dirname))

funql.middleware(app,{
    allowCORS:true,
    api:{
        helloWorld(){
            return ['HELLO','WORLD']
        }
    }
})

app.listen(3000,()=>console.log('http://localhost:3000'));
