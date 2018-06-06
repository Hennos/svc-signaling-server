const PORT = 3002;

const crypto = require('crypto');

const server = require('http').createServer();

const MessageType = {
  DISCONNECT: 'disconnect',

  RTC: '@RTC/BASE',

  CLIENTS: '@PEER/CLIENTS',
  PEER_DATA: '@PEER/DATA',

  SET_PEER: '@PEER/ADD',
  LEAVE_PEER: '@PEER/LEAVE',
};

const io = require('socket.io')(server);
io.set('origins', 'localhost:*');

let clients = Object.create(null);
let clientsData = Object.create(null);

io.on('connection', (socket) => {
  console.log('connection created');
  
  const clientId = crypto.randomBytes(32).toString('hex');

  socket.emit(MessageType.CLIENTS,
    Object.keys(clients)
    .map(peerId => ({
      id: peerId,
      data: clientsData[peerId],
    }))
  );
  
  clients[clientId] = socket;

  socket.on(MessageType.PEER_DATA, (peer) => {
    console.log('add peer data');
    clientsData[clientId] = peer;
    Object.keys(clients)
    .filter(peerId => !Object.is(peerId, clientId))
    .forEach(peerId => {
      clients[peerId].emit(MessageType.SET_PEER, {
        id: clientId,
        data: clientsData[clientId],
      });
    });
  })

  socket.on(MessageType.RTC, (message) => {
    console.log('Get RTC messsage from ' + message.id);

    const remoteId = message.id;

    const remoteActive = remoteId in clients;
    if (!remoteActive) {
      throw new Error(clientId + ': try call inactive ' + remoteId);
    }

    clients[remoteId].emit(MessageType.RTC, Object.assign(message, {
      id: clientId,
    }));
  });

  socket.on(MessageType.DISCONNECT, () => {
    console.log('disconnect ' + clientId);
    clients[clientId].disconnect(true);

    Object.keys(clients).forEach((key) => {
      clients[key].emit(MessageType.LEAVE_PEER, clientId);
    });

    delete clients[clientId];
  });
});

server.listen(PORT);