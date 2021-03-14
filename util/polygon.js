const messageData = (e, all=false) => {
  const data = JSON.parse(e.data);
  if(all)
    return data;
  return data[0];
};

const createSocket = () => {
  const socket = new WebSocket('wss://socket.polygon.io/crypto');
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
  var last = [];
  var pairSubscribed = '';
  const subPrefix = 'XQ.';

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
    send({action: 'subscribe', params: subPrefix + pair});
    pairSubscribed = pair; 
    s.onmessage = e => {
      const data = messageData(e, true);
      if(handler)
        for(let message of data)
          handler(message);
      last = data.map(message => ({DT: new Date(message.t), Value: message.bp}));
    };
  };

  const unsubscribe = () => {
    send({action: 'unsubscribe', params: subPrefix + pairSubscribed});
    return new Promise((resolve, reject) => {
      s.onmessage = e => {
        if(messageData(e).status === 'success')
          setTimeout(resolve, 1000);
      }
    });
  };

  const quoteFeed = {
    fetchUpdateData: (symbol, startDate, params, cb) => {
      cb({quotes: last});
    }
  };

  return {
    init,
    subscribe,
    unsubscribe,
    pairSubscribed,
    quoteFeed
  };
};

export default Polygon;
