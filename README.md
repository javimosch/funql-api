# funql-api

Run your favorite server function directly from the browser.

## Server configuration

````js
const server = express()
funql.middleware(server, {
    api: {
        async helloWorld(name) {
            return `Hello ${name}`
        }
    }
})
````

## Client configuration

````js
axios.post(`SERVER_URL/funql-api`, {
    name: 'Misitioba'
})
.then(res => {
    expect(res.data)
    .toBe('Hello Misitioba')
})
````

## Roadmap

- 2019 Q3: Initial release
- 2019 Q4: Client side dynamic api library
- 2019 Q4: Load functions from folder
- 2020 Q1: Who knows
