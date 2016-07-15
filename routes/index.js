'use strict';

const express = require('express');
const sessions = require("client-sessions");
const LANG = require('../lib/languages');
const config = require('../index').config;
var tokenStoreInstance = require('../index').tokenStoreInstance;
var SupinBot = require('../index').SupinBot;
var router = express.Router();

router.use(sessions({
	cookieName: 'sct_sess',
	secret: config.get('cookie.secret'),
	duration: config.get('cookie.duration'),
	activeDuration: config.get('cookie.active_duration')
}));

function sessionCheck(req, res) {
	return (req.sct_sess.logged && new Date(req.sct_sess.expDate).getTime() > new Date().getTime()) ? true : false;
}

router.use(function(req, res, next) {
	if (req.sct_sess.logged) {
		res.locals.logged = true;
	}

	next();
});

router.get('/', function(req, res, next) {
	res.redirect('/sct/message');
});

router.get('/login', function(req, res, next) {
	if (req.sct_sess.logged) return res.redirect('/sct/message');

	res.render('sct/login.html', {title: 'SUPINBOT SCT Access | Login'});
});

router.post('/login', function(req, res, next) {
	if (req.body.token) {
		var tokenDuration = tokenStoreInstance.getToken(req.body.token.toUpperCase());
		if (tokenDuration) {
			req.sct_sess.logged = true;
			req.sct_sess.expDate = new Date(new Date().getTime() + tokenDuration * 60000);

			return res.redirect('/sct/message');
		}
	}

	res.render('sct/login.html', {title: 'SUPINBOT SCT Access | Login', error: true});
});

router.post('/message', function(req, res, next) {
	if (sessionCheck(req, res)) {
		if (req.body.message && req.body.message.length > 0) {
			SupinBot.postMessage(config.get('channel'), req.body.message);
			return res.json({ok: true});
		}

		return res.json({ok: false, error: 'Invalid message!'});
	}

	req.session.reset();
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
		req.session.reset();
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
	req.session.reset();
	res.redirect('/sct/login');
});

router.get('/message', function(req, res, next) {
	res.render('sct/message.html', {title: 'SUPINBOT SCT Access | Message'});
});

router.get('/snippet', function(req, res, next) {
	res.render('sct/snippet.html', {title: 'SUPINBOT SCT Access | Snippet', lang: LANG});
});

module.exports = router;
