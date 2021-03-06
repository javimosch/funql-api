require("colors");

let scope = {};

module.exports = {
    reset() {
        scope = {};
    },
    async loadFunctionsFromFolder(options = {}) {
        let fn = require("./src/loader")(scope);
        await fn(options);
    },
    async middleware(app, options = {}) {
        scope.app = app;

        options.api = options.api || {};
        options.api = {
            ...scope.api,
            ...options.api
        };

        if (!!options.sockets) {
            const http = configureHttpServer(scope);
            const io = (scope.io = require("socket.io")(http));

            const sockets = require("./src/sockets");
            io.on("connection", function(socket) {
                sockets.onSocketConnected(socket, options.api, scope);

                socket.on("disconnect", function() {
                    //console.log('user disconnected');
                });
            });
        }

        if (options.admin) {
            await this.loadFunctionsFromFolder({
                params: [app, options, scope],
                namespace: "__funql",
                path: require("path").join(__dirname, `src/admin`)
            });
            const { getDebugInstance } = require("./src/utils");
            const debugInfo = getDebugInstance("index", 3);
            debugInfo(`Admin exposed to /__funql`);
            app.use(
                `/__funql`,
                require("express").static(require("path").join(__dirname, "admin/dist"))
            );
        }

        require("./src/routes")(app, options);

        const { getDebugInstance } = require("./src/utils");
        const debugError = getDebugInstance("index", 1);
        app.use(function(err, req, res, next) {
            debugError('ERROR MIDDLEWARE', err)
            next()
        })

    },
    listen(port, callback) {
        configureHttpServer(scope);
        if (!scope.httpServer) {
            throw new Error("listen called before middleware");
        }
        return new Promise((resolve, reject) => {
            return scope.httpServer.listen(port, function() {
                callback && callback.apply(this, arguments);
                resolve();
            });
        });
    },
    getHttpServer() {
        return scope.httpServer;
    }
};

function configureHttpServer(scope) {
    if (!scope.httpServer && !!scope.app) {
        scope.httpServer = require("http").createServer(scope.app);
    }
    return scope.httpServer;
}