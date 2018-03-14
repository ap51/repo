/*let routes = module.exports;*/
//fill res.locals.entities then normalize it and send to user agent or client app
const axios = require('axios');
const URL = require('url');

let secrets = {};

let apiCall = async function(config, token) {
    let url = '';

    if(typeof config === 'string') {
        url = config;
        config = {url};
    }

    let _config = {
        url,
        transformRequest: function(obj) {
            let str = [];
            for(let key in obj)
                str.push(encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]));
            return str.join("&");
        },
        method: 'get',
        data: {}
    };

    _config = {..._config, ...config};
    _config.headers['Content-Type'] = 'application/x-www-form-urlencoded';

    let apiCall = {};

    try {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        apiCall = await axios(_config);

        return apiCall;
    }
    catch (err) {
        apiCall = {};
        apiCall.error = err;
    }

    return apiCall;
};

let external = [
    {
        '*.*': async function (req, res, router) {
            router.credential = router.credential || await router.database.findOne('credential', {provider: 'tsn'});
            let apiPoint = router.credential.resource_endpoint;

            let token = router.encode(res.locals.token);

            let config = {
                url: `${apiPoint}${req.url}`,
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            };

            let response = await apiCall(config); //перенести токен в конфиг

            response = response.data;
            response.token = router.decode(response.token);

            switch (response.error.code) {
                case 401:
                    response.token.redirect = req.headers.referer;

                    config.url = router.credential.authorize_endpoint;
                    config.method = 'post';
                    config.data = {
                        client_id: router.credential.client_id,
                        response_type: 'code',
                        redirect_uri: router.credential.redirect_uri,
                        scope: router.credential.scope,
                        state: 'some_state'
                    };

                    response = await apiCall(config);

                    response = response.data;
                    response.token = router.decode(response.token);

                    switch (response.error && response.error.code) {
                        case 503:
                            //res.locals.redirect = response.redirect;
                            delete response.error;
                            break;
                        default:
                            config.url = router.credential.token_endpoint;
                            config.headers = {};
                            config.method = 'post';
                            config.data = {
                                client_id: router.credential.client_id,
                                client_secret: router.credential.client_secret,
                                grant_type: router.credential.grant_type,
                                redirect_uri: router.credential.redirect_uri,
                                code: response.token.code,
                                scope: router.credential.scope,
                                state: 'some_state'
                            };

                            response = await apiCall(config);

                            response = response.data;
                            response.token = router.decode(response.token);

                            switch (response.error && response.error.code) {
                                case 503:
                                    //res.locals.redirect = response.redirect;
                                    delete response.error;
                                    break;
                                default:

                                    break;
                            }
                            break;
                    }
                    break;
            }

            return response;
        }
    }
];

let routes = [
    {
        category: 'External',
        public: false,
        name: 'profile',
        actions: external
    },
    {
        category: 'Phones',
        public: false,
        name: 'phones',
        actions: external
    },
    {
        category: 'Phones',
        public: false,
        name: 'phone',
        actions: external
    },
    {
        category: 'Phones',
        public: false,
        name: 'phone-find',
        actions: external
    }
];

module.exports = routes;