if (process.env.REDISTOGO_URL) {
	var rtg = require("url").parse(process.env.REDISTOGO_URL);
	var redis = require("redis").createClient(rtg.port, rtg.hostname);
	redis.auth(rtg.auth.split(":")[1]);
}
else{
var redis = require("redis").createClient();
}

var express = require('express'),
		routes = require('./routes'),
		RedisStore = require('connect-redis')(express),
		app = module.exports = express.createServer(),
		io = require('socket.io').listen(app),
		parseCookie = require('connect').utils.parseCookie,
		db = redis,
		bcrypt = require('bcrypt'),  
		url = require('url');

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

var port = process.env.PORT || 3000;
app.listen(port);

app.configure('development', function(){
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
	app.use(express.errorHandler()); 
});

app.get('/', function(req, res){
	req.session.userid = 1111;
	db.zcard('hitcount:1111' , function(err, result){
		res.render('index.jade', { title: 'DS Analytics', count: result == 0 ? 1 : result });
	});
});

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
			hash = bcrypt.encrypt_sync(pwd, salt),
			random = Math.floor(Math.random()*1000);
	db.incr('next.user.id', function(err, result){
		var id_count = result,
				random_id = id_count + '' + random;
		db.set(user + ':hash', hash, function(err, result){
			db.set(user + ':id', random_id, function(err, result){
				req.session.userid = random_id;
				res.redirect('/setup');
			});
		});	
	});
});

app.get('/setup', function(req, res){
	res.render('setup.jade', { title: 'Setup', userid: req.session.userid });
});

app.post('/login', function(req, res){
	var pwd = req.body.user.password,
			user = req.body.user.email,
			hash = db.get(user + ':hash', function(error, result){
				if (bcrypt.compare_sync(pwd, result)){
					db.get(user + ':id', function(err, result){
						req.session.userid = result;
						req.session.user = user;
						res.redirect('/auth');
					});	
				}
			});
});

app.get('/auth', function(req, res){
	res.render('auth.jade', { title: 'Auth', session_id: req.sessionID, user: req.session.user});
});


// need to use express url parsing
app.get('/tracker', function(req, res){
	var sid = req.query.dsanalytics_sid,
			vid = req.query.dsanalytics_vid,
			time = Math.round(new Date().getTime() / 1000);
	console.log('sid: ' + sid + ' vid: ' + vid );
	//use a UNIX-like timestamp in seconds for the score
	db.zadd('hitcount:' + sid, time, vid);
	//remove all set members with a score below now minus 30 secs
	//not good, need to setup a setinterval client side to do this and put it in another place
	res.end();
});

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

