const messageData = e => {
  return JSON.parse(e.data)[0];
};

const createSocket = () => {
  const socket = new WebSocket('wss://socket.polygon.io/forex');
  return new Promise((resolve, reject) => {
    socket.onmessage = e => {
      if(messageData(e).status === 'connected')
        resolve(socket);
      reject('connection failed');
    };
  });
};

function Polygon(apiKey) {
  var s = null;
  var pairSubscribed = '';

  const send = data => s.send(JSON.stringify(data));

  const auth = () => {
    send({action: 'auth', params: apiKey});
    return new Promise((resolve, reject) => {
      s.onmessage = e => {
        const data = messageData(e);
        if(data.status === 'auth_success')
          resolve(data.status);
        reject(data.status);
      };
    });
  };

  const init = () => {
    return createSocket()
      .then(socket => {
        s = socket;
        return auth();
      });
  };

  const subscribe = (pair, handler) => {
    send({action: 'subscribe', params: pair});
    pairSubscribed = pair; 
    s.onmessage = e => {
      const data = messageData(e);
      handler(data);
    };
  };

  const unsubscribe = () => {
    send({action: 'unsubscribe', params: pairSubscribed});
    return new Promise((resolve, reject) => {
      s.onmessage = e => {
        if(messageData(e).status === 'success')
          setTimeout(resolve, 1000);
      }
    });
  };

  return {
    init,
    subscribe,
    unsubscribe,
    pairSubscribed
  };
};

export default Polygon;
