'use strict';

const co = require('co');
const express = require('express');
const sessions = require("client-sessions");
const RateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');
const LANG = require('../lib/languages');
const config = require('../index').config;
var tokenStoreInstance = require('../index').tokenStoreInstance;
var SupinBot = require('../index').SupinBot;
var router = express.Router();

var loginLimit = new RateLimit({
	windowMs: config.get('rate_limit.window'),
	delayMs: config.get('rate_limit.delay'),
	max: config.get('rate_limit.max'),
	store: new RedisStore({
		expiry: config.get('rate_limit.window') / 1000,
		client: redis.createClient(SupinBot.config.get('redis'), {db: config.get('rate_limit.redisDb')})
	})
});

router.use(sessions({
	cookieName: 'sct_sess',
	secret: config.get('cookie.secret'),
	duration: config.get('cookie.duration') * 60000,
	activeDuration: config.get('cookie.active_duration'),
	cookie: {
		path: '/sct'
	}
}));

function sessionCheck(req, res) {
	return req.sct_sess.logged && new Date(req.sct_sess.expDate).getTime() > new Date().getTime();
}

router.use(function(req, res, next) {
	if (sessionCheck(res, res)) {
		res.locals.logged = true;
	}

	next();
});

router.get('/', function(req, res, next) {
	res.redirect('/sct/message');
});

router.get('/login', function(req, res, next) {
	if (sessionCheck(res, res)) return res.redirect('/sct/message');

	res.render('sct/login.html', {title: 'SUPINBOT SCT Access | Login'});
});

router.post('/login', loginLimit, function(req, res, next) {
	co(function*() {
		if (req.body.token) {
			var token = req.body.token.toUpperCase();
			var tokenDuration = yield tokenStoreInstance.getToken(token);

			if (tokenDuration) {
				yield tokenStoreInstance.useToken(token);

				req.sct_sess.logged = true;
				req.sct_sess.expDate = new Date(new Date().getTime() + tokenDuration * 60000);

				return res.redirect('/sct/message');
			}
		}

		res.render('sct/login.html', {title: 'SUPINBOT SCT Access | Login', error: true});
	});
});

router.post('/message', function(req, res, next) {
	if (sessionCheck(req, res)) {
		if (req.body.message && req.body.message.length > 0) {
			SupinBot.postMessage(config.get('channel'), req.body.message);
			return res.json({ok: true});
		}

		return res.json({ok: false, error: 'Invalid message!'});
	}

	req.sct_sess.reset();
	res.json({ok: false, error: 'Session expired, refresh this page.'});
});

router.post('/snippet', function(req, res, next) {
	if (sessionCheck(req, res)) {
		if (!req.body.title || req.body.title.length === 0) return res.json({ok: false, error: 'Invalid title!'});
		if (!req.body.code || req.body.code.length === 0) return res.json({ok: false, error: 'Invalid snippet!'});
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
		req.sct_sess.reset();
		res.json({ok: false, error: 'Session expired, refresh this page.'});
	}
});

router.use(function(req, res, next) {
	if (sessionCheck(req, res)) {
		next();
	} else {
		res.redirect('/sct/login');
	}
});

router.get('/logout', function(req, res, next) {
	req.sct_sess.reset();
	res.redirect('/sct/login');
});

router.get('/message', function(req, res, next) {
	res.render('sct/message.html', {title: 'SUPINBOT SCT Access | Message'});
});

router.get('/snippet', function(req, res, next) {
	res.render('sct/snippet.html', {title: 'SUPINBOT SCT Access | Snippet', lang: LANG});
});

module.exports = router;
