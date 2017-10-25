const PORT = 3001;

const crypto = require('crypto');

const server = require('http').createServer();

const MessageType = {
  DISCONNECT: 'disconnect',

  SDP: 'sdp',
  ICE_CANDIDATE: 'ice_candidate',

  CLIENTS: 'clients',
  LEAVE: 'leave',
};

const io = require('socket.io')(server);
io.set('origins', 'localhost:*');
io.on('connection', handleSocket);

server.listen(PORT);

let clients = {};

function handleSocket(socket) {
  console.log('connection created');

  socket.emit(MessageType.CLIENTS, clients);

  const clientId = crypto.randomBytes(32).toString('hex');
  clients[clientId] = socket;

  socket.on(MessageType.DISCONNECT, function () {
    clients[clientId].close();
    delete clients[clientId];
    Object.keys(clients).forEach((key) => {
      clients[key].emit(MessageType.LEAVE, clientId);
    });
  });

  socket.on(MessageType.SDP, function ({userId, sdp}) {
    clients[userId].emit(MessageType.SDP, {
      userId: clientId,
      sdp,
    });
  });

  socket.on(MessageType.ICE_CANDIDATE, function ({userId, candidate}) {
    clients[userId].emit(MessageType.ICE_CANDIDATE, {
      userId: clientId,
      candidate,
    });
  });
}