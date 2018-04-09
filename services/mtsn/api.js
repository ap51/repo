'use strict';

const database = require('./database/db');
const cheerio = require('cheerio');
const loadContent = require('./../../utils').loadContent;
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

let generateRandomID = async function(bytes) {
        return randomBytes(bytes || 24).then(function(buffer) {
            return crypto
                .createHash('sha1')
                .update(buffer)
                .digest('hex');
        });
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

                    union = union.map(item => {
                        try {
                            return JSON5.parse(item)
                        }
                        catch (err) {
                            return item;
                        }
                    });

                    return union;
                }
            }));

            res.locals.shared = shared;
        }
    }
};

let parseRoute = function (path) {
    path = path.split('/').pop();

    let [route, action] = path.split('.');
    let [name, id] = route.split(':');

    return {
        name,
        id,
        action,
        ident: route,
        url: `${name}${id ? ':' + id : ''}${action ? '.' + action : ''}`,
        component: `${name}${id ? '_' + id : ''}`
    };
};

let actions = {
    ui: {
        public: {
            default(req, res) {
                let location = req.headers['location'] ? parseRoute(req.headers['location']) : void 0;

                let id = `${location.id ? ':' + location.id : ''}`;

                res.locals.data = {
                    tabs: [
                        {
                            name: 'feed',
                            to: 'feed' + id,
                            icon: 'fas fa-newspaper'
                        },
                    ]
                };

                if((req.user && req.user.public_id === req.params.id) || (req.user && !req.params.id)) {
                    res.locals.data.tabs = [...res.locals.data.tabs, ...[
                            {
                                name: 'friends',
                                to: 'friends' + id,
                                icon: 'fas fa-users'
                            },
                            {
                                name: 'charts',
                                to: 'charts' + id,
                                icon: 'far fa-comments'
                            },
                            {
                                name: 'profile',
                                to: 'profile' + id,
                                icon: 'far fa-address-card'
                            },
                            {
                                name: 'search',
                                to: 'search' + id,
                                icon: 'fas fa-search'
                            },
                            {
                                name: 'phones',
                                to: 'phones' + id,
                                icon: 'fas fa-mobile'
                            },
                            {
                                name: 'applications',
                                to: 'applications' + id,
                                icon: 'fas fa-cogs'
                            },
                        ]
                    ]
                }

                
            }
        },
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

                let location = req.headers['location'] ? parseRoute(req.headers['location']) : void 0;

                res.locals.shared = {
                    layout_tabs: [
                            {
                                name: 'about',
                                icon: 'far fa-question-circle'
                            },
/*
                            {
                                name: 'profile',
                                icon: 'fas fa-user-circle'
                            },
*/
                        ]
                    };

                    if(req.user) {
                        res.locals.shared.layout_tabs = [...res.locals.shared.layout_tabs, ...[
                                {
                                    name: 'public',
                                    to: 'feed:' + req.user.public_id,
                                    icon: 'far fa-address-card',
                                    dynamic: true
                                },
                            ]
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

                let replacements = {
                    names: ['feed', 'friends', 'charts', 'profile', 'search', 'phones', 'applications'],
                    location: `public` //for all ids, replace on client
                };

                Object.assign(res.locals.shared, {replacements});

                if(location && ['feed', 'friends', 'charts', 'profile', 'search', 'phones', 'applications'].indexOf(location.name) !== -1) {
                    Object.assign(res.locals.shared, {location: `public`});
                    //Object.assign(res.locals.shared, {location: `public${location.id ? `:${location.id}` : ''}`});
                }

                return {};
            }
        }
    },

    ui_api: {
        layout: {
            async get(req, res) {
                if(req.user) {
                    let {password, id, _id, group, ...clean} = await database.findOne('user', {_id: req.user._id});
                    clean.id = 'current';

                    return {user: clean, ...await actions.ui_api.profile.get(req, res)};
                }
                return {user: {}, profile: {}};
            }
        },
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

                    let {client_id, client_secret, scope} = await database.findOne('client', {client_id: 'authenticate'});

                    req.body.client_id = client_id;
                    req.body.client_secret = client_secret;
                    req.body.grant_type = 'password';
                    req.body.scope = scope.join(',');

                    await router.tokenHandler({})(req, res);

                    !res.locals.error && updateDefaults(req, res);

                    return {auth: req.token.auth, ...await actions.ui_api.layout.get(req, res)};
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
            },
            async save(req, res) {
                let {id, _id, phones, ...clean} = req.body;
                req.body = clean;
                req.body.id = req.user._id;

                let updates = await actions.api.users.save(req, res);
                updates = updates.pop();

                req.token.auth = {
                    name: updates.name,
                    //group: token.user.group
                };


                return await actions.ui_api.layout.get(req, res);
            }
        },
        public: {
            async get(req, res) {
                let profile = await actions.ui_api.profile.get(req, res);
                return profile;
            }
        },
        profile:{
            async get(req, res) {
                let {id, _id, user, updated, created, ...clean} = await actions.api.profile.get(req, res) || {};
                user = await database.findOne('user', {_id: user || req.user._id});

                //clean.id = 'current';
                clean.public_id = clean.public_id || await generateRandomID(10);
                clean.name = user.name;

                //return {profile: {id: 'current', text: `ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ ${req.user && req.user.name}`}};
                return {profile: clean};
            },
            async save(req, res) {
                let data = req.body;

                let profile = await database.findOne('profile', {public_id: data.public_id}, {allow_empty: true});

                if(profile && profile.user !== req.user._id) {
                    throw new CustomError(406, 'Choose another public ID.');
                }

                let updates = await actions.api.profile.save(req, res);
                
                let {public_id} = req.body;
                req.body = {id: req.user._id, public_id};

                let user = await actions.api.users.save(req, res);
                req.user.public_id = public_id;
                //updates = updates.pop();
                //updates.id = 'current';

                updates = await actions.ui_api.profile.get(req, res);

                return updates;
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

                let public_id = await generateRandomID(10);
                req.body.public_id = public_id;

                let users = await actions.api.users.save(req, res);

                req.body = {
                    user: users[0].id,
                    public_id: public_id,
                    status: 'any string'
                };

                let profiles = await actions.api.profile.save(req, res);
                return {users: users};
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
    },

    api: {
        profile: {
            get: async function (req, res) {
                //return await database.findOne('profile', {user: req.user._id}, {allow_empty: true});
                return await database.findOne('profile', {public_id: req.params.id || req.user.public_id}, {allow_empty: true});
            },
            public: async function (req, res) {
                return {};
            },
            async save(req, res) {
                let data = req.body;
                data.user = data.user || req.user._id;

                return await database.update('profile', {user: data.user}, data);
            }
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
                await database.remove('profile', {user: {$in: ids}});
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
        description: 'Access to UI and API of the project site',
        public: false
    },
    //api: 'Application programming interface',
    phones: {
        id: 'phones',
        name: 'Phones API',
        description: 'Allow access to manipulate user phone book',
        public: true
    },
    profile: {
        id: 'profile',
        name: 'Profile public access',
        description: 'Allow access to user profile public information',
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

/*
let element = {
    path: { //ui, api, ...
        element: { //layout, public, ...
            type: 'tab',
            scopes: [],
            access: [],
            methods: {
                'save': {
                    access: [],
                    method() {}
                },
                get() {}
            },
            children: {
                'element': element
            }
        }
    }
};
*/

let flat = function (root, array, parent) {
    array = array || [];

    let __default = root.__default || (root.parent && root.parent.__default) || {};

    let children = root.children;

    for(let name in children) {
        let component = children[name];

        if(name !== '__default') {
            component.name = name;

            Object.assign(component, merge(__default, component, {
                arrayMerge: function (destinationArray, sourceArray, options) {
                    return sourceArray;
                }
            }));

            component.__default = component.__default || __default;

            Object.assign(component.__default, merge(__default, component.__default, {
                arrayMerge: function (destinationArray, sourceArray, options) {
                    return sourceArray;
                }
            }));

            let parent = root;
            component.parent = root;

            component.parents = [];
            while(parent && parent.name) {
                component.parents.push(parent);
                parent = parent.parent;
            }

            array.push(component);
            component.children && (array = flat(component, array));
            children[name] = component;
        }
    }

    return array;
};

let accessMiddleware = function(options) {
    return async function(req, res, next) {
        let response = await accessGranted(req, res, router);
        
        res.locals.response = response;
/*         res.status(response.status).json(response);
        return res.end();
 */
        response && next();
    };
};

let accessGranted = async function (req, res, router) {
    let {section, name, id, action} = req.params; 
    action = action || 'default';
    req.params.action = action;

    let location = parseRoute(req.headers['location']).name || name;


    try {
        !access_matrix[section] && (section = 'ui');

        let component = access_matrix[section] && access_matrix[section].find(item => item.name === name);
        if (component) {
            let {user, client, token} = req;
            let access_group = (user && user.group);

            component.route = parseRoute(req.headers['location'] || req.originalUrl);
            component.user = user;
            component.client = client;
            component.token = token;

            let needAuthentication = !!(component && component.access && component.access.length);

            if (needAuthentication) {

                if (token.access) {
                    let expired = new Date() > new Date(token.access.expired);
                    if (expired) {
                        try {
                            let body = {...req.body};

                            client = await database.findOne('client', {_id: client._id});
                            token = await database.findOne('token', {accessToken: token.access.token}, {allow_empty: true});

                            req.body = {
                                grant_type: 'refresh_token',
                                refresh_token: token.refreshToken,
                                client_id: client.client_id,
                                client_secret: client.client_secret,
                                scope: client.scope.join(',')
                            };

                            req.method = 'POST';
                            req.headers['content-type'] = 'application/x-www-form-urlencoded';
                            req.headers['transfer-encoding'] = 'true';
                            req.headers['content-length'] = 1;

                            token = await router.tokenHandler({})(req, res);

                            let {accessToken, accessTokenExpiresAt, refreshToken, user, client} = token;

                            req.token.access = {
                                token: accessToken,
                                expired: accessTokenExpiresAt,
                                user,
                                client
                            };

                            req.user = user;

                            console.log(token.access.refresh_token);
                        }
                        catch(err) {
                            req.token.access = void 0;
                            throw new CustomError(401, 'Unauthenticate');
                        }
                    }
                }
                else throw new CustomError(401, 'Unauthenticate');
            }

            let checkAccess = function (access) {
                return access.length ? access.some(group => (group === 'current' && user && (user.public_id === req.params.id || !req.params.id)) || (user && group === '*') || (group === access_group)) : true;
            };

            let access = needAuthentication ? checkAccess(component.access) : true;
            if (!access) {
                if (user) {
                    throw new CustomError(403, 'Access denied');
                }
                throw new CustomError(401, 'Unauthenticate');
            }

            let scope = (client && component.scopes) ? component.scopes.some(scope => scope === '*' || (client && client.scope.includes(scope))) : true;
            if (!scope) {
                throw new CustomError(400, 'Insufficient scope');
            }

            if (access && scope) {

                let noop = function () {
                    return {}
                };

                let executeChain = async function (component, action) {
                    component.checkAccess = checkAccess;

                    let data = {};

                    let parent_data = {};

                    let execute = component.methods ? typeof component.methods[action] === 'object' && (component.methods[action].access && component.methods[action].access.length) ? checkAccess(component.methods[action].access) : true : false;
                    if(execute) {
                        let method = component.methods[action] ? typeof component.methods[action] === 'function' ? component.methods[action] : component.methods[action].method || noop : noop;
                        data[component.name] = await method(req, res, component) || {};

                        parent_data = (component.parent && await executeChain(component.parent, action)) || {};
                        Object.assign(data, parent_data);

                        let __execute = data[component.name].__execute || [];
                        __execute = await __execute.reduce(async function(memo, item) {
                            Object.assign(memo, await executeChain(component, item));
                            return memo;
                        }, {});
                        Object.assign(data, __execute);
                    }

                    return data;
                };

                let data = {executed: await executeChain(component, action)};

                data.status = component.methods.__status ? component.methods.__status(req, res) : 221;

                data.location = access_matrix[section].find(item => item.name === location);
                if(!data.location) {
                    throw new CustomError(404, 'Not found');       
                }

                data.location = data.location.parents.length ? data.location.parents.map(item => item.name).reverse().join('.') + '.' + parseRoute(req.headers['location']).component : parseRoute(req.headers['location']).component;

                data = component.methods.__wrapper ? await component.methods.__wrapper(req, res, data) : data;

                let auth = req.user ? {name: req.user.name} : {};
                let response = {...data, auth};

                return response;
            }
        }
        else throw new CustomError(404, 'Not found');
    }
    catch (err) {
        let replace = '';
        switch (err.code) {
            case 400:
                req.params = {name: 'bad-request'};
                break;
            case 401:
                req.params = {name: 'unauthenticate'};
                break;
            case 403:
                req.params = {name: 'access-denied'};
                break;
            case 404:
                req.params = {name: 'not-found'};
                break;
            default:
                req.params = {name: 'unknown-error'};
                break;
        }

        req.params.section = section;
        req.params.action = action;
        return accessGranted(req, res, router);
    }

    console.log(access);
};

let model = function (data) {

/*
    const _action = new schema.Entity('action', {});

    const _profile = new schema.Entity('profile', {}, {
        idAttribute: 'public_id' // to use not standard ID
    });

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
*/

    let schema = normalizer.schema;

    const _profile = new schema.Entity('profile', {}, {
        idAttribute: 'public_id' // to use not standard ID
    });

    const _phone = new schema.Entity('phone', {});

    const _user = new schema.Entity('user', {
        phones: [_phone],
        profile: _profile
    });

    const _scope = new schema.Entity('scope', {});

    const _client = new schema.Entity('client', {
        users: [_user],
        scopes: [_scope]
    });

    _user.define({applications: [_client]});

    const db = new schema.Entity('database', {
        clients: [_client],
        users: [_user],
        scopes: [_scope]
    }, {
        idAttribute: 'api'
    });

    let normalized = normalizer.normalize(data, db);
    normalized = {...normalized, entry: 'database'};

    return normalized;
};

let matrix = {
    ui: {
        __default: {
            scopes: ['site'],
            access: [],
            type: void 0,
            methods: {
                __status(req, res) {
                    return req.params.action === 'default'  ? 221 : 222;
                },
                __checkAccess(req, res, access) {
                    let user = req.user;
                    return (access && access.length) ? access.some(group => (group === 'current' && user && (user.public_id === req.params.id || !req.params.id)) || (user && group === '*') || (user && group === user.group)) : true;
                },
                __typedChildren(req, res, self, type) {
                    let typed_children = [];
                    for(let name in self.children) {
                        let child = self.children[name];
                        child.type === type && self.methods.__checkAccess(req, res, child.access) && typed_children.push(child);
                    }
                    return typed_children;
                },
                __wrapper: async function(req, res, data) {
                    data.__wrapped = true;

                    switch(data.status) {
                        case 221:
                            let name = req.params.name;

                            try {
                                let content = name && await loadContent(name, res, router.service);
        
                                res.$ = cheerio.load(content);
                                data.sfc = res.$.html();
                            }
                            catch (err) {
                                throw new CustomError(404, 'Not found');
                            }
                            break;
                        case 222:
                            let entries = Object.entries(data.executed);
                            let entities = entries.reduce(function (memo, item) {
                                let [key, value] = item;
                                //memo = Object.assign(value, memo);

                                Object.assign(memo, merge(value, memo, {
/*                                     arrayMerge: function (destinationArray, sourceArray, options) {
                                        return sourceArray;
                                    } */
                                }));
                    
                                return memo;
                            }, {});

                            let response = model({api: 'v1', ...entities});
                            let {executed, ...clean} = data;
                            data = {...clean, ...response};
                            break;
                        case 223:
                            break;
                        default:
                            break;
                    }

                    return data;
                },
                __tabs(req, res, self) {
                    let getTo = function (component) {
                        return typeof component.to === 'function' ? component.to(req, res, component) : component.to || component.name;
                    };

                    let tabs = self.methods.__typedChildren(req, res, self, 'tab');
                    tabs = tabs.map(child => {
                        return {
                            name: child.name,
                            to: getTo(child), //`${child.to === '__child__' ? child.methods.__tabs(req, res, child)[0].to : child.to || child.name}${req.params.id ? ':' + req.params.id : ''}`,
                            icon: child.icon
                        }
                    });

                    return tabs;
                },
                default() {
                    return {
                        service: router.service
                    }
                }

            },
        },
        children: {
            'bad-request': {},
            'unauthenticate': {},
            'access-denied': {},
            'not-found': {},
            'unknown-error': {},

            layout: {
                scopes: ['site'],
                access: [],
                methods: {
                    'default': {
                        access: [],
                        method(req, res, self) {
                            //console.log(self);

                            let tabs = self.methods.__tabs(req, res, self);
                            tabs.push({
                                name: '',
                                icon: 'fas fa-chevron-right',
                                invisible: true,
                                active: true
                            });

                            return {
                                //service: 'NO SERVICE',
                                title: router.service,
                                icon: 'fab fa-empire',
                                signin: false,
                                tabs
                            };
                        }
                    },
                    async get(req, res, self) {
                        if(req.user) {
                            let {public_id, _id, group, ...current} = req.user;
                            let {user, ...profile} = await database.findOne('profile', {user: req.user._id});

                            return {
                                users: [
                                    {
                                        ...current,
                                        id: 'current',
                                        profile
                                    }
                                ]
                            }
                        }
                    }
                },
                __default: {
                    access: [],
                },
                children: {
                    'loading': {},
                    'dialog-signin': {
                        methods: {
                        },
                    },
                    'signin': {
                        methods: {
                            __status(req, res) {
                                return req.params.action === 'default'  ? 221 : 223;
                            },
                            default() {
                                return {
                                    email: 'ap@gmail.com',
                                    password: '123'
                                }
                            },
                            async submit(req, res) {

                                try {
                                    //await router.authenticateHandler({force: true})(req, res);
                                    let {client_id, client_secret, scope} = await database.findOne('client', {client_id: 'authenticate'});
                
                                    req.body.username = req.body.email;
                                    req.body.client_id = client_id;
                                    req.body.client_secret = client_secret;
                                    req.body.grant_type = 'password';
                                    req.body.scope = scope.join(',');
                
                                    let token = await router.tokenHandler({})(req, res);

                                    let {accessToken, accessTokenExpiresAt, refreshToken, user, client} = token;
                                    req.token.access = {
                                        token: accessToken,
                                        expired: accessTokenExpiresAt,
                                        user,
                                        client
                                    };

                                    req.user = user;

                                    return {
                                        __execute: ['default']
                                    };
                                }
                                catch(err) {
                                    res.status(err.code).end(err.message);
                                }
                            }
                        },
                    },
                    'signout': {
                        methods: {
                            __status(req, res) {
                                return req.params.action === 'default'  ? 221 : 223;
                            },
                            async submit(req, res) {
                                await database.remove('token', {accessToken: req.token.access.token}, {allow_empty: true});

                                req.token.access = void 0;
                                req.user = void 0;

                                return {
                                    __execute: ['default']
                                };
                            }
                        },
                    },
                    'signup': {
                        methods: {},
                    },
                    'about': {
                        type: 'tab',
                        icon: 'far fa-question-circle',
                        methods: {
                            'default': {
                                access: ['users', 'developers', 'admins'],
                                method(req, res, self) {
                                    return self.name;
                                }
                            },
                            get() {
                                return {someData: 'hello'}
                            }
                        },
                    },
                    'news': {
                        type: 'tab',
                        access: ['*'],
                        methods: {
                            get() {

                            },
                            'save': {
                                access: ['admins'],
                                method() {

                                }
                            },
                            'remove': {
                                access: ['admins'],
                                method() {

                                }
                            }
                        }
                    },
                    'feed': {
                        type: 'tab',
                        access: ['*'],
                        to(req, res, self) {
                            return req.user && self.name + ':' + req.user.public_id;
                        },
                        methods: {
                            'save': {
                                access: ['current', 'admins'],
                                method() {

                                }
                            },
                            'remove': {
                                access: ['current', 'admins'],
                                method() {

                                }
                            }
                        },
                    },
                    'search': {
                        type: 'tab',
                        access: [],
                    },
                    'private': {
                        type: 'tab',
                        to: 'friends',
                        icon: 'far fa-address-card',
                        access: ['*'],
                        methods: {
                            default(req, res, self) {
                                return {
                                    tabs: self.methods.__tabs(req, res, self)
                                };    
                            }
                        },
                        __default: {
                            type: 'tab',
                            access: ['current'],
                            methods: {
                                __typeFormat(req, res, self) {
                                    return {
                                        to: self.route.ident
                                    }
                                },
                                get(req, res) {

                                },
                                'save': {
                                    access: ['current'],
                                    method(req, res, self) {
                                        console.log('save:', req.body, self)
                                    }
                                },
                                'remove': {
                                    access: ['current'],
                                    method(req, res, self) {
                                        console.log('save', self)
                                    }
                                }
                            },
                        },
                        children: {
                            'friends': {},
                            'dialogs': {},
                            'profile': {
                                methods: {
                                    async get(req, res, self) {
                                        let pid = req.params.id || (req.user && req.user.public_id);
                                        if(pid) {
                                            let {public_id, _id, group, password, id, created, updated, ...current} = await database.findOne('user', {public_id: pid});
                                            let {user, ...profile} = await database.findOne('profile', {user: id});

                                            return {
                                                users: [
                                                    {
                                                        ...current,
                                                        id: req.params.id ? public_id : 'current',
                                                        profile
                                                    }
                                                ]
                                            }
                                        }
                                    }
                                },
                                access: ['current', 'admins'],
                                children: {
                                    'picture-input': {
                                        //access: [],
                                        methods: {
                                            async get(req, res, self) {
                                                console.log(req.params.id);
                                            }
                                        },
                                    }
                                }
                            },
                            'phones': {
                                collection: 'phone',
                                methods: {
                                    async get() {
                                        let delay = new Promise(function(resolve, reject) {
                                            setTimeout(function() {
                                                resolve({
                                                    users: [
                                                        {
                                                            id: 'current',
                                                            phones: [
                                                                {
                                                                    id: 100,
                                                                    number: 10001019056,
                                                                    owner: 'ancle Bob'
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                });
                                            }, 300000);
                                        })
                                        return await delay;

                                        return {
                                            users: [
                                                {
                                                    id: 'current',
                                                    phones: [
                                                        {
                                                            id: 100,
                                                            number: 10001019056,
                                                            owner: 'ancle Bob'
                                                        }
                                                    ]
                                                }
                                            ]
                                        }            
                                    }
                                },
                                children: {
                                    'phone-dialog': {
                                        access: []
                                    }
                                }
                            },
                            'applications': {},
                            'clients': {
                                type: 'tab',
                                icon: 'fas fa-cogs',
                                access: ['admins'],
                                methods: {},
                                children: {
                                    'client-dialog': {}
                                }
                            },
                            'users': {
                                type: 'tab',
                                icon: 'fas fa-users',
                                access: ['admins'],
                                children: {
                                    'user-dialog': {}
                                }
                            },
                            'scopes': {
                                type: 'tab',
                                access: ['admins'],
                                methods: {},
                            }                        
                        }
                    },

                }
            }
        }
    }
};

let access_matrix = {};
for(let section in matrix) {
    access_matrix[section] = flat(matrix[section]);
}


//просмотр сверху до первого совпадения!!!
let matrix1 = [
    {
        scopes: ['site'],
        actions: {
            ui: ['about']
        },
        access: ['users', 'admins']
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
        access: ['current']
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
        return unit.access.some(group => (req.user && group === '*') || (req.user && req.params.id === req.user.public_id && group === 'current') || (group === access_group) );
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

    const _profile = new schema.Entity('profile', {}, {
        idAttribute: 'public_id' // to use not standard ID
    });

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
    entities,
    //accessGranted,
    accessMiddleware
};