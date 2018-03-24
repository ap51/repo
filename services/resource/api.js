'use strict';

const database = require('./database/db');
const normalizer = require('normalizr');

const CustomError = require('./error');

let router = void 0;

let init = function (options) {
    router = options.router;
};

let actions = {
    ui: {
        signin: {
            default: function (req, res) {
                res.locals.data = {
                    email: 'ap@gmail.com',
                    password: '123'
                };

                return {};
            }
        },
        layout: {
            default: function (req, res) {
                res.locals.shared = {
                        layout_tabs: [
                            {
                                name: 'about',
                                icon: 'far fa-question-circle'
                            },
                            {
                                name: 'profile',
                                icon: 'fas fa-user-circle'
                            },
                            {
                                name: 'find phone',
                                to: 'find-phone',
                                icon: 'fas fa-mobile'
                            },
                            {
                                name: 'phones db',
                                to: 'phones',
                                icon: 'fas fa-database'
                            }
                        ]
                    };

                    if(req.user && req.user.group === 'admins') {
                        res.locals.shared.layout_tabs = [...res.locals.shared.layout_tabs, ...[
                            {
                                name: 'clients',
                                icon: 'fas fa-users'
                            },
                            {
                                name: 'users',
                                icon: 'fas fa-users'
                            }]
                        ]
                    }


                res.locals.data = {
                    title: router.service,
                    icon: 'fab fa-empire',
                    signin: false
                };

                return {};
            }
        }
    },
    ui_api: {
        signup: {
            submit: async function (req, res) {
                try {
                    let data = req.body;

                    if(!data.password) {
                        throw new CustomError(406, 'Not allowed empty password.');
                    }

                    let user = await database.find('user', {email: data.email}, {allow_empty: true});

                    if(user && user.length) {
                        throw new this.error(406, 'Choose another email/password.');
                    }

                    data.group = 'users';

                    let updates = await database.update('user', {_id: data.id}, data);
                }
                catch (err) {
                    debugger;
                    let {code, message} = err;
                    res.locals.error = {code, message};
                }
            }
        },
        signin: {
            submit: async function (req, res) {
                try {
                    req.body.username = req.body.email;

                    await router.authenticateHandler({force: true})(req, res);
                    if (res.locals.error) {
                        res.locals.error = void 0;

                        let {client_id, client_secret, scope} = await database.findOne('client', {client_id: 'authentificate'});

                        req.body.client_id = client_id;
                        req.body.client_secret = client_secret;
                        req.body.grant_type = 'password';
                        req.body.scope = scope.join(',');

                        await router.tokenHandler({})(req, res);

                        return {auth: req.token.auth};
                    }
                }
                catch (err) {
                    let {code, message} = err;
                    res.locals.error = {code, message};
                }

            }
        },
        signout: {
            submit: async function (req, res) {
                try {
                    //debugger
                    await database.remove('token', {accessToken: req.token.access});

                    req.token.user = void 0;
                    req.token.access = void 0;
                    req.token.auth = {};
                }
                catch (err) {
                    let {code, message} = err;
                    res.locals.error = {code, message};
                }
            }
        },
        profile:{
            get: function (req, res) {
                return {profile: {id: 'current', text: `ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ ${req.user && req.user.name}`}};
            }
        },
        phones: {
            get: async function (token) {
                return {
                    user: [{
                        id: 'current',
                        phones: actions.api.phones.get(token)
                    }]
                };
            },
            save: async function (token, data) {
                if (data.number === '00000000000') {
                    throw new CustomError(406, 'Not allowed phone number.');
                }
                else {
                    let updates = actions.api.phones.save(token, data);
                    return {user: [{id: 'current', phones: updates}]};
                }
            },
            remove: async function (token, data) {

                data = Array.isArray(data) ? data : [data];

                let ids = data.map(phone => phone.id);

                let updates = actions.api.phones.remove(token, data);
                return {user: [{id: 'current', phones: data}]};
            },
        },
        'clients.get': async function () {
            return {client: await database.find('client', {})};
        },
        'signin.submit': async function () {
            return {};
        },
        'signout.submit': async function () {
            return {};
        },
        'signup.submit': async function () {
            return {};
        },
        'layout.data': async function () {
            return {};
        },
        'layout.shared': async function () {
            return {};
        },
    },
    api: {
        profile: {
            public: async function () {
                return {};
            },
        },
        phones: {
            get: async function (token) {
                return await database.find('phone', {user: token.user.id}, {allow_empty: true});
            },
            save: async function (token, data) {
                data.user = token.user.id;

                return await database.update('phone', {_id: data.id}, data);
            },
            remove: async function (token, data) {
                data = Array.isArray(data) ? data : [data];

                let ids = data.map(phone => phone.id);

                return await database.remove('phone', {_id: {$in: ids}}, data);
            },
        }
    }
};

