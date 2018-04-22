'use strict';

/*
let service = __dirname.split(/\/|\\/g);
service = service[service.length - 1];
*/

const path = require('path');
//const database = require('./database/db');
const cheerio = require('cheerio');
const loadContent = require('./../../utils').loadContent;
const normalizer = require('normalizr');
const merge = require('deepmerge');
const JSON5 = require('json5');
const crypto = require('crypto');
const randomBytes = require('bluebird').promisify(crypto.randomBytes);
const cluster = require('cluster');

let {router, tokenHandler, authenticateHandler, service} = require('./router');

let sockets = {};

const database = require('./database/db');

const generate = require('nanoid/generate');

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

/*
let router = void 0;
let database = void 0;

let init = function (options) {
    router = options.router;
    database = options.database;
};
*/

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
};

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

let accessGranted = async function (req, res, router) {


    let {section, name, id, action} = req.params;
    action = action || 'default';
    req.params.action = action;

    let location = parseRoute(req.headers['location']).name || name;

    try {
        !access_matrix[section] && (section = 'ui');

        let component = access_matrix[section].find(item => item.name === name);
        !access_matrix[section].find(item => item.name === location) && (location = 'not-found'); //сомнительно

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

                            token = await tokenHandler({})(req, res);

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
                    else {
                        //throw new CustomError(406, 'Forbidden');       
                    }

                    return data;
                };

                let data = {executed: await executeChain(component, action)};

                data.status = component.methods.__status ? component.methods.__status(req, res) : 221;

                data.location = access_matrix[section].find(item => item.name === location);
                if(!data.location) {
                    throw new CustomError(404, 'Not found');       
                }
                //console.log('LOCATION', data.location);

                //data.location = data.location.parents.length ? data.location.parents.map(item => item.name).reverse().join('.') + '.' + parseRoute(req.headers['location']).component : parseRoute(req.headers['location']).component;
                data.location = data.location.parents.length ? data.location.parents.map(item => item.name).reverse().join('.') + '.' + component.route.component : component.route.component;
                //data.location = data.location.parents.length ? data.location.parents.map(item => item.name).reverse().join('.') + '.' + parseRoute(location).component : parseRoute(location).component;

                data = component.methods.__wrapper ? await component.methods.__wrapper(req, res, data) : data;

                let auth = req.user ? {name: req.user.name, id: req.user.id, public_id: req.user.public_id} : {};
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
                //req.headers['location'] = 'empty';
                break;
            default:
                req.params = {name: 'unknown-error'};
                res.status(err.code || 400).end(err.message);
                return false;
                break;
        }

        req.params.section = section;
        req.params.action = action;
        return accessGranted(req, res, router);
    }

    //console.log(access);
};

