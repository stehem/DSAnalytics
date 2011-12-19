var	bcrypt = require('bcrypt');  

exports.new = function(req, res, db, callback){
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
				callback();
			});
		});	
	});
}

exports.login = function(req, res, db, callback){
	var pwd = req.body.user.password,
			user = req.body.user.email,
			hash = db.get(user + ':hash', function(error, result){
				if (result != null && bcrypt.compare_sync(pwd, result)){
					db.get(user + ':id', function(err, result){
						req.session.userid = result;
						req.session.user = user;
						callback();
					});	
				}else{
					req.flash('error', "Something is wrong or missing...")
					res.render('login.jade', { title: 'My Site', flash: req.flash() });
				}
			});
}
