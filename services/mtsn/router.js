'use strict';

let service = __dirname.split(/\/|\\/g);
service = service[service.length - 1];

const utils = require('../../utils');
const database = require('./database/db');

let router = utils.router(service);
const CustomError = require('./error');

const config = require('./config');
//api.init({router, database});

let patterns = config.ui_patterns;
let api_patterns = config.api_patterns;
let endpoints = config.endpoints;

const OAuth2Server = require('oauth2-server');
const Request = OAuth2Server.Request;
const Response = OAuth2Server.Response;

let oauth = new OAuth2Server({
    model: require('./model')
});

let authenticateHandler = function(options) {
    return async function(req, res, next) {
        let request = new Request(req);
        let response = new Response(res);

        //options.scope = req.path;
        options.scope = true;
        let token = await oauth.authenticate(request, response, options);
        return token;
    
        next && next();
    }
};

let authorizeOptions = {
    authenticateHandler: {
        handle: async function(req, res) {
            let user = void 0;

            try {
                let token = await database.findOne('token', {accessToken: req.token.access});
                user = await database.findOne('user', {_id: token.user.id});
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
                //response.locals.token.code = code.authorizationCode;
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

let tokenHandler = function(options) {
    return async function(req, res, next) {
        let request = new Request(req);
        let response = new Response(res);

        let token = await oauth.token(request, response, options);

        return token;

        next && next();
    }
};

let accessHandler = function(options) {
    return async function(req, res, next) {
        try {
            //res.locals.token = token;
            let access_group = (req.user && req.user.group);

            let granted = api.access(req, res, access_group);

            if (!!!granted && req.user) {
                throw new CustomError(403, 'Access denied.');
            }

            if (!!!granted && !req.user) {
                throw new CustomError(401, 'Unauthenticate.');
            }
        }
        catch (err) {
            let {code, message} = err;
            res.locals.error = {code, message};
        }

        next && next();
    }
};

router.onComponentData = async function(req, res, response, data) {

    return data;
};

router.all('*', router.jwtHandler());

router.all(['/files/*/:file', '/files/:file'], function(req, res, next) {
    if(req.user) {

        let options = {
            root: __dirname + `/public/${req.user._id}`,
            dotfiles: 'deny',
/*             headers: {
                'x-timestamp': Date.now(),
                'x-sent': true
            }
 */
        };
        
        req.params.path = req.params[0] ? `${req.params[0]}/${req.params.file}` : req.params.file;

        console.log('IMAGE:', options.root, req.params.path);
        let fileName = req.params.path;
        res.sendFile(fileName, options, function (err) {
            if (err) {
                next(err);
            }
            else {
                console.log('Sent:', fileName);
                res.end();
            }
        });

        //console.log(req.params);
        //res.end();
    }
    else res.status(404).end('Not found.');
});

let onSocket = function (socket) {
    router.sockets = sockets;
};

module.exports = {
    router,
    tokenHandler,
    authenticateHandler,
    service,
    onSocket
};

let accessMiddleware = function(options) {
    const api = require('./api');

    return async function(req, res, next) {
        let response = await api.accessGranted(req, res, router);

        res.locals.response = response;

        response && next();
    };
};

router.all(config.patterns, function (req, res, next) {
    next(); //to utils endHandler
});

router.all(config.patterns, accessMiddleware({}), async function (req, res, next) {
    next(); //to utils endHandler
});

router.all(config.patterns, router.endHandler());
