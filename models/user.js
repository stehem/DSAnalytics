var	bcrypt = require('bcrypt');  

exports.new = function(req, res, db, callback){
	//check for email uniqueness otherwise it will mess Redis up
	db.get(req.body.user.email + ':id', function(err, result){
		if (result == null) {
			if ((req.body.user.email != '') && (req.body.user.password != '') && (req.body.user.sitename != '')) {
				var salt = bcrypt.gen_salt_sync(10), 
						user = req.body.user.email,
						pwd = req.body.user.password,
						sitename= req.body.user.sitename,
						hash = bcrypt.encrypt_sync(pwd, salt),
						random = Math.floor(Math.random()*1000);
				db.incr('next.user.id', function(err, result){
					var id_count = result,
							random_id = id_count + '' + random;
					db.set(user + ':hash', hash, function(err, result){
						db.set(user + ':id', random_id, function(err, result){
							db.set(user + ':sitename', sitename, function(err, result){
								req.session.userid = random_id;
								req.flash('notice', "Account successfully created.");
								callback();
							});
						});
					});	
				});
			} 
			else {
				req.flash('error', "something is missing...");
				res.render('new_account.jade', {title: 'my site'});
			}
		}
		else{
			req.flash('error', "Email already exists");
			res.render('new_account.jade', {title: 'my site'});
		}
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
					req.flash('error', "something is wrong or missing...");
					res.render('login.jade', { title: 'my site'});
				}
			});
}
