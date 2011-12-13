var express = require('express'),
		app = module.exports = express.createServer(),
    url = require('url'),
    RedisStore = require('connect-redis')(express),
		redisurl = 'redis://redistogo:09380915e925380e031553079a14b44f@barracuda.redistogo.com:9025/';

app.configure('development', function () {
    var redisUrl = url.parse(redisurl),
        redisAuth = redisUrl.auth.split(':');

    app.set('redisHost', redisUrl.hostname);
    app.set('redisPort', redisUrl.port);
    app.set('redisDb', redisAuth[0]);
    app.set('redisPass', redisAuth[1]);
});

app.configure(function () {
app.use(express.cookieParser());
    app.use(express.session({
        secret: 'super duper secret',
        store: new RedisStore({
            host: app.set('redisHost'),
            port: app.set('redisPort'),
            db: app.set('redisDb'),
            pass: app.set('redisPass'),
        })
    }));
});

app.get('/', function(req, res){
    res.send('Hello World');
});

app.listen(3000);
