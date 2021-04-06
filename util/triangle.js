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
  var dispatch = null;
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

  const onMessage = e => {
    const data = messageData(e, true);
    switch(data.type){
      case 'quote':
        last = {DT: new Date(data.message.t), Value: data.message.Last};
        break;
      case 'trade':
        if(!dispatch)
          return;
        dispatch({ type: 'ADD_TRADE', payload: data.message });
        break;
      //case 'trade_update':
      //  if(!dispatch)
      //    return;
      //  dispatch({ type: 'ADD_TRADE', payload: data.message });
      //  break;
      default:
        console.log('unknown command: ' + data);
    }
  }

  const subscribe = (pair) => {
    send({action: 'subscribe', params: {pair}});
    pairSubscribed = pair; 
    s.onmessage = onMessage; 
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

  const addTrade = (trade, _dispatch) => {
    dispatch = _dispatch;
    send({ action: 'add_trade', params: { trade } });
  };

  return {
    init,
    subscribe,
    unsubscribe,
    pairSubscribed,
    quoteFeed,
    addTrade
  };
};

export default Polygon;
