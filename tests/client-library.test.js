const prepareServer = require("./common").prepareServer;

test("Running helloWorld using the client library", done => {
  const execa = require("execa");

  (async () => {
    const srv = execa.command(`node tests/client-library/server`);
    srv.stderr.on("data", data => {
      console.log("ERROR", data.toString().trim());
      srv.kill(1);
      expect("SERVER_ERRORED").toBe("SERVER_LISTENING");
      done();
    });
    srv.stdout.on("data", data => {
      if (
        data
          .toString()
          .trim()
          .indexOf("LISTEN") != -1
      ) {
        callServer();
      }
    });

    async function callServer() {
      const child = execa(`sh`, ["tests/client-library/client/run.sh"]);

      async function killChilds() {
        child.kill("SIGTERM", {
          forceKillAfterTimeout: 1000
        });
        srv.kill("SIGTERM", {
          forceKillAfterTimeout: 1000
        });
        await execa.command(`rm tests/client-library/client/client.js`);

        setTimeout(() => {
          done();
          //process.exit(0)
        }, 2000);
      }

      let success = false;

      child.stdout.on("data", data => {
        console.log("RECEIVED", data.toString().trim());

        if (data.toString().trim() === "HELLO WORLD") {
          success = true;
          expect(data.toString().trim()).toBe("HELLO WORLD");
          killChilds();
        }
      });

      setTimeout(() => {
        if (success) return;
        expect("TIMEOUT").toBe("HELLO WORLD");
        killChilds();
      }, 8000);
    }
  })();
});
