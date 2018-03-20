let service = __dirname.split(/\/|\\/g);
service = service[service.length - 1];

const utils = require('../../utils');
const database = require('./database/db');

let router = utils.router(service);

const config = require('../../config');
let patterns = config.route_patterns;

const OAuth2Server = require('oauth2-server');
const Request = OAuth2Server.Request;
const Response = OAuth2Server.Response;

oauth = new OAuth2Server({
    model: require('./model')
});

router.authenticateHandler = function(options) {
    return async function(req, res, next) {
        try {
            let request = new Request(req);
            let response = new Response(res);

            options.scope = req.path;
            let token = await oauth.authenticate(request, response, options);
            res.locals.user = token.user;
        }
        catch (err) {
            if(req.token) {
                req.token.access = void 0;
                req.token.auth = void 0;
            }

            let {code, message} = err;
            res.locals.error = {code, message};
        }

        next && next();
    }
};

let authorizeOptions = {
    authenticateHandler: {
        handle: async function(req, res) {
            let user = void 0;

            try {
                let token = await router.database.findOne('token', {accessToken: req.token.access});
                user = await router.database.findOne('user', {_id: token.user._id});
            }
            catch (err) {
                res.redirect_remote = 'https://localhost:5000/resource/external-signin';
            }

            return user;
        }
    }
};

function authorizeHandler(options) {
    return async function(req, res, next) {
        let request = new Request(req);
        let response = new Response(res);

        return oauth.authorize(request, response, options)
            .then(function (code) {
                response.locals.token.code = code.authorizationCode;
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

router.tokenHandler = function(options) {
    return async function(req, res, next) {
        try {
            let request = new Request(req);
            let response = new Response(res);

            let token = await oauth.token(request, response, options);

            req.token.access = token.accessToken;
            req.token.auth = token.user.name;
            //req.token.data.user_id = token.user._id;
        }
        catch (err) {
            let {code, message} = err;
            res.locals.error = {code, message};
            console.log(err);
        }
        next && next()
    }
};

router.onComponentData = async function(req, res, response, data) {

    return data;
};

router.all('*', router.jwtHandler());

router.all('/api/:name\.:action', router.authenticateHandler({allowBearerTokensInQueryString: true}), function (req, res, next) {
    res.locals.error ? res.status(res.locals.error.code).send(res.locals.error.message) : res.status(222).json({api: 'v.1.0'});
    return res.end();
});

router.all('/ui/profile', router.authenticateHandler({allowBearerTokensInQueryString: true}), function (req, res, next) {
    if(res.locals.error && res.locals.error.code === 401) {
        //res.redirect_local = 'unauthenticate';
        res.locals.params = {name: 'unauthenticate'};
        res.locals.error = void 0;
    }
    next();
});

router.all(patterns, router.beginHandler());

//router.all(patterns, authenticateHandler());

router.all(patterns, function(req, res, next) {
    console.log(req.params);
    next();
});

router.post('/oauthorize', authorizeHandler(authorizeOptions));

router.post('/otoken', router.tokenHandler());

router.post('/grant', function(req, res, next){
    next();
});

router.post('/signin', async function(req, res, next){
    console.log('SIGNIN');

    try {
        req.body.username = req.body.email;

        req.body.client_id = 'authentificate';
        req.body.client_secret = 'authentificate_secret';
        //req.body.response_type = 'token';
        req.body.grant_type = 'password';
        req.body.scope = '*';

        let request = new Request(req);
        let response = new Response(res);

        let token = await oauth.token(request, response, {});
        res.locals.token = token.accessToken;

        next();
    }
    catch (err) {

        let {code, message} = err;
        res.locals.error = {code, message};

        next();
    }

/*
    try {
        let user = await router.database.findOne('user', {email: req.body.email, password: req.body.password});
        res.locals.token.user_id = user._id;//'ZBz7mTBDBoWfUZcw';
        res.locals.redirect = {remote: res.locals.token.redirect};
        }
    catch (err) {
        res.locals.error = err;
        res.locals.error.redirect = `${decodeURIComponent(req.query.from)}?client_id=${req.query.client_id}`;
    }
    next();
*/
});

router.post('/signout', function(req, res, next){
    next();
});

router.all(patterns, router.endHandler());

module.exports = function (name) {
    return router;
};