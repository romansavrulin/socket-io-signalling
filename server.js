// https://www.webrtc-experiment.com/

var fs = require('fs');

// don't forget to use your own keys!
var options = {
    // key: fs.readFileSync('fake-keys/privatekey.pem'),
    // cert: fs.readFileSync('fake-keys/certificate.pem')
    //key: fs.readFileSync('/etc/letsencrypt/live/webrtcweb.com/privkey.pem'),
    //cert: fs.readFileSync('/etc/letsencrypt/live/webrtcweb.com/fullchain.pem')
};

// HTTPs server
var app = require('http').createServer(options, function(request, response) {
    response.writeHead(200, {
        'Content-Type': 'text/html'
    });
    var link = 'https://github.com/muaz-khan/WebRTC-Experiment/tree/master/socketio-over-nodejs';
    response.write('<title>socketio-over-nodejs</title><h1><a href="'+ link + '">socketio-over-nodejs</a></h1><pre>var socket = io.connect("https://webrtcweb.com:9559/");</pre>');
    response.end();
});


// socket.io goes below

var io = require('socket.io').listen(app, {
    log: true,
    origins: '*:*'
});

io.set('transports', [
    'websocket',
    'xhr-polling',
    'jsonp-polling'
]);

var channels = {};

io.sockets.on('connection', function (socket) {
    var initiatorChannel = '';
    if (!io.isConnected) {
        io.isConnected = true;
    }
    console.log("Connected!");

    socket.on('new-channel', function (data) {
        if (!channels[data.channel]) {
            initiatorChannel = data.channel;
        }

        console.log("New Channel: " + data.channel);

        channels[data.channel] = data.channel;
        onNewNamespace(data.channel, data.sender);
    });

    socket.on('presence', function (channel) {
        var isChannelPresent = !! channels[channel];
        socket.emit('presence', isChannelPresent);
        console.log("Presence!");
    });

    socket.on('disconnect', function (channel) {
        if (initiatorChannel) {
            console.log("Disconnect initiator!");
            delete channels[initiatorChannel];
        } else
            console.log("Disconnect!");
    });
});

function onNewNamespace(channel, sender) {
    console.log("New Namespace for channel: " +  channel)
    io.of('/' + channel).on('connection', function (socket) {
        var username;
        if (io.isConnected) {
            io.isConnected = false;
            socket.emit('connect', true);
        }

        console.log("Namespace Connect!")

        socket.on('message', function (data) {
            console.log("Message!" + data)
            if (data.sender == sender) {
                if(!username) username = data.data.sender;

                console.log("Message == sender")

                socket.broadcast.emit('message', data.data);
            }
        });

        socket.on('disconnect', function() {
            console.log("Namespace Disconnect!")
            if(username) {
                console.log("User Left")
                socket.broadcast.emit('user-left', username);
                username = null;
            }
        });
    });
}

// run app

app.listen(process.env.PORT || 9559);

process.on('unhandledRejection', (reason, promise) => {
  process.exit(1);
});

console.log('Please open SSL URL: https://localhost:'+(process.env.PORT || 9559)+'/');
