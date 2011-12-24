if (process.env.REDISTOGO_URL) {
	var redis = require('redis-url').connect(process.env.REDISTOGO_URL);
}
else {
	var redis = require("redis").createClient();
}

var express = require('express'),
		routes = require('./routes'),
		db = redis,
		connect = require('connect'),
		RedisStore = require('connect-redis')(express),
		app = module.exports = express.createServer(),
		io = require('socket.io').listen(app),
		parseCookie = require('connect').utils.parseCookie,
		url = require('url');

app.configure('development', function(){
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
	app.use(express.errorHandler()); 
    var redisUrl = url.parse(process.env.REDISTOGO_URL),
        redisAuth = redisUrl.auth.split(':');
    app.set('redisHost', redisUrl.hostname);
    app.set('redisPort', redisUrl.port);
    app.set('redisDb', redisAuth[0]);
    app.set('redisPass', redisAuth[1]);
});

if (process.env.REDISTOGO_URL) {
	var sessionStore = new RedisStore({host: app.set('redisHost'),port: app.set('redisPort'),db: app.set('redisDb'),pass: app.set('redisPass')});
}
else {
	var sessionStore = new RedisStore;
}

app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.static(__dirname + '/public'));
	app.use(express.cookieParser());
	app.use(express.session({secret: 'secret', key: 'express.sid', store: sessionStore}));
	app.use(app.router);
	app.use(express.compiler({ src: __dirname + '/public', enable: ['less'] }));
  app.use(express.static(__dirname + '/public'));
	app.dynamicHelpers({flash: function(req, res){return req.flash();}});
	app.dynamicHelpers({current_user: function(req, res){return req.session.user;}});
});


var port = process.env.PORT || 5000;
app.listen(port);

require('./routes')(app, db);

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

//IO stuff
var Session = require('connect').middleware.session.Session;
io.set('authorization', function (data, accept) {
	if (data.headers.cookie) {
  	data.cookie = parseCookie(data.headers.cookie);
    data.sessionID = data.cookie['express.sid'];
    data.sessionStore = sessionStore;
    sessionStore.get(data.sessionID, function (err, session) {
    	if (err || !session) {
      	accept('Errorrrrrrr', false);
    	} else {
      	data.session = new Session(data, session);
      	accept(null, true);
    	}
    });
  } else {
  	return accept('No cookie transmitted.', false);
  }
});

io.sockets.on('connection', function (socket) {
	var hs = socket.handshake;
  console.log('A socket with sessionID ' + hs.sessionID + ' connected!');
  console.log('A socket with userid ' + hs.session.userid + ' connected!');
	socket.on('hitme!', function(){
		console.log('hitme!');
		var time = Math.round(new Date().getTime() / 1000);
		// erase the stuff older than 30secs before emitting
		db.zremrangebyscore('hitcount:' + hs.session.userid, 0, time - 30, function(err, result){
			//count the remqining set			
			db.zcard('hitcount:' + hs.session.userid, function(err, result){
				console.log(result);
				socket.emit('count', { count: result });
			});
		});	
	});
});

