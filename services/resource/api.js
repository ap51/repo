'use strict';

const database = require('./database/db');
const normalizer = require('normalizr');
const merge = require('deepmerge');
const JSON5 = require('json5');
const crypto = require('crypto');
const randomBytes = require('bluebird').promisify(crypto.randomBytes);

let generateRandomToken = async function(bytes) {
    const buffer = await randomBytes(bytes || 24);
    const password = buffer.toString('base64');
    return password;
/*
    return randomBytes(bytes || 256).then(function(buffer) {
        return crypto
            .createHash('sha1')
            .update(buffer)
            .digest('hex');
    });
*/
};

const CustomError = require('./error');

let router = void 0;

let init = function (options) {
    router = options.router;
};

let updateDefaults = function (req, res) {
    let shared = {};
    for(let name in router.components) {

        if(actions.ui[name] && actions.ui[name].default) {
            actions.ui[name].default(req, res);

            Object.assign(shared, merge(shared, res.locals.shared || {}, {
                arrayMerge: function (destinationArray, sourceArray, options) {

                    let convert = function (item) {
                        typeof item === 'object' && (item = JSON5.stringify(item));
                        return item;
                    };

                    let destination = destinationArray.map(convert);

                    let source = sourceArray.map(convert);

                    let a = new Set(destination);
                    let b = new Set(source);
                    let union = Array.from(new Set([...a, ...b]));

                    union = union.map(item => JSON5.parse(item));

                    return union;
                }
            }));

            res.locals.shared = shared;
        }
    }
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
                        ]
                    };

                    if(req.user && req.user.group !== 'developers') {
                        res.locals.shared.layout_tabs = [...res.locals.shared.layout_tabs, ...[
                            {
                                name: 'phones db',
                                to: 'phones',
                                icon: 'fas fa-database'
                            }]
                        ]
                    }

                    if(req.user && req.user.group === 'admins') {
                        res.locals.shared.layout_tabs = [...res.locals.shared.layout_tabs, ...[
                            {
                                name: 'clients',
                                icon: 'fas fa-cogs'
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
                let data = req.body;

                if(!data.password) {
                    throw new CustomError(406, 'Not allowed empty password.');
                }

                let user = await database.find('user', {email: data.email}, {allow_empty: true});

                if(user && user.length) {
                    throw new CustomError(406, 'Choose another email/password.');
                }

                data.group = 'users';

                let updates = await database.update('user', {_id: data.id}, data);
                return {};
            }
        },
        signin: {
            submit: async function (req, res) {

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

                    !res.locals.error && updateDefaults(req, res);

                    return {auth: req.token.auth};
                }
            }
        },
        signout: {
            submit: async function (req, res) {
                await database.remove('token', {accessToken: req.token.access});

                req.token.user = void 0;
                req.token.access = void 0;
                req.token.auth = {};
                req.user = void 0;

                updateDefaults(req, res);

                return {};
            }
        },
        profile:{
            get: async function (req, res) {
                let {password, id, _id, ...clean} = await actions.api.profile.get(req, res);
                clean.id = 'current';
                //return {profile: {id: 'current', text: `ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ ${req.user && req.user.name}`}};
                return {profile: clean};
            }
        },
        users: {
            get: async function (req, res) {
                return {
                    users: await actions.api.users.get(req, res)
                };
            },
            remove: async function (req, res) {
                let removed = await actions.api.users.remove(req, res);
                return {users: removed};
            },
            save: async function (req, res) {
                let data = req.body;

                let user = await database.findOne('user', {email: data.email}, {allow_empty: true});

                if(user && user.id !== data.id) {
                    throw new CustomError(406, 'Choose another email/password.');
                }

                let updates = await actions.api.users.save(req, res);
                return {users: updates};
            },
        },
        phones: {
            get: async function (req, res) {
                return {
                    user: {
                        id: 'current',
                        phones: await actions.api.phones.get(req, res)
                    }
                };
            },
            save: async function (req, res) {
                let data = req.body;

                if (data.number === '00000000000') {
                    throw new CustomError(406, 'Not allowed phone number.');
                }
                else {
                    let updates = await actions.api.phones.save(req, res);
                    return {user: {id: 'current', phones: updates}};
                }
            },
            remove: async function (req, res) {

                let removed = await actions.api.phones.remove(req, res);
                return {user: {id: 'current', phones: removed}};
            },
        },
        clients: {
            get: async function (req, res) {
                let scopes_array = [];
                for(let name in scopes) {
                    scopes[name].public && scopes_array.push(scopes[name]);
                }

                return {
                    clients: await actions.api.clients.get(req, res),
                    scopes: scopes_array
                };
            },
            remove: async function (req, res) {
                let removed = await actions.api.clients.remove(req, res);
                return {clients: removed};
            },
            save: async function (req, res) {
                let data = req.body;

                if(!data.scope.length) {
                    throw new CustomError(406, 'Choose at least one scope to continue.');
                }

                if(!data.id) {
                    data.client_id = await generateRandomToken(12);
                    data.client_secret = await generateRandomToken(24);
                }

                let updates = await actions.api.clients.save(req, res);
                return {clients: updates};
            },
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
            get: async function (req, res) {
                return await database.findOne('user', {_id: req.user._id});
            },
            public: async function () {
                return {};
            },
        },
        users: {
            get: async function (req, res) {
                return await database.find('user', {}, {allow_empty: true});
            },
            remove: async function (req, res) {
                let data = req.body;
                data = Array.isArray(data) ? data : [data];

                let ids = data.map(user => user.id);

                await database.remove('user', {_id: {$in: ids}});
                return ids;
            },
            save: async function (req, res) {
                let data = req.body;

                return await database.update('user', {_id: data.id}, data);
            },
        },
        clients: {
            get: async function (req, res) {
                return await database.find('client', {}, {allow_empty: true});
            },
            remove: async function (req, res) {
                let data = req.body;
                data = Array.isArray(data) ? data : [data];

                if(data.some(client => client.trusted)) {
                    throw new CustomError(406, 'It\'s now forbidden to remove trusted clients.');
                }

                let ids = data.map(client => client.id);

                await database.remove('client', {_id: {$in: ids}});
                return ids;
            },
            save: async function (req, res) {
                let data = req.body;

                return await database.update('client', {_id: data.id}, data);
            },
        },
        phones: {
            get: async function (req, res) {
                return await database.find('phone', {user: req.user._id}, {allow_empty: true});
            },
            save: async function (req, res) {
                let data = req.body;

                data.user = req.user._id;

                return await database.update('phone', {_id: data.id}, data);
            },
            remove: async function (req, res) {
                let data = req.body;
                data = Array.isArray(data) ? data : [data];

                let ids = data.map(phone => phone.id);

                await database.remove('phone', {_id: {$in: ids}});
                return ids;
            },
        }
    }
};

