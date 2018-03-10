let service = __dirname.split(/\/|\\/g);
service = service[service.length - 1];

const utils = require('../../utils');
const database = require('./database/db');
/*
let beginHandler = utils.beginHandler;
let endHandler = utils.endHandler;
*/

let router = utils.router(service);

const config = require('../../config');
let patterns = config.route_patterns;

const OAuth2Server = require('oauth2-server');
const Request = OAuth2Server.Request;
const Response = OAuth2Server.Response;

oauth = new OAuth2Server({
    model: require('./model')
});

function authenticateHandler(options) {

    return async function(req, res, next) {
        if (router.api.authentificate(req)) {
            try {
                res.locals.user = await database.findOne('user', {_id: res.locals.token.user_id});

                let request = new Request(req);
                let response = new Response(res);

                return oauth.authenticate(request, response, options)
                    .then(function (token) {
                        res.locals.data = {token};

                        res.locals.data = res.locals.route;

                        next();
                    })
                    .catch(function (err) {
                        let {code, message} = err;
                        res.locals.error = {code, message};
                        next();
                    });
            }
            catch (err) {
                let {code, message} = err;
                res.locals.error = {code, message};
                next();
            }
        }
        else next();
    }
}

let authorizeOptions = {
    authenticateHandler: {
        handle: async function(request, response) {
            return response.locals.user;
        }
    }
};

function authorizeHandler(options) {
    return async function(req, res, next) {
        let request = new Request(req);
        let response = new Response(res);

        return oauth.authorize(request, response, options)
            .then(function (code) {
                res.locals.data = {code: code.authorizationCode};
                next();
            })
            .catch(function (err) {
                let {code, message} = err;
                res.locals.error = {code, message};
                console.log(err);
                next();
            });
    }
}

function tokenHandler(options) {
    return function(req, res, next) {
        let request = new Request(req);
        let response = new Response(res);
        return oauth.token(request, response, options)
            .then(function(token) {
                res.locals.data = {token: token.accessToken};
                next();
            })
            .catch(function(err) {
                let {code, message} = err;
                res.locals.error = {code, message};
                console.log(err);
                next()
            });
    }
}

router.onComponentData = function(req, res, response, data) {
    switch(res.locals.route.name) {
        case 'layout':
            if(!response.session.auth)
                data.tabs = [data.tabs[0]];
            break;
    }

    return data;
};

router.all(patterns, router.beginHandler());
//res.locals.route

router.all(patterns, function(req, res, next) {
    console.log(req.params);
    next();
});

router.all(patterns, authenticateHandler());


/*
router.all('/api', authenticateHandler(), async function(req, res, next) {
    next();
});
*/

router.post('/oauthorize', authorizeHandler(authorizeOptions));

router.post('/otoken', tokenHandler());

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

router.all(patterns, router.endHandler());

module.exports = function (name) {
    //service = name;
    return router;
};