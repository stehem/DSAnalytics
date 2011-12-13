exports.hit = function(req, res, db){
	var sid = req.query.dsanalytics_sid,
			vid = req.query.dsanalytics_vid,
			time = Math.round(new Date().getTime() / 1000);
	console.log('sid: ' + sid + ' vid: ' + vid );
	//use a UNIX-like timestamp in seconds for the score
	db.zadd('hitcount:' + sid, time, vid);
}
