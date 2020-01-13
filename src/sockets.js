module.exports = {
  onSocketConnected(socket, api, scope) {
    socket.on("executeFunction", async function(params) {
      console.log("avail", Object.keys(api), params.name);
      let response = await api[params.name].apply(this, params.args || []);
      console.log("socket response", response);
      socket.emit(`fn_${params.id}`, response);
    });
  }
};
