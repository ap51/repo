const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const expressSession = require('express-session');

const OAuth2Server = require('oauth2-server');
const Request = OAuth2Server.Request;
const Response = OAuth2Server.Response;

const loadContent = require('../../utils').loadContent;

let service = '';

let router = express.Router();

const MemoryStore = expressSession.MemoryStore;

router.use(expressSession({
    saveUninitialized: true,
    resave: true,
    secret: 'ljeklfjwlekjf',
    store: new MemoryStore(),
    cookie: {
        maxAge: 3600000 * 24 * 7 * 52
    },
}));

router.use(bodyParser.json());

oauth = new OAuth2Server({
    model: require('./model')
});

function authenticateHandler(options) {
    return async function(req, res, next) {
        let request = new Request(req);
        let response = new Response(res);

        return oauth.authenticate(request, response, options)
            .then(function(token) {
                res.locals.oauth = {token: token};
                next();
            })
            .catch(function(err) {
                // handle error condition
                console.log(err);
            });
    }
}

let authorizeOptions = {
    authenticateHandler: {
        handle: function(request, response) {
            return request.session.user;
        }
    }
};

function authorizeHandler(options) {
    return function(req, res, next) {
        let request = new Request(req);
        let response = new Response(res);
        return oauth.authorize(request, response, options)
            .then(function(code) {
                res.locals.oauth = {code: code};
                next();
            })
            .catch(function(err) {
                // handle error condition
                console.log(err);
            });
    }
}

function tokenHandler(options) {
    return function(req, res, next) {
        let request = new Request(req);
        let response = new Response(res);
        return oauth.token(request, response, options)
            .then(function(code) {
                res.locals.oauth = {token: token};
                next();
            })
            .catch(function(err) {
                // handle error condition
            });
    }
}

router.all('/:route', async function(req, res, next) {
    next();
});

router.all('/api', authenticateHandler(), async function(req, res, next) {
    next();
});

router.post('/oauth/authorize', async function(req, res, next) {
    next();
});

router.post('/oauth/token?', async function(req, res, next) {
    next();
});

/*
router.get('/grant', function(req, res, next){
    next();
});
*/
router.post('/grant', function(req, res, next){
    next();
});

/*
router.get('/signin', function(req, res, next){
    next();
});
*/
router.post('/signin', function(req, res, next){
    next();
});

/*
router.get('/signout', function(req, res, next){
    next();
});
*/
router.post('/signout', function(req, res, next){
    next();
});



let end = async function(req, res, next) {
    if(req.method === 'GET') {
        let route = req.session.redirect || req.params.route;

        let content = route && await loadContent(route, res, service);

        res.locals.component = content.toString();
    }

    let response = {
        redirect: req.session.redirect,
        data: res.locals.data,
        error: res.locals.error,
        component: res.locals.component,
        session: {
            auth: req.session.user,
            id: req.session.id
        }
    };


    delete req.session.redirect;

    res.end(JSON.stringify(response));
};

router.all('/:route', end);

module.exports = function (name) {
    service = name;
    return router;
};