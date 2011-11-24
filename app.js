
var express = require('express'),
   	routes = require('./routes'),
	  RedisStore = require('connect-redis')(express),
		app = module.exports = express.createServer(),
		io = require('socket.io').listen(app),
		parseCookie = require('connect').utils.parseCookie,
    redis = require('redis'),
		db = redis.createClient(),
		bcrypt = require('bcrypt'),  
		fs = require('fs');

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

app.get('/new_account', function(req, res){
    res.render('new_account.jade', { title: 'My Site' });
});

app.post('/new_account', function(req, res){
		var salt = bcrypt.gen_salt_sync(10), 
				user = req.body.user.email,
				pwd = req.body.user.password,
				hash = bcrypt.encrypt_sync(pwd, salt);
		db.set(user, hash);
		res.redirect('/');
});


app.post('/login', function(req, res){
	var pwd = req.body.user.password,
			user = req.body.user.email,
			hash = db.get(user, function(error, result){
				if (bcrypt.compare_sync(pwd, result)){
    			res.redirect('/auth');
				}
			});
});

app.get('/auth', function(req, res){
    res.render('auth.jade', { title: 'Auth', session_id: req.sessionID, user: req.session.user});
});

 
//render pages without a templating engine
app.get('/site', function(req, res){
	fs.readFile(__dirname + '/site.html', 'utf8', function(err, text){
		res.send(text);
	});
});

// need to use express url parsing
app.get('/tracker', function(req, res){
	var sid = req.query.dsanalytics_sid,
			vid = req.query.dsanalytics_vid,
			time = Math.round(new Date().getTime() / 1000);
	console.log('sid: ' + sid + ' vid: ' + vid );
	//use a UNIX-like timestamp in seconds for the score
	db.zadd(sid, time, vid);
	//remove all set members with a score below now minus 30 secs
	db.zremrangebyscore(sid, 0, time - 30);
	res.end();
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