let scopes = {
    site: {
        name: 'Web site user interface',
        public: false
    },
    //api: 'Application programming interface',
    phones: {
        name: 'Phones API',
        public: true
    },
    profile: {
        name: 'Profile read only access',
        public: true
    }
};

//просмотр сверху до первого совпадения!!!
let matrix = [
    {
        scopes: ['site'],
        actions: {
            ui: ['about']
        },
        access: ['users']
    },
    {
        scopes: ['site'],
        actions: {
            ui: ['clients', 'users', 'clients.get'],
        },
        access: ['admins']
    },
    {
        scopes: ['site'],
        actions: {
            ui: ['profile', 'phones', 'profile.get', 'phones.*']
        },
        access: ['*']
    },
    {
        scopes: ['site'],
        actions: {
            ui: ['*'],
            ui_api: ['*']
        },
    },
    {
        scopes: ['phones'],
        actions: {
            api: ['phones.*']
        },
        access: ['*']
    },
    {
        scopes: ['profile'],
        actions: {
            api: ['profile.public']
        },
        access: ['*']
    },
];

let secured = function (req, res) {
    let {section, name, action} = req.params;

    let sections = [];
    for(let section in actions) {
        sections.push(section);
    }

    let access = matrix.map(function (unit) {
        let actions = [];
        for(let section in unit.actions) {
            actions = [...actions, ...unit.actions[section].map(actions => `${section}.${actions}`)];
        }

        let result = {...unit, actions};
        return result;
    });


    let value = `${section}.${name}${action ? '.' + action : ''}`;

    let auth = access.some(function (unit) {

        let matched = unit.actions.some(function (action) {
            let expression = action.replace(/\./gi, '\\.').replace(/\*/gi, '.*').replace(/\+/gi, '.+');
            let regexp = new RegExp(expression, 'gi');

            return regexp.test(value);
        });

        return matched && unit.access && unit.access.length;
    });

    return auth;
};

let access = function (req, res, access_group) {
    let {section, name, action} = req.params;

    let sections = [];
    for(let section in actions) {
        sections.push(section);
    }

    let access = matrix.map(function (unit) {
        let actions = [];
        for(let section in unit.actions) {
            if(sections.indexOf(section) !== -1)
                actions = [...actions, ...unit.actions[section].map(actions => `${section}.${actions}`)];
        }

        let result = {...unit, actions};
        return result;
    });


    let value = `${section}.${name}${action ? '.' + action : ''}`;

    let grants = access.filter(function (unit) {

        let matched = unit.actions.some(function (action) {
            let expression = action.replace(/\./gi, '\\.').replace(/\*/gi, '.*').replace(/\+/gi, '.+');
            let regexp = new RegExp(expression, 'gi');

            return regexp.test(value)
        });

        //return (matched  && unit.access && unit.access.length && unit.access.some(group => group === '*' || group === access_group)) || matched;
        return matched && unit.access && unit.access.length;
    });

    //console.log(grants)

    let granted = grants.some(unit => {
        return unit.access.some(group => group === '*' || group === access_group);
    });

    return granted || grants.length === 0;
};

let action = function (req, res) {
    let {section, name, action} = req.params;

    let notFound = function (req, res) {
        //throw new CustomError(404, 'Action not found');
        return {};
    };

    return action ? actions[section][name] ? actions[section][name][action] ? actions[section][name][action] : notFound : notFound : actions[section][name] ? actions[section][name].default : notFound;
};

let entities = function (data) {
    let schema = normalizer.schema;

    const _action = new schema.Entity('action', {});

    const _profile = new schema.Entity('profile', {});

    const _phone = new schema.Entity('phone', {});

    const _user = new schema.Entity('user', {
        phones: [ _phone ]
    });

    const _client = new schema.Entity('client', {}, {
        //idAttribute: '_id' // to use not standard ID
    });

    const db = new schema.Entity('database', {
        action: _action,
        clients: [ _client ],
        users: [ _user ],
        profile: _profile
    }, {
        idAttribute: 'api'
    });

    let normalized = normalizer.normalize(data, db);
    normalized = {...normalized, entry: 'database'};

    return normalized;
};

module.exports = {
    init,
    secured,
    access,
    action,
    entities
};