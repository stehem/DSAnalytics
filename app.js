
var express = require('express'),
   	routes = require('./routes'),
	  RedisStore = require('connect-redis')(express),
		app = module.exports = express.createServer(),
		io = require('socket.io').listen(app),
		parseCookie = require('connect').utils.parseCookie;

var sessionStore = new RedisStore();

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
  app.use(express.cookieParser());
  app.use(express.session({secret: 'secret', key: 'express.sid', store: sessionStore}));
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

app.get('/', routes.index);

app.get('/login', function(req, res){
    res.render('login.jade', { title: 'My Site' });
});

app.post('/login', function(req, res){
  if (req.body.user.name == 'lili' && req.body.user.email == 'lolo'){
    req.session.user = 'lili';
    res.redirect('/auth');
  }
  else{
  //  req.session.user = 'false';
  //  res.redirect('/auth');
  }
});

app.get('/auth', function(req, res){
    res.render('auth.jade', { title: 'Auth', session_id: req.sessionID, user: req.session.user});
});

app.listen(3000);
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
      	accept('Error', false);
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
});
