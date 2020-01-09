# funql-api

Build your next function based api today.

This library allow you to build a function based API.
Interact with the server-side with functions and promises.

## Features

- **Load functions from FileSystem**
- **Transform responses in the server side**
- **Namespaces**
- **Client-side library**

## Server configuration

````js
const app = express()
//Normal usage: call the middleware
funql.middleware(app, {
    /*defaults*/
    getMiddlewares:[],
    postMiddlewares:[],
    allowGet:false,
    allowOverwrite:false,
    attachToExpress:false,
    allowCORS: false,
    bodyParser:true, //required for POST
    api: {
        async helloWorld(name) {
            return `Hello ${name}`
        },
        backoffice:{
            getUsers(){
                return ['Juan','Paco']
            }
        }
    }
})
````


### Load functions from folder

#### Basic usage

```js
await funqlApi.loadFunctionsFromFolder({
    path: require('path').join(process.cwd(),'functions')
})
```

#### Custom middlewares

These middlewares will act only on the functions loaded from this path. These are not express middlewares!

```js
await funqlApi.loadFunctionsFromFolder({
    namespace:'admin',
    path: require('path').join(process.cwd(),'functions')
    middlewares:[async function(){
//All the functions in namespace admin will invoke this middleware before running the function. If we return {err:'something'} The function will not be called and the client will receive a 200 status with the response. Useful for controlled exceptions.

return this.user.role!=='admin'?
({err:401}):true

    }]
})
```

#### Overwrite existing functions in the same path

If the function already exists, it will be overwritted.

```js
await funqlApi.loadFunctionsFromFolder({
    allowOverwrite:true,
    path: require('path').join(process.cwd(),'functions')
})
```

#### Load functions into namespace

```js
await funqlApi.loadFunctionsFromFolder({
    namespace:'backoffice',
    path: require('path').join(process.cwd(),'functions')
})
```

### Express object binding

```js
funql.middleware(app,{
    attachToExpress:true,
    api:{
        helloWorld(){
            return "Hello W"
        }
    }
})
console.log(app.api.helloWorld())
//Hello W
```


### HTTP GET

Optionally, allow GET calls to interact with your functions.

```js
funql.middleware(app,{
    allowGet:true
})
```

#### GET Middlewares

```js
funql.middleware(app,{
    allowGet:true,
    getMiddlewares: [
        function(req, res, next) {
res.status(401).send('You are not allowed to request using GET!')
        }
    ]
})
```


### CORS

#### Allow all

```js
funql.middleware(app,{
    allowCORS:true
})
```

#### Customize allowed origins

```js
funql.middleware(app,{
    allowCORS:['client1.domain.com','client2.domain.com']
})
```

### Body parser

#### Disable body parser

In case you want to implement your own body parser.

```js
app.use(require('body-parser').json())
funql.middleware(app,{
    bodyParser:false
})
```

#### Built-in body parser options

Give options to default express body parser.

```js
funql.middleware(app,{
    bodyParser: {
        limit: '50mb'
    }
})
```

## Client configuration

### Basic Usage (Client)

```js
axios.post(`SERVER_URL/funql-api`, {
    name: 'helloWorld',
    args:['Juan']
})
.then(res => {
    //Hello Juan
})
/*
server-side
function helloWorld(name){
    return `Hello ${name}`
}
*/
```

### Feature: Namespaces

Namespaces help you to organize you a bit.
You can use it for versioning!

```js
axios.post(`SERVER_URL/funql-api`, {
    namespace:'api.v1.users',
    name: 'changePassword'
})
```

### Feature: Transform the response in the server side

```js
axios.post(`SERVER_URL/funql-api`, {
    namespace:'backoffice',
    name: 'helloWorld',
    args:['Juan']
    transform: function(response) {
        return response.toLowerCase()
    }.toString()
})
.then(res => {
    //juan
})
```

### Feature: Use HTTP GET

```js
let body = require('btoa')(JSON.stringify({
    name: 'foo'
}))
axios.get(`SERVER_URL/funql-api?body=${body}`, {
    name: 'helloWorld',
    args:['Juan']
})
.then(res => {
    //res.data equal to 'Hello Juan'
})
/*
server-side
function helloWorld(name){
    return `Hello ${name}`
}
*/
```


### Feature: Client library

Use your functions directly. Let's abstracts the xhr operations

```html
<script type="module">
    
import funql from 'https://cdn.jsdelivr.net/npm/funql-api@1.2.6/client.js'
    
const fql = funql('http://localhost:3000')
fql('helloWorld','Juan').then(console.info)
//Hello Juan

</script>
```

## Tests

- Requires Node >= 13.5
- Requires PORT 3000 available
- npm run test

## Roadmap

- 2020 Q1: Client side dynamic api library
- 2019 Q2: Admin GUI

