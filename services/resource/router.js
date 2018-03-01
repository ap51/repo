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
        if (res.locals.route.name === 'api') {
            if(!req.session.user) {
                req.session.user = await database.findOne('user', {email: 'user@user.com'});
            }

            let request = new Request(req);
            let response = new Response(res);

            return oauth.authenticate(request, response, options)
                .then(function (token) {
                    res.locals.oauth = {token: token};
                    next();
                })
                .catch(function (err) {
                    let {code, message} = err;
                    res.locals.error = {code, message};
                    next();
                });
        }
        else next();
    }
}

let authorizeOptions = {
    authenticateHandler: {
        handle: async function(request, response) {
            return await database.findOne('user', {email: 'user@user.com'});
        }
    }
};

function authorizeHandler(options) {
    return function(req, res, next) {
        let request = new Request(req);
        let response = new Response(res);
        return oauth.authorize(request, response, options)
            .then(function(code) {
                res.locals.data = {code: code.authorizationCode};
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

router.all(patterns, router.beginHandler());

/*
function apiHandler(req, res, next) {
    if(res.locals.route.name === 'api') {
        console.log(service, 'api call:', res.locals.route.action);
        return authenticateHandler()(req, res, next);
    }
    else next();
}
*/

router.all(patterns, function(req, res, next) {
    console.log(req.params.route);
    next();
});

router.all(patterns, authenticateHandler());


/*
router.all('/api', authenticateHandler(), async function(req, res, next) {
    next();
});
*/

router.post('/oauthorize', authorizeHandler(authorizeOptions));

router.post('/otoken', async function(req, res, next) {
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

router.all(patterns, router.endHandler());

module.exports = function (name) {
    //service = name;
    return router;
};