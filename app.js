var app = require('express')()
    , express = require('express')
    , server = require('http').createServer(app)
    , io = require('socket.io').listen(server)
    , path = require('path')
    , redis = require('redis')
    , marked = require('marked')
    , hljs = require('highlight.js');

server.listen(1337);
io.set('log level', 1);

// Set default options
marked.setOptions({
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: true,
  smartLists: true,
  highlight: function(code) {
    return hljs.highlightAuto(code).value;
  }
});

var RedisStore = require('connect-redis')(express),
    rClient = redis.createClient(),
    sessionStore = new RedisStore({client: rClient});

var cookieParser = express.cookieParser('socketsaregreat');

//CORS middleware
var allowCrossDomain = function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
}

app.configure(function() {
    app.set('port', process.env.PORT || 1337);
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(allowCrossDomain);
    app.use(cookieParser);
    app.use(express.session({store: sessionStore, key:'jsessionid', secret:'socketsaregreat'}));
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'include')));
});

app.configure('development', function() {
    app.use(express.errorHandler());
});

app.get('/', function(req, res) {
    var user = req.session.user;

    req.session.regenerate(function(err) {
        req.session.user = user;
        res.sendfile(__dirname + '/index.html');
    });  
});

app.get('/user', function (req, res) { 
    res.json(req.session.user);
});

app.post('/user', function (req, res) {
    req.session.user = req.body.user;
    res.json({"error":"user could not join"});
});

app.get('/logout', function(req, res) {
    req.session.destroy();
    res.redirect('/');
});


var SessionSockets = require('session.socket.io');
var sessionSockets = new SessionSockets(io, sessionStore, cookieParser, 'jsessionid');

var sub = redis.createClient();
var pub = redis.createClient();

sub.subscribe('chat');

var storeMessage = function(data) {
    var data = JSON.stringify(data);
    rClient.lpush('messages', data, function(err, response) {
        rClient.ltrim('messages', 0, 30);
    });
}

sessionSockets.on('connection', function(err, socket, session){
    var user = session.user;

    if(!user) {
        socket.close();
    }

    socket.on('chat', function(data) {
        var data = JSON.parse(data);
        var response = {
            username: session.user,
            message: marked(data.message),
            messageType: 'message'
        };
        storeMessage(response);
        pub.publish('chat', JSON.stringify(response));
    });

    socket.on('join', function() {
        var response = {
            username: session.user,
            message: ' joined the channel',
            messageType: 'status'
        };

        rClient.lrange('messages', 0, -1, function(err, messages) {
            messages = messages.reverse();
            messages.forEach(function(message) {
                var message = JSON.parse(message);
                socket.emit('chat', JSON.stringify(message));
            });
           
            pub.publish('chat', JSON.stringify(response));

            rClient.sadd('userlist', response.username);
            socket.broadcast.emit('useradd', response.username);

            rClient.smembers('userlist', function(err, users) {
                users.forEach(function(user) {
                    socket.emit('useradd', user);
                });
            });  
        });          
    });

    socket.on('disconnect', function() {
        rClient.srem('userlist',  session.user);
        
        var data = {
            username: session.user,
            message: ' left the channel',
            messageType: 'status'
        };
        socket.broadcast.emit('userdel', data.username);
        pub.publish('chat', JSON.stringify(data));
    });

    sub.on('message', function(channel, message) {
        socket.emit(channel, message);
    });
});
