const PORT = 3001;

const crypto = require('crypto');

const server = require('http').createServer();

const MessageType = {
  DISCONNECT: 'disconnect',

  RTC: '@RTC/BASE',
  
  CLIENTS: '@PEER/CLIENTS',  
  PEER_DATA: '@PEER/DATA',

  REQUEST_PEER: '@PEER/REQUEST',
  REQUEST_PEER_ANSWER: '@PEER/REQUEST_ANSWER',

  SET_PEER: '@PEER/ADD',
  LEAVE_PEER: '@PEER/LEAVE',
};

const io = require('socket.io')(server);
io.set('origins', 'localhost:*');

let clients = Object.create(null);
let clientData = Object.create(null);

io.on('connection', (socket) => {
  console.log('connection created');
  
  const clientId = crypto.randomBytes(32).toString('hex');

  socket.emit(MessageType.CLIENTS, Object.keys(clients));
  
  clients[clientId] = socket;

  socket.on(MessageType.PEER_DATA, (peer) => {
    console.log('add peer data');
    clientsData[clientData] = peer;
    Object.keys(clients)
    .filter(peerId => !Object.is(peerId, clientId))
    .forEach(peerId => { 
      clients[peerId].emit(MessageType.SET_PEER, clientId);
    });
  })

  socket.on(MessageType.REQUEST_PEER, (peerId) => {
    console.log(clientId + ' wants get data from ' + peerName);

    clients[clientId].emit(
      MessageType.REQUEST_PEER_ANSWER,
      clients[peerId] ? clientData[peerId] : null,
    );
  });
  
  socket.on(MessageType.RTC, (message) => {
    const remoteId = message.id;

    const remoteActive = remoteId in clients;
    if (!remoteActive) {
      console.log(clientId + ': try call inactive ' + remoteId);
    }

    clients[remoteId].emit(MessageType.RTC, Object.assign(message, {
      id: clientId,
    }));
  }); 
  
  socket.on(MessageType.DISCONNECT, () => {
    console.log('disconnect ' + clientId);
    clients[clientId].disconnect(true);

    Object.keys(clients).forEach((key) => {
      clients[key].emit(MessageType.LEAVE_PEER, clients[clientId].peerData.name);
    });

    delete clients[clientId];
  });
});

server.listen(PORT);