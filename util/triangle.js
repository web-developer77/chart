const messageData = (e) => {
  return JSON.parse(e.data);
};

const createSocket = () => {
  const socket = new WebSocket('ws://localhost:6969');
  return new Promise((resolve, reject) => {
    socket.onmessage = e => {
      if(messageData(e).message === 'connected')
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

  const auth = (userId) => {
    send({action: 'authenticate', params: { userId }});
    return new Promise((resolve, reject) => {
      s.onmessage = e => {
        const data = messageData(e);
        if(data.status === 'success')
          resolve(data.status);
        reject(data.status);
      };
    });
  };

  const init = (userId) => {
    return createSocket()
      .then(socket => {
        s = socket;
        return auth(userId);
      });
  };

  const subscribe = (pair, handler) => {
    send({action: 'subscribe', params: {pair}});
    pairSubscribed = pair; 
    s.onmessage = e => {
      const data = messageData(e, true);
      if(handler)
        handler(data);
      last = {DT: new Date(data.t), Value: data.Last};

    };
  };

  const unsubscribe = () => {
    send({action: 'unsubscribe', params: {pair: pairSubscribed}});
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