let scopes = {
    site: {
        id: 'site',
        name: 'Web site user interface',
        description: 'this.object.scope',
        public: false
    },
    //api: 'Application programming interface',
    phones: {
        id: 'phones',
        name: 'Phones API',
        description: 'PAPI',
        public: true
    },
    profile: {
        id: 'profile',
        name: 'Profile read only access',
        description: 'PROA',
        public: true
    },
/*
    site1: {
        id: 11,
        name: 'Web site user interface',
        description: 'WSUI',
        public: false
    },
    //api: 'Application programming interface',
    phones1: {
        id: 21,
        name: 'Phones API',
        description: 'PAPI',
        public: true
    },
    profile1: {
        id: 31,
        name: 'Profile read only access',
        description: 'PROA',
        public: true
    }
*/
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
            ui: ['clients', 'users'],
            ui_api: ['clients.*', 'users.*']
        },
        access: ['admins']
    },
    {
        scopes: ['site'],
        actions: {
            ui: ['profile'],
            ui_api: ['profile.get']
        },
        access: ['*']
    },
    {
        scopes: ['site'],
        actions: {
            ui: ['phones'],
            ui_api: ['phones.*']
        },
        access: ['users', 'admins']
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
        return unit.access.some(group => (req.user && group === '*') || group === access_group);
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
        phones: [ _phone ],
    });

    const _scope = new schema.Entity('scope', {});

    const _client = new schema.Entity('client', {
        users: [ _user ],
        scopes: [ _scope ]
    }, {
        //idAttribute: '_id' // to use not standard ID
    });

    _user.define({applications: [ _client ]});

    const db = new schema.Entity('database', {
        action: _action,
        clients: [ _client ],
        user: _user,
        users: [ _user ],
        profile: _profile,
        scopes: [ _scope ]
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