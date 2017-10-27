const PORT = 3001;

const crypto = require('crypto');

const server = require('http').createServer();

const MessageType = {
  DISCONNECT: 'disconnect',

  RTC: '@RTC/BASE',

  CLIENTS: 'clients',
  CONNECT: 'connect',
  LEAVE: 'leave',
};

const io = require('socket.io')(server);
io.set('origins', 'localhost:*');

let clients = Object.create(null);

io.on('connection', (socket) => {
  console.log('connection created');
  
  const clientId = crypto.randomBytes(32).toString('hex');

  Object.keys(clients)
  .forEach(key => clients[key].emit(MessageType.CONNECT, clientId));

  socket.emit(MessageType.CLIENTS, Object.keys(clients));
  
  clients[clientId] = socket;

  socket.on(MessageType.DISCONNECT, function () {
    clients[clientId].close();
    delete clients[clientId];
    Object.keys(clients).forEach((key) => {
      clients[key].emit(MessageType.LEAVE, clientId);
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