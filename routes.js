
module.exports = function(app, db, bcrypt){
				
	var user = require('./models/user');
	var tracker = require('./models/tracker');

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
//		user.new(req, res, db, bcrypt, res.redirect('/setup'));
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
		user.login(req, res, db, bcrypt, res.redirect('/auth'));
	});

	app.get('/auth', function(req, res){
		res.render('auth.jade', { title: 'Auth', session_id: req.sessionID, user: req.session.user});
	});


app.get('/tracker', function(req, res){
	tracker.hit(req, res, db);
	res.end();
});


}
