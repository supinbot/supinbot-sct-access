var sessions = require("client-sessions");
var bodyparser = require('body-parser');
var nunjucks = require('nunjucks');
var express = require('express');
var crypto = require('crypto');
var path = require('path');
var fs = require('fs');

var TOKENS = {};
var TOKEN_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';

var LANG = require('./languages');

module.exports = function(SupinBot) {
	var config = require('./config')(SupinBot.config);

	function createToken(duration) {
		var length = config.get('tokenLength');
		var token;

		do {
			token = '';
			for (var i = 0; i < length; i++) token += TOKEN_CHARS[Math.floor(Math.random() * TOKEN_CHARS.length)];
		} while (TOKENS[token]);

		TOKENS[token] = {
			tokenExpDate: new Date(new Date().getTime() + config.get('ttl') * 60000),
			cookieDuration: duration * 60000
		};

		return token;
	}

	function isValidToken(token, noDelete) {
		var tokenData = TOKENS[token];
		if (tokenData) {
			if (!noDelete) delete TOKENS[token];

			var diff = new Date().getTime() - tokenData.tokenExpDate.getTime();
			if (diff < 0) return JSON.parse(JSON.stringify(tokenData)); // deep copy.
		}
		return false;
	}

	SupinBot.CommandManager.addCommand('scttoken', function(user, channel, args, argsStr) {
		var token = createToken(args[0]);
		SupinBot.postMessage(channel.id, 'SCT Access Token created: *' + token + '*');
	})
	.setDescription('Generates an access token to let SCT post to the chat.')
	.addArgument('Session duration in minutes', 'int', config.get('cookie.duration'))
	.adminOnly();


	var app = express();
	nunjucks.configure(path.resolve(__dirname, 'views'), {
		autoescape: true,
		express: app,
		noCache: config.get('noCache')
	});

	app.use(bodyparser.urlencoded({extended: false}));
	app.use(sessions({
		cookieName: 'session',
		secret: config.get('cookie.secret'),
		duration: config.get('cookie.duration'),
		activeDuration: config.get('cookie.active_duration')
	}));

	app.use(function(req, res, next) {
		if (req.session.logged) {
			res.locals.logged = true;
		}

		next();
	});

	app.get('/', function(req, res, next) {
		res.redirect('/message');
	});

	app.get('/login', function(req, res, next) {
		if (req.session.logged) return res.redirect('/message');

		res.render('login.html', {title: 'SUPINBOT SCT Access | Login'});
	});

	app.post('/login', function(req, res, next) {
		if (req.body.token) {
			var tokenData = isValidToken(req.body.token.toUpperCase());
			if (tokenData) {
				req.session.logged = true;
				req.session.expDate = new Date(new Date().getTime() + tokenData.cookieDuration);

				return res.redirect('/message');
			}
		}

		res.render('login.html', {title: 'SUPINBOT SCT Access | Login', error: true});
	});

	app.post('/message', function(req, res, next) {
		if (req.session.logged && new Date(req.session.expDate).getTime() > new Date().getTime()) {
			if (req.body.message && req.body.message.length > 0) {
				SupinBot.postMessage(config.get('channel'), req.body.message);
				return res.json({ok: true});
			}

			return res.json({ok: false, error: 'Message too short!'});
		}

		req.session.reset();
		res.json({ok: false, error: 'Session expired, refresh this page.'});
	});

	app.post('/snippet', function(req, res, next) {
		if (req.session.logged && new Date(req.session.expDate).getTime() > new Date().getTime()) {
			if (!req.body.title || req.body.title.length === 0) return res.json({ok: false, error: 'Title too short!'});
			if (!req.body.code || req.body.code.length === 0) return res.json({ok: false, error: 'Snippet too short!'});
			var lang = (LANG[req.body.lang]) ? req.body.lang : 'txt';

			SupinBot.WebClient.files.upload('-.' + lang, {
				title: req.body.title,
				content: req.body.code,
				filetype: lang,
				channels: config.get('channel')
			}, function(err, data) {
				if (!err && data.ok) {
					res.json({ok: true});
				} else {
					res.json({ok: false, error: 'The Slack API returned an error :('});
				}
			});
		} else {
			req.session.reset();
			res.json({ok: false, error: 'Session expired, refresh this page.'});
		}
	});

	app.use(function(req, res, next) {
		if (req.session.logged && new Date(req.session.expDate).getTime() > new Date().getTime()) {
			next();
		} else {
			res.redirect('/login');
		}
	});

	app.get('/logout', function(req, res, next) {
		req.session.reset();
		res.redirect('/login');
	});

	app.get('/message', function(req, res, next) {
		res.render('message.html', {title: 'SUPINBOT SCT Access | Message'});
	});

	app.get('/snippet', function(req, res, next) {
		res.render('snippet.html', {title: 'SUPINBOT SCT Access | Snippet', lang: LANG});
	});

	app.listen(config.get('port'));
};
