# funql-api

Build your next function based api today.

## Features

- **Load functions from FileSystem**
- **Transform responses in the server side**
- **Namespaces**

## Server configuration

````js
const server = express()

//Normal usage: call the middleware
funql.middleware(server, {
    getMiddlewares:[],//default,
    postMiddlewares:[],//
    allowGet:false, //default
    allowOverwrite:false, //default,
    attachToExpress:false,//default
    api: {
        //functions can be a promise (optional)
        async helloWorld(name) {
            return `Hello ${name}`
        },
        //this is a namespace
        backoffice:{
            getUsers(){
                return ['Juan']
            }
        }
    }
})

//Feature: Load functions form folders
await funqlApi.loadFunctionsFromFolder({
    path: require('path').join(process.cwd(),'functions')
})

//Feature: Overwrite when loading functions
await funqlApi.loadFunctionsFromFolder({
    allowOverwrite:true,
    path: require('path').join(process.cwd(),'functions')
})

//Feature: Load functions into a namespace
await funqlApi.loadFunctionsFromFolder({
    namespace:'backoffice',
    path: require('path').join(process.cwd(),'functions')
})

//Feature: Attach functions to express object
funql.middleware(app,{
    attachToExpress:true
})
//Functions will be accessible by the express object:
//app.api.helloWorld
//app.api.backoffice.getUsers


//Feature: adding an express middleware to get
funql.middleware(app,{
    allowGet:true,
    getMiddlewares: [
        function(req, res, next) {
            //Here, you can implement your auth system
            res.json('YOU_CANT_GET_ME')
        }
    ]
})


//More features? Just ask ;) !
````

## Client configuration

````js

//Normal Usage: Just a post request
axios.post(`SERVER_URL/funql-api`, {
    name: 'helloWorld',
    args:['Juan']
})
.then(res => {
    //res.data equal to 'Hello Juan'
})

//Feature: namespaces
axios.post(`SERVER_URL/funql-api`, {
    namespace:'backoffice',
    name: 'getUsers'
})
.then(res => {
    //res.data equal to ['Juan']
})

//Feature: transform in the server-side
axios.post(`SERVER_URL/funql-api`, {
    namespace:'backoffice',
    name: 'getUsers',
    transform: function(response) {
        return response.map(r=>r.toLowerCase())
    }.toString()
})
.then(res => {
    //res.data equal to ['juan']
})

//Feature: allowGet:true
body = require('btoa')(JSON.stringify({
    name: 'foo'
}))
axios.get(`SERVER_URL/funql-api?body=${body}`, {
    name: 'helloWorld',
    args:['Juan']
})
.then(res => {
    //res.data equal to 'Hello Juan'
})



//More features? Just ask ;) !
````

## Roadmap

- 2019 Q2: Initial release
- 2019 Q3: Load functions from folder
- 2019 Q4: Client side dynamic api library
