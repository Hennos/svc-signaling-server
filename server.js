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

io.on('connection', (socket) => {
  console.log('connection created');
  
  const clientId = crypto.randomBytes(32).toString('hex');
  let clientData = null;

  socket.emit(MessageType.CLIENTS, Object.keys(clients));

  Object.keys(clients)
  .forEach((key) => clients[key].emit(MessageType.SET_PEER, clientId));
  
  clients[clientId] = socket;

  socket.on(MessageType.PEER_DATA, (peer) => {
    clientData = peer;
  })

  socket.on(MessageType.REQUEST_PEER, (clientId) => {
    clients[clientId].emit(MessageType.REQUEST_PEER_ANSWER, clientData);
  })
  
  socket.on(MessageType.DISCONNECT, function () {
    console.log('disconnect ' + clientId);
    clients[clientId].disconnect(true);
    delete clients[clientId];
    Object.keys(clients).forEach((key) => {
      clients[key].emit(MessageType.LEAVE_PEER, clientId);
    });
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
});

server.listen(PORT);