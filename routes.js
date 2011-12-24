
module.exports = function(app, db){
				
	var user = require('./models/user');
	var tracker = require('./models/tracker');

	app.get('/', function(req, res){
		req.session.userid = 1111;
		var time = Math.round(new Date().getTime() / 1000);
		db.zremrangebyscore('hitcount:' + req.session.userid, 0, time - 30, function(err, result){
			db.zcard('hitcount:1111' , function(err, result){
				res.render('index.jade', {sitename: 'this site', title: 'DS Analytics', count: result == 0 ? 1 : result });
			});	
		});	
	});

	app.get('/login', function(req, res){
		res.render('login.jade', { title: 'My Site' });
	});


	app.get('/logout', function(req, res){
		req.session.user = null;
		req.session.userid = null;
		res.redirect('/');
	});

	app.get('/new_account', function(req, res){
		res.render('new_account.jade', { title: 'My Site' });
	});


	app.post('/new_account', function(req, res){
		user.new(req, res, db, function(){res.redirect('/setup')});
	});


	app.get('/setup', function(req, res){
		res.render('setup.jade', { title: 'Setup', userid: req.session.userid });
	});

	app.post('/login', function(req, res){
		user.login(req, res, db, function(){res.redirect('/auth')});
	});

	app.get('/logout', function(req, res){
		req.session.userid = null;
		req.session.user = null;;
		res.redirect('/');
	});

	app.get('/auth', function(req, res){
		var time = Math.round(new Date().getTime() / 1000);
		db.zremrangebyscore('hitcount:' + req.session.userid, 0, time - 30, function(err, result){
			db.zcard('hitcount:' + req.session.userid, function(err, count){
				db.get(req.session.user + ':sitename', function(err, result){
					res.render('auth.jade', { title: 'Auth', session_id: req.sessionID, user: req.session.user, sitename: result, count: count});
				});
			});
		});
	});


	app.get('/tracker', function(req, res){
		try {tracker.hit(req, res, db);}
		catch (e) {}
		finally {res.end();};
	});


}
