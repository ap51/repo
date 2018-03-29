let service = __dirname.split(/\/|\\/g);
service = service[service.length - 1];

const utils = require('../../utils');
const database = require('./database/db');

let router = utils.router(service);
const CustomError = require('./error');

const config = require('./config');
const api = require('./api');
api.init({router});

let patterns = config.ui_patterns;
let api_patterns = config.api_patterns;
let endpoints = config.endpoints;

const OAuth2Server = require('oauth2-server');
const Request = OAuth2Server.Request;
const Response = OAuth2Server.Response;

oauth = new OAuth2Server({
    model: require('./model')
});

router.authenticateHandler = function(options) {
    return async function(req, res, next) {
        //if(req.params.name === 'clients' || req.params.name === 'signin') {
        if(options.force || api.secured(req, res)) {
            try {
                let request = new Request(req);
                let response = new Response(res);

                options.scope = req.path;
                let token = await oauth.authenticate(request, response, options);
                //req.locals.token = token;

/*
                let granted = endpoints.access(options.endpoint, req.params, token.user.group);
                if(!!!granted) {
                    throw new OAuth2Server.InsufficientScopeError('Access denied.');
                }
                else {
                    //console.log(granted);
                    res.locals.unit = granted;
                }
*/
            }
            catch (err) {

                let {code, message} = err;
                res.locals.error = {code, message};

                if (code === 401 && req.token) {
                    req.token.access = void 0;
                    req.token.auth = void 0;
                }

            }
        }

        next && next();
    }
};

let authorizeOptions = {
    authenticateHandler: {
        handle: async function(req, res) {
            let user = void 0;

            try {
                let token = await database.findOne('token', {accessToken: req.token.access});
                user = await database.findOne('user', {_id: token.user._id});
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

router.tokenHandler = function(options) {
    return async function(req, res, next) {
        try {
            let request = new Request(req);
            let response = new Response(res);

            let token = await oauth.token(request, response, options);
            req.user = token.user;

            req.token.access = token.accessToken;

            req.token.auth = {
                name: token.user.name,
                //group: token.user.group
            }

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

router.accessHandler = function(options) {
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

router.all(config.patterns, router.authenticateHandler({allowBearerTokensInQueryString: true}), router.accessHandler(), async function (req, res, next) {
    let data = void 0;

    if(!res.locals.error) {

        router.components = router.components || {};
        router.components[req.params.name] = req.params;

        let action = api.action(req, res);

        //console.log('ACTION:', req.params);

        try {
            data = await action(req, res);
        }
        catch (err) {
            let {code, message} = err;
            code = code || 404;
            res.locals.error = {code, message};
        }
    }

    switch (req.params.section) {
        case 'ui':
                if(res.locals.error) {
                    switch(res.locals.error.code) {
                        case 403:
                            res.locals.params = {name: 'access-denied'};
                            break;
                        case 401:
                            res.locals.params = {name: 'unauthenticate'};
                            break;
                    }

                    res.locals.error = void 0;
                }
                next();
            break;
        case 'ui_api':
                if(res.locals.error && [401, 403].indexOf(res.locals.error.code) === -1) {
                     res.status(res.locals.error.code).send(res.locals.error.message);
                    //res.status(res.locals.error.code).send(res.locals.error.message);
                }
                else {
                    try {
                        let auth = req.token.auth;
                        req._token[router.service] = req.token;
                        let token = await router.encode(req._token);
                        let shared = res.locals.shared;

                        let response = {api: 'v1', ...data};

                        let entities = {...api.entities(response), method: req.method, token, auth, shared};

                        res.status(222).json(entities);
                    }
                    catch(err) {
                        res.status(err.code || 406).send(err.message);
                    }
                }
                return res.end();
            break;
        case 'api':
                if(res.locals.error) {
                    res.status(res.locals.error.code).send(res.locals.error.message)
                }
                else {
                    try {
                        res.status(222).json(data);
                    }
                    catch(err) {
                        res.status(err.code).send(err.message);
                    }
                }
                return res.end();
            break;
        default:
            res.status(404);
            res.end();
            break;
    }

});

/*router.all(endpoints.patterns('api'), router.authenticateHandler({endpoint:'api', allowBearerTokensInQueryString: true}), router.accessHandler({endpoint:'api'}), async function (req, res, next) {
    if(res.locals.error) {
        res.status(res.locals.error.code).send(res.locals.error.message)
    }
    else {
        let action = endpoints.action('api', req.params, res.locals.unit);
        try {
            let response = {api: 'v1', ...await action(res.locals.token, req.body)};

            let entities = {...endpoints.entities(response), method: req.method};

            res.status(222).json(entities);
        }
        catch(err) {
            res.status(err.code).send(err.message);
        }
    }
    return res.end();
});

router.all(endpoints.patterns('ui'), router.authenticateHandler({endpoint:'ui'}), function (req, res, next) {
    if(res.locals.error) {
        switch(res.locals.error.code) {
            case 403: 
                res.locals.params = {name: 'access-denied'};
                break;
            case 401: 
                res.locals.params = {name: 'unauthenticate'};
                break;
        }

        res.locals.error = void 0;
    }
    next();
});*/

/* 
router.all(api_patterns, router.authenticateHandler({allowBearerTokensInQueryString: true}), function (req, res, next) {
    res.locals.error ? res.status(res.locals.error.code).send(res.locals.error.message) : res.status(222).json({api: 'v.1.0', request: req.params});
    return res.end();
});

router.all(['/ui/profile', '/ui/clients'], router.authenticateHandler({allowBearerTokensInQueryString: true}), function (req, res, next) {
    if(res.locals.error && res.locals.error.code === 401) {
        //res.redirect_local = 'unauthenticate';
        res.locals.params = {name: 'unauthenticate'};
        res.locals.error = void 0;
    }
    next();
});
 */
router.all(patterns, router.beginHandler());

//router.all(patterns, authenticateHandler());

router.all(patterns, function(req, res, next) {
    //console.log(req.params);
    next();
});

router.post('/oauthorize', authorizeHandler(authorizeOptions));

router.post('/otoken', router.tokenHandler());

router.post('/grant', function(req, res, next){
    next();
});

router.all(patterns, router.endHandler());

module.exports = function (name) {
    return router;
};