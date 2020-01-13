const prepareServer = require("./common").prepareServer;

test("Returning the api method name", done => {
  prepareServer(configure, ready, {
    customServer: async function({ funql, port }) {
      await funql.listen(port);
      console.log("http server on port", port);
      return funql.getHttpServer();
    }
  });

  function configure(server, funqlApi) {
    funqlApi.middleware(server, {
      sockets: true,
      api: {
        async helloWorld() {
          return "HELLO WORLD";
        }
      }
    });
  }

  function ready({ axios, endpoint, serverInstance, port }) {
    const funql = require("../client.cjs");

    const fql = funql.createClient(`http://localhost:${port}`, {
      connectionMode: "sockets"
    });

    fql("helloWorld").then(response => {
      expect(response).toBe("HELLO WORLD");
      serverInstance.close();
      done();
    });
  }
});
