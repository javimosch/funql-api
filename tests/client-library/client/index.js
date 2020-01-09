import funql from './client.js'
import debug from 'debug'
import 'isomorphic-fetch';

const fql = funql('http://localhost:3000',{
    debug
})

fql('helloWorld').then(console.log)