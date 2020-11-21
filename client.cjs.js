"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createClient = createClient;

/* eslint-disable */
exports.default = createClient;

function createClient(url, globalOptions = {}) {
  if (typeof process === "undefined" && typeof window !== "undefined") {
    window.process = {
      env: {}
    };
  }

  var client = async function fql(name, args, options = {}) {
    if (!name) {
      throw new Error("NAME_REQUIRED");
    }

    options.endpoint = globalOptions.endpoint = url;

    if (globalOptions.connectionMode === "sockets") {
      return executeBySocket.apply(this, [name, args, options, globalOptions]);
    }

    return await executeByHttp.apply(this, [name, args, options, globalOptions]);
  };

  return client;
}

function getSocket(scope = {}) {
  const debug = getDebugInstance(`getSocket`, 4, scope);
  debug('GET SOCKET??');
  return new Promise((resolve, reject) => {
    if (scope.socket && scope.socket.isActive === true) {
      return scope.socket;
    } else {
      if (scope._isRetrievingSocket == true) {
        let start = Date.now();

        function checkSocketAvailable() {
          if (scope.socket && scope.socket.isActive === true) {
            resolve(scope.socket);
          } else {
            if (Date.now() - start > 1000 * 10) {
              return reject("SOCKET_INIT_TIMEOUT");
            }

            setTimeout(() => checkSocketAvailable(), 20);
          }
        }
      } else {
        scope._isRetrievingSocket = true;

        const io = scope.io = scope.io || require("socket.io-client");

        const socket = scope.socket && scope.socket.on === true ? scope.socket : io(scope.endpoint);
        socket.on("connect", function () {
          socket.isActive = true;
          scope.socket = socket;
          scope._isRetrievingSocket = false;
          debug("Adding socket", socket.id);
          resolve(socket);
        });
        socket.on("disconnect", function () {
          socket.isActive = false;
          debug("Disposing socket", socket.id);
          delete scope.socket;
        });
      }
    }
  });
}

function executeBySocket(name, args, options, globalOptions) {
  const debug = getDebugInstance(`socket`, 4, globalOptions);
  return new Promise(async (resolve, reject) => {
    const elapsed = calculateElapsed();
    const socket = await getSocket(globalOptions);
    const request = { ...getRequestPayload(name, args, options, globalOptions),
      id: require("uniqid")()
    };
    socket.once("fn_" + request.id, response => {
      debug(name, elapsed(), {
        request,
        response
      });

      if (!!response.err) {
        return response.reject(response, response.err);
      }

      resolve(response);
    });
    socket.emit("executeFunction", request);
  });
}

function getRequestPayload(name, args = [], options = {}, globalOptions = {}) {
  options.transform = !!options.transform && typeof options.transform !== "string" ? options.transform.toString() : options.transform;
  const request = { ...options,
    name: name,
    args: args,
    ns: options.namespace || options.ns || globalOptions.namespace || globalOptions.ns || process.env.VUE_APP_FUNQL_NAMESPACE || process.env.FUNQL_DEFAULT_NAMESPACE
  };
  return request;
}

async function executeByHttp(name, args = [], options = {}, globalOptions = {}) {
  const debug = getDebugInstance(`http`, 4, globalOptions);
  const endpoint = options.endpoint || process.env.VUE_APP_FUNQL_ENDPOINT || process.env.FUNQL_ENDPOINT;
  const url = `${endpoint}/funql-api`;
  const request = getRequestPayload(name, args, options, globalOptions);
  const elapsed = calculateElapsed();
  let fetchMethod = null;

  if (typeof fetch !== 'undefined') {
    fetchMethod = fetch;
  } else {
    const {
      fetch
    } = require('fetch-ponyfill')();

    fetchMethod = fetch;
  }

  const rawResponse = await fetchMethod(`${url}?n=${name}&ns=${request.ns}`, {
    method: "POST",
    mode: "cors",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request)
  });
  const response = await rawResponse.json();
  debug(name, elapsed(), {
    request,
    response
  });

  if (response.err) {
    response.err = typeof response.err === "object" ? JSON.stringify(response.err) : response.err;
    throw new Error(response.err);
  } else {
    return response;
  }
}

function calculateElapsed() {
  var startDate = new Date();
  return function () {
    var endDate = new Date();
    var seconds = (endDate.getTime() - startDate.getTime()) / 1000;
    return seconds + "s";
  };
}

function getDebugInstance(name, level = 4, options = {}) {
  let levelLabel = {
    1: "ERROR",
    2: "WARN",
    3: "INFO",
    4: "DEBUG"
  };
  let debugEnv = parseInt(process.env.VUE_APP_DEBUG) || "funql*";

  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.debug = (localStorage.debug || "") + `,${debugEnv}`;
  }

  let _level = parseInt(process.env.VUE_APP_DEBUG_LEVEL) || 4;

  if (level > _level) {
    return () => {};
  } else {
    let debug = () => {};

    debug = options.debug || (typeof require !== "undefined" ? require("debug") : (prefix = "") => {
      return function () {
        let args = Array.prototype.slice.call(arguments);
        args.unshift(prefix);
        console.log.apply(this, args);
      };
    });
    return debug(`${`fql-client:${name}`.padEnd(15, " ")} ${levelLabel[level].padEnd(7, " ")} ${`${Date.now()}`}`);
  }
}