let model = function (data) {

    let schema = normalizer.schema;

    const _profile = new schema.Entity('profile', {}, {
        idAttribute: 'user' // to use not standard ID
    });

    const _phone = new schema.Entity('phone', {});
    const _post = new schema.Entity('post', {});

    const _feed = new schema.Entity('feed', {
        posts: [_post]
    });

    const _message = new schema.Entity('message', {});

    const _chat = new schema.Entity('chat', {
        messages: [_message],
    });

    const _user = new schema.Entity('user', {
        phones: [_phone],
        profile: _profile,
        chats: [_chat]
    });

    const _scope = new schema.Entity('scope', {});

    const _client = new schema.Entity('client', {
        users: [_user],
        scopes: [_scope]
    });

    _user.define({applications: [_client]});
    _user.define({friends: [_user]});

    _chat.define({users: [_user]});
    _chat.define({owner: _user});

    const _create = new schema.Entity('create', {
        user: _user,
        scope: _scope,
        client: _client
    });

    const db = new schema.Entity('database', {
        clients: [_client],
        users: [_user],
        scopes: [_scope],
        create: _create,
        found: [_user],
        feed: [_feed]
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

            'layout': {
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
                            let {public_id, group, ...current} = req.user;

                            let {user, id, ...profile} = await database.findOne('profile', {user: req.user.id});
                            profile.id = current.id;

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
                    //'loading': {},
                    'empty': {},
                    'loader': {},
                    
                    'bad-request': {},
                    'unauthenticate': {},
                    'access-denied': {},
                    'not-found': {},
                    'unknown-error': {},
                    'landing': {
                        //type: 'tab',
                        icon: 'far fa-question-circle'
                    },

                    
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
                
                                    let token = await tokenHandler({})(req, res);

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
                    'account': {
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
                    'posts': {
                        type: 'tab',
                        access: ['*'],
                        to(req, res, self) {
                            return req.user && self.name + ':' + req.user.public_id;
/*
                            if(req.user) {
                                let profile = await database.findOne('profile', {user: req.user.id}, {allow_empty: true});

                                return req.user && self.name + ':' + profile.public_id;
                            }
*/
                            //return self.name;
                        },
                        methods: {
                            async get(req, res, self) {
                                let data = req.body;
                                if(req.params.id) {
                                    let profile = await database.findOne('profile', {public_id: req.params.id}, {allow_empty: true});
                                    let posts = await database.find('post', {user: profile.user}, {allow_empty: true});

                                    return {
                                        feed: [
                                            {
                                                id: profile.public_id,
                                                posts
                                            }
                                        ]
                                    };
                                }
                                return {};
                            },
                            'save': {
                                access: ['current', 'admins'],
                                async method(req, res, self) {
                                    let data = req.body;
                                    data.id = data.id || '';

                                    let profile = await database.findOne('profile', {public_id: req.params.id}, {allow_empty: true});
                                    data.user = profile.user;
                    
                                    let posts = await database.update('post', {_id: data.id}, data);
                                    return {
                                        feed: [
                                            {
                                                id: profile.public_id, 
                                                posts
                                            }
                                        ]
                                    };
                                }
                            },
                            'remove': {
                                access: ['current', 'admins'],
                                async method(req, res, self) {
                                    let data = req.body;
                                    data = Array.isArray(data) ? data : [data];

                                    let ids = data.map(post => post.id);

                                    let removed = await database.remove('post', {_id: {$in: ids}});
                                    return {feed: [{id: req.params.id, posts: ids}]};
                                }
                            }
                        },
                        children: {
                            'post-dialog': {
                                access: []
                            }
                        }
                    },
                    'search': {
                        type: 'tab',
                        access: ['*'],
                        methods: {
                            async find(req, res, self) {
                                let data = req.body;

                                let regex = new RegExp(`${data.text}`, 'i');
                                //let regex = new RegExp(`.*${data.text}.*`, 'gi');
                                let friends = await database.find('friend', {user: req.user.id}, {allow_empty: true});

                                let users = await database.find('user', {name: regex, _id: {$ne: req.user.id}}, {allow_empty: true});
                                let profiles = await database.find('profile', {user: {$in: users.map(user => user.id)}}, {allow_empty: true});

                                users = users.map(user => {
                                    let {id, name} = user;
                                    let isFriend = friends.find(record => record.friend === id) ? true : false;
                                    let profile = profiles.find(record => record.user === id);
                                    return {id, name, isFriend, public_id: profile.public_id};
                                });

                                return {
                                    found: users
                                };
                            },
                            async append(req, res, self) {
                                let data = req.body;
                                data = Array.isArray(data) ? data : [data];
                                data = data.map(friend => {
                                    return {
                                        friend: friend.id,
                                        user: req.user.id
                                    }
                                });

                                let ids = [];

                                for(let i = 0; i <= data.length - 1; i++) {
                                    let item = data[i];
                                    if(item.user !== item.friend) {
                                        let record = await database.findOne('friend', {user: item.user, friend: item.friend}, {allow_empty: true});
                                        if(!record) {
                                            await database.update('friend', {user: item.user, friend: item.friend}, item);
                                            ids.push(item.friend);
                                        }
                                    }
                                }

                                let friends = await database.find('user', {_id: {$in: ids}}, {allow_empty: true});
                                friends = friends.map(friend => {
                                    friend.isFriend = true;
                                    return friend;
                                });

                                return {
                                    users: [
                                        {
                                            id: 'current',
                                            friends: friends
                                        }

                                    ]
                                };
                            },
                        }
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
/*
                                async get(req, res, self) {
                                    if(self.collection)
                                        return await database.find(self.collection, {});

                                    return {}
                                },
*/

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
                            'friends': {
                                collection: 'friend',
                                methods: {
                                    async get(req, res, self) {
                                        let friends = await database.find(self.collection, {user: req.user.id}, {allow_empty: true});
                                        friends = friends.map(record => record.friend);
                                        let users = await database.find('user', {_id: {$in: friends}}, {allow_empty: true});
                                        let profiles = await database.find('profile', {user: {$in: friends}}, {allow_empty: true});

                                        users = users.map(function (user) {
                                            let profile = profiles.find(record => record.user === user.id);
                                            user.public_id = profile.public_id;
                                            return user;
                                        });
                                        return {
                                            users: [
                                                {
                                                    id: 'current',
                                                    friends: users
                                                }
                                            ]
                                        };
                                    },
                                    async remove(req, res, self) {
                                        let data = req.body;
                                        data = Array.isArray(data) ? data : [data];

                                        let ids = data.map(friend => friend.id);

                                        let removed = await database.remove(self.collection, {user: req.user.id, friend: {$in: ids}});
                                        ids = ids.map(id => {
                                            return {id, isFriend: false}});
                                        return {users: [
                                            {
                                                id: 'current',
                                                friends: ids
                                            }
                                        ]};
                                    }
                                }
                            },
/*
                            'messages': {
                                type: '',
                                access: ['*'],
                                collection: 'message',
                                methods: {
                                    async refresh(req, res, self) {
                                        console.log('GET MESSAGE');
                                        let message = await database.findOne(self.collection, {_id: req.params.id}, {allow_empty: true});
                                        let chat = await database.findOne('chat', {_id: message.chat}, {allow_empty: true});

                                        message.recieved = message.from === req.user.id ? true : chat.users.some(user => user === req.user.id) ? false : req.user.id === chat.owner;


                                        return {
                                            users: [
                                                {
                                                    id: 'current',
                                                    chats: [
                                                        {
                                                            id: message.chat,
                                                            messages: [message]
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    }
                                }
                            },
*/
                            'chats': {
                                access: ['*'],
                                collection: 'chat',
                                methods: {
                                    async refresh(req, res, self) {
                                        let chats = await database.find('chat', {_id: req.params.id}, {allow_empty: true});

                                        return {
                                            users: [
                                                {
                                                    id: 'current',
                                                    chats
                                                }
                                            ]
                                        };

                                    },
                                    async get(req, res, self) {
                                        let chats = await database.find(self.collection, {users: req.user.id}, {allow_empty: true});
/*
                                        for(let i = 0; i <= chats.length - 1; i++) {
                                            let chat = chats[i];
                                            chat.messages = await database.find('message', {chat: chat.id}, {allow_empty: true});

                                            chat.messages = chat.messages.map(message => {
                                                message.recieved = message.from === req.user.id ? true : chat.users.some(user => user === req.user.id) ? false : req.user.id === chat.owner;

                                                return message;
                                            });

                                            chat.owner = await database.findOne('user', {_id: chat.owner}, {allow_empty: true});
                                            let {password, _id, group, ...clean} = chat.owner;
                                            chat.owner = clean;

                                            chat.users = await database.find('user', {_id: {$in: chat.users}}, {allow_empty: true});
                                            chat.users = chat.users.map(user => {
                                                let {password, _id, group, ...clean} = user;
                                                return clean;
                                            });
                                        }
*/

                                        return {
                                            users: [
                                                {
                                                    id: 'current',
                                                    chats
                                                }
                                            ]
                                        };
                                    },
                                    async send1(req, res, self) {
                                        let data = req.body;
                                        data.id = data.id || '';
                                        data.seen = [data.from];

                                        let updates = await database.update('message', {_id: data.id}, data);
                                        updates = updates.map(message => {
                                            message.recieved = true;

                                            return message;
                                        });

                                        //console.log('CHATS:SAVE', Object.keys(sockets));
                                        let location = req.headers['location'];

                                        //process.send({action: 'broadcast', message: {name: 'server:event', event: 'update:location', data: `${req.baseUrl}/${req.params.section}/messages:${updates[0].id}.refresh`}});

                                        //broadcast('server:event', 'update:location', 'chats.get');

                                        return {
                                            users: [
                                                {
                                                    id: 'current',
                                                    chats: [
                                                        {
                                                            id: data.chat,
                                                            messages: updates
                                                        }
                                                    ]
                                                }
                                            ]
                                        };

                                    },
                                    async begin(req, res, self) {
                                        let data = req.body;

                                        data.owner = req.user.id;

                                        data.users = data.users.map(user => user.id);
                                        data.users.push(data.owner);

                                        let updates = await database.update(self.collection, {_id: ''}, data);

                                        return {
                                            users: [
                                                {
                                                    id: 'current',
                                                    chats: updates
                                                }
                                            ]
                                        };
                                    },
                                    async save(req, res, self) {
                                        let data = req.body;
                                        data.id = data.id || '';
                                        delete data.messages;

                                        if (data.name.trim() === '') {
                                            throw new CustomError(406, 'Not allowed chat name.');
                                        }

                                        if (data.owner !== req.user.id) {
                                            throw new CustomError(406, 'You are not chat owner.');
                                        }

                                        let updates = await database.update(self.collection, {_id: data.id}, data);

                                        return {
                                            users: [
                                                {
                                                    id: 'current',
                                                    chats: updates
                                                }
                                            ]
                                        };


                                    },
                                    async remove(req, res, self) {
                                        /* let data = req.body;
                                        data = Array.isArray(data) ? data : [data];
                        
                                        let ids = data.map(phone => phone.id);
                                        
                                        let removed = await database.remove(self.collection, {_id: {$in: ids}});
                                        return {users: [{id: 'current', phones: ids}]}; */
                                    }
                                },
                                children: {
                                    'messages': {
                                        type: '',
                                        access: ['*'],
                                        collection: 'message',
                                        methods: {
                                            async update(req, res, self) {
                                                let data = req.body;
                                                delete data.recieved;

                                                let updates = await database.update('message', {_id: data.id}, data);

                                                return {
                                                    users: [
                                                        {
                                                            id: 'current',
                                                            chats: [
                                                                {
                                                                    id: data.chat,
                                                                    messages: updates
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                };

                                            },
                                            async send(req, res, self) {
                                                let data = req.body;
                                                data.id = data.id || '';
                                                data.seen = [data.from];

                                                let updates = await database.update('message', {_id: data.id}, data);
                                                updates = updates.map(message => {
                                                    message.recieved = true;

                                                    return message;
                                                });

                                                //console.log('CHATS:SAVE', Object.keys(sockets));
                                                let location = req.headers['location'];

                                                //process.send({action: 'broadcast', message: {name: 'server:event', event: 'update:location', data: `${req.baseUrl}/${req.params.section}/messages:${updates[0].id}.refresh`}});

                                                //broadcast('server:event', 'update:location', 'chats.get');

                                                return {
                                                    users: [
                                                        {
                                                            id: 'current',
                                                            chats: [
                                                                {
                                                                    id: data.chat,
                                                                    messages: updates
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                };

                                            },
                                            async getByChat(req, res, self) {
                                                let messages = await database.find('message', {chat: req.params.id}, {allow_empty: true});
                                                let chat = await database.findOne('chat', {_id: req.params.id}, {allow_empty: true});

                                                chat.messages = messages.map(message => {
                                                    message.recieved = message.from === req.user.id ? true : chat.users.some(user => user === req.user.id) ? false : req.user.id === chat.owner;

                                                    return message;
                                                });

                                                chat.users = await database.find('user', {_id: {$in: chat.users}}, {allow_empty: true});
                                                chat.users = chat.users.map(user => {
                                                    let {password, _id, group, ...clean} = user;
                                                    return clean;
                                                });

                                                return {
                                                    users: [
                                                        {
                                                            id: 'current',
                                                            chats: [chat]
                                                        }
                                                    ]
                                                };
                                            },
                                            async refresh(req, res, self) {
                                                //console.log('GET MESSAGE');
                                                let message = await database.findOne(self.collection, {_id: req.params.id}, {allow_empty: true});
                                                let chat = await database.findOne('chat', {_id: message.chat}, {allow_empty: true});
                                                if(chat.users.some(user => req.user.id === user)) {

                                                    message.recieved = message.from === req.user.id ? true : chat.users.some(user => user === req.user.id) ? false : req.user.id === chat.owner;

                                                    return {
                                                        users: [
                                                            {
                                                                id: 'current',
                                                                chats: [
                                                                    {
                                                                        id: message.chat,
                                                                        messages: [message]
                                                                    }
                                                                ]
                                                            }
                                                        ]
                                                    }
                                                }

                                                return {};
                                            }
                                        },
                                        children: {
                                            'chat-dialog': {
                                                access: [],
                                                children: {
                                                    'friends': {
                                                        access: [],
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    'chat-dialog': {
                                        access: [],
                                        children: {
                                            'friends': {
                                                access: [],
                                            }
                                        }
                                    }
                                }
                            },
    /*                             'profile': {
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
                            }, */
                            'phones': {
                                collection: 'phone',
                                methods: {
                                    async get(req, res, self) {
                                        return {
                                            users: [
                                                {
                                                    id: 'current',
                                                    phones: await database.find(self.collection, {user: req.user.id}, {allow_empty: true})
                                                }
                                            ]
                                        };
                                    },
                                    async save(req, res, self) {
                                        let data = req.body;
                                        data.id = data.id || '';

                                        if (data.number === '00000000000') {
                                            throw new CustomError(406, 'Not allowed phone number.');
                                        }
                                        else {
                                            data.user = req.user.id;
                        
                                            let updates = await database.update(self.collection, {_id: data.id}, data);
                                            return {users: [{id: 'current', phones: updates}]};
                                        }
                                    },
                                    async remove(req, res, self) {
                                        let data = req.body;
                                        data = Array.isArray(data) ? data : [data];
                        
                                        let ids = data.map(phone => phone.id);
                                        
                                        let removed = await database.remove(self.collection, {_id: {$in: ids}});
                                        return {users: [{id: 'current', phones: ids}]};
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
                                collection: 'client',
                                methods: {
                                    async get(req, res, self) {
                                        let scopes_array = [];
                                        for (let name in scopes) {
                                            /*scopes[name].public &&*/
                                            scopes_array.push(scopes[name]);
                                        }

                                        return {
                                            clients: await database.find(self.collection, {}),
                                            scopes: scopes_array
                                        };
                                    },
                                    async save(req, res, self) {
                                        let data = req.body;
                                        data.id = data.id === 'created' ? '' : data.id;

                                        if (!data.scope.length) {
                                            throw new CustomError(406, 'Choose at least one scope to continue.');
                                        }

                                        let updates = await database.update('client', {_id: data.id}, data);
                                        return {clients: updates};

                                    },
                                    async remove(req, res, self) {
                                        let data = req.body;
                                        data = Array.isArray(data) ? data : [data];

                                        let ids = data.map(client => client.id);

                                        let removed = await database.remove(self.collection, {_id: {$in: ids}});
                                        return {clients: ids};
                                    }
                                },
                                children: {
                                    'client-dialog': {
                                        access: ['admins'],
                                        methods: {
                                            async get(req, res, self) {
                                                return {
                                                    create: {
                                                        id: 'current',
                                                        client: {
                                                            id: 'created',
                                                            app_name: 'loading...',
                                                            client_id: await generateRandomToken(12),
                                                            client_secret: await generateRandomToken(24),
                                                            scope: []
                                                        },
                                                    },
                                                };
                                            }
                                        },

                                    }
                                }
                            },
                            'users': {
                                type: 'tab',
                                icon: 'fas fa-users',
                                access: ['admins'],
                                collection: 'user',
                                methods: {
                                    async get(req, res, self) {
                                        return {
                                            users: await database.find(self.collection, {})
                                        };
                                    },
                                    async save(req, res, self) {
                                        let data = req.body;
                                        data.id = data.id || '';

                                        let user = await database.findOne(self.collection, {email: data.email}, {allow_empty: true});

                                        if(user && user.id !== data.id) {
                                            throw new CustomError(406, 'Choose another email/password.');
                                        }

                                        let users = await database.update(self.collection, {_id: data.id}, data);

                                        let public_id = generate('abcdefghijklmnopqrstuvwxyz', 5); //await generateRandomToken(5);
                                        data = {
                                            user: users[0].id,
                                            public_id: public_id,
                                            status: 'any string',
                                            avatar: 'default.jpg'
                                        };

                                        let profiles = await database.update('profile', {user: data.user}, data);
                                        users[0].profile = profiles[0];

                                        return {users: users};
                                    },
                                    async remove(req, res, self) {
                                        let data = req.body;
                                        data = Array.isArray(data) ? data : [data];

                                        let ids = data.map(user => user.id);

                                        let removed = await database.remove(self.collection, {_id: {$in: ids}});
                                        await database.remove('profile', {user: {$in: ids}});

                                        return {users: ids};
                                    }
                                },
                                children: {
                                    'user-dialog': {}
                                }
                            },
                            'scopes': {
                                type: 'tab',
                                access: ['admins'],
                                methods: {
                                    async get(req, res, self) {
                                        let scopes_array = [];
                                        for(let name in scopes) {
                                            /*scopes[name].public &&*/ scopes_array.push(scopes[name]);
                                        }

                                        return {
                                            scopes: scopes_array
                                        };
                                    }
                                },
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


let onSocket = function (socket) {
    sockets[socket.id] = socket;
    console.log('API.SOCKETS:', Object.keys(sockets));

};


module.exports = {
    //init,
    //secured,
    //access,
    //action,
    //entities,
    onSocket,
    //broadcast,
    accessGranted,
    //accessMiddleware
};