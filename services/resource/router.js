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
        if (router.api.check(req)) {
            try {
                //res.locals.user = await database.findOne('user', {_id: res.locals.token.user_id});
                //res.locals.user = await router.database.findOne('user', {_id: res.locals.token.user_id});

                let request = new Request(req);
                let response = new Response(res);

                let token = await oauth.authenticate(request, response, options);
                res.locals.data = {token};

                next();
            }
            catch (err) {

                let {code, message} = err;
                res.locals.error = {code, message};

                //code === 404 && (res.locals.redirect = {remote: `https://localhost:5000/resource/external-signin`});

                next();
            }
        }
        else next();
    }
}

let authorizeOptions = {
    authenticateHandler: {
        handle: async function(request, response) {
            let user = void 0;

            if(response.locals.token.user_id) {
                try {
                    user = await router.database.findOne('user', {_id: response.locals.token.user_id});
                }
                catch (err) {
                    response.locals.redirect = {remote: 'https://localhost:5000/resource/external-signin'}
                }
            }
            else {
                response.locals.redirect = {remote: 'https://localhost:5000/resource/external-signin'};
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
            if(!response.token.user_id)
                data.tabs = [data.tabs[0]];
            break;
    }

    return data;
};

router.all(patterns, router.beginHandler());

router.all(patterns, authenticateHandler());

router.all(patterns, function(req, res, next) {
    console.log(req.params);
    next();
});

router.post('/oauthorize', authorizeHandler(authorizeOptions));

router.post('/otoken', tokenHandler());

router.post('/grant', function(req, res, next){
    next();
});

router.post('/signin', async function(req, res, next){
    console.log('SIGNIN');
    //next();
    //router.jwt
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
});

router.post('/signout', function(req, res, next){
    next();
});

router.all(patterns, router.endHandler());

module.exports = function (name) {
    return router;
};