
let cache = {};
let service = window.location.pathname.split('/')[1];

Vue.prototype.$socket = io(`/${service}`, {
    path: `/${service}/ui/_socket_`,
    transports: ['websocket']
});

let route = function (path) {
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

Vue.prototype.$state = {
    service: service || 'stub',
    base: `/${service}/`,
    base_ui: `/${service}/ui/`,
    base_api: `/${service}/ui_api/`,
    path: window.location.pathname.replace(`/${service}/ui/`, '') || 'about',
    entities: {},
    data: {},
    shared: {},
    locationToggle: false,
    token: localStorage.getItem(`${service}:token`),
    auth: {},
    hierarchy: void 0,
    locations: {}
    //token: '{user_id:1010010, user_name:"bob dilan", container_id:"pdqwp08qfu", token:"qfefw98we7ggwvv7s"}',
};

let router = new VueRouter(
    {
        base: Vue.prototype.$state.base_ui,
        mode: 'history',
        routes: [
            {
                path: '/',
                redirect: 'about'
            },
/*             {
                path: '/feed\::id',
                components: {
                    'public': httpVueLoader('public'),
                },
            },
            {
                path: '/friends*',
                components: {
                    'public': httpVueLoader('public'),
                },
            },
 */
            {
                path: '/*',
                components: {
                    //'loader': httpVueLoader('loader'),
                    //'layout': httpVueLoader('layout'),
/*
                    'public': httpVueLoader('public'),
*/
                },
                props: {
                },
                children: [
                    {
                        path: '/:name',
                    }
                ]

            }
        ],
    }
);

router.beforeEach(async function (to, from, next) {
    let path = to.params.name || to.path;

    next();

    Vue.prototype.$page(path, true);
});

let loader = void 0;
let timeout = void 0;

axios.interceptors.request.use(
    function (config) {
/*         timeout = setTimeout(function() {
            //loader = loader || (window.vm && window.vm.$loading.show());
        }, 300);
        loader = loader || (window.vm && window.vm.$loading.show()); */
        return config;
    },
    function (error) {
        /* loader && loader.hide();
        loader = void 0;
        clearTimeout(timeout); */

        return Promise.reject(error);
    }
);

axios.interceptors.response.use(
    function (response) {
        /* loader && loader.hide();
        loader = void 0;
        clearTimeout(timeout); */

        if(response.data.error)
            return Promise.reject(response.data.error);
        return response;
    },
    function (error) {
        /* loader && loader.hide();
        loader = void 0;
        clearTimeout(timeout); */

        error.message = (error.response && error.response.data) || error.message;
        error.code = error.response.status || error.code;
        return Promise.reject(error);
    }
);

Vue.prototype.$page = function(path, force) {
    if(force || Vue.prototype.$state.path !== path) {
        let parsed = route(path);
        let {ident, url, name, component} = parsed;

        !cache[component] && httpVueLoader.register(Vue, component);

        Vue.prototype.$state.locationToggle = !Vue.prototype.$state.locationToggle;
        Vue.prototype.$state.locations[component] ? Vue.prototype.$state.hierarchy = Vue.prototype.$state.locations[component] : Vue.prototype.$request(component);
    }
};

Vue.prototype.$bus = new Vue({});

axios.defaults.headers['post'] = {};

let request_queue = {};
let loaded = {};

Vue.prototype.$request = async function(url, data, options) {
    let name = url.replace('/index.vue', '').replace(/_/gi, ':');

    let parsed = route(name);
    name = parsed.name;
    let {ident, component} = parsed;

    url.indexOf(component) === 0 && (url = Vue.prototype.$state.base_ui + parsed.url);

    if(request_queue[url])
        return request_queue[url];

    let {method, callback, encode, config, no_headers, on_merge} = options || {};

    let response = !data && !parsed.action && cache[component];

    if(response)
        return response;

    //let location = route(window.location.pathname).ident;
    let location = route(window.location.pathname).ident;

    let conf = {
        url: url,
        method: data ? method || 'post' : 'get',
        headers: {
            'content-type': encode ? 'application/x-www-form-urlencoded' : 'application/json',
            //'Authorization': Vue.prototype.$state.token ? `Bearer ${Vue.prototype.$state.token}` : '',
            'token': Vue.prototype.$state.token || '',
            'location': data ? data.location || location : location,
            //'user-agent': 'internal'
        },
        transformRequest: function(obj) {
            let transformed = encode ? Qs.stringify(obj) : JSON.stringify(obj);
            return transformed;
/*
            let str = [];
            for (let key in obj)
                str.push(encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]));
            return str.join("&");
*/
        }
    };

    //encode && (config.headers['content-type'] = 'application/x-www-form-urlencoded');
    no_headers && (delete conf.headers);

    config = Object.assign(conf, config || {});
    
    data && (config.data = data);

    console.log('REQUEST:', config.url);

    request_queue[url] = axios(config)
        .then(function(res) {
            request_queue[res.config.url] = false;

            console.log('RESPONSE:', res.config.url);
            if(res.status > 220) {
                res.data.token && Vue.set(Vue.prototype.$state, 'token', res.data.token);
                Vue.prototype.$state.token && localStorage.setItem(`${service}:token`, Vue.prototype.$state.token);

                Vue.set(Vue.prototype.$state, 'auth', res.data.auth || '');

                /*
                                if (res.data.redirect_remote) {
                                    window.location.replace(res.data.redirect.remote);
                                    return;
                                }

                                if (res.data.redirect_local) {
                                    let path = res.data.redirect_local.replace(Vue.prototype.$state.base_ui, '');

                                    name = path;

                                    if (Vue.prototype.$state.path === path) {
                                        Vue.prototype.$page(path, true);
                                    }
                                    else router.push(path);
                                    return;
                                }
                 */

                let componets_data = res.data.executed && Object.entries(res.data.executed);
                callback && callback(res, data);

                switch (res.status) {
                    case 223:
                        /* let redirect = res.data.redirect; // ЭТО ПОДСТАНОВКА А НЕ РЕДИРЕКТ
                        if(redirect.local) {
                            !cache[redirect.local] && httpVueLoader.register(Vue, redirect.local);
                            Vue.prototype.$request(redirect.local, {location: redirect.local});
                        } */
                        break;
                    case 221:
                        let redirected = decodeURIComponent(window.location.origin + res.config.url) !== decodeURIComponent(res.request.responseURL);

                        componets_data.map(function (item) {
                            let [key, value] = item;
                            Vue.set(Vue.prototype.$state.data, key, value);
                        });

                        cache[component] = res.data.sfc || cache[component];
                        //console.log('CACHE:', component);

                        Vue.prototype.$state.locations[component] = Vue.prototype.$state.locations[component] || res.data.location.split('.');
                        Vue.prototype.$state.hierarchy = Vue.prototype.$state.locations[component];

                        let last = [...Vue.prototype.$state.hierarchy];
                        last = last.pop();
                        console.log(url);
                        parsed.component === last && Vue.prototype.$request(`${Vue.prototype.$state.base_ui}${parsed.ident}.get`);

                        if(parsed.component === last) {
                            Vue.prototype.$bus.$emit(`loading`, true);
                            Vue.prototype.$state.hierarchy.map(name => {
                                Vue.prototype.$bus.$emit(`loading:${name}`, true);
                                loaded[name] = false;
                            });
                        }

                        //parsed.component === last && console.log('REQUEST:', `${Vue.prototype.$state.base_api}${parsed.ident}.get`);

/*
                        componets_data.map(function (item) {
                            let [key, value] = item;
                            Vue.prototype.$bus.$emit(`data:${key}`, value);
                        });
*/

                        return cache[component];
                        break;
                    case 222:

                        let api = res.data.result;
                        let entry = res.data.entry;

                        let database = res.data.entities[entry][api];

                        let merge = deepmerge(Vue.prototype.$state.entities, res.data.entities, {
                            arrayMerge: function (destination, source, options) {
                                //ALL ARRAYS MUST BE SIMPLE IDs HOLDER AFTER NORMALIZE
                                if(res.config.method.toUpperCase() === 'DELETE') {
                                    if(destination.length) {
                                        return destination.filter(id => source.indexOf(id) === -1);
                                    }
                                    else {
                                        return source;
                                    }
                                }

                                let a = new Set(destination);
                                let b = new Set(source);
                                let union = Array.from(new Set([...a, ...b]));

                                return union;
                            }
                        });

                        //console.log('API DATA:', data);

                        Vue.set(Vue.prototype.$state, 'api', api);
                        Vue.set(Vue.prototype.$state, 'entry', entry);

                        Vue.set(Vue.prototype.$state, 'entities', merge);

                        Vue.prototype.$bus.$emit('merged', merge);
                        console.log('MERGED:', res.config.url);
                        on_merge && on_merge(merge);
                        
                        //parsed.action === 'get' && Vue.prototype.$bus.$emit(`loaded:${parsed.component}`, merge);
                        //parsed.action === 'get' && console.log('LOADED:', parsed.component);

                        if(parsed.action === 'get') {
                            Vue.prototype.$bus.$emit(`loading`, false);
                            Vue.prototype.$state.hierarchy.map(name => {
                                Vue.prototype.$bus.$emit(`loading:${name}`, false);
                                loaded[name] = true;
                            });
                        }
/*                         setTimeout(function() {
                            loaded[parsed.component] = true;
                            parsed.action === 'get' && Vue.prototype.$bus.$emit(`loaded:${parsed.component}`, merge);
                            parsed.action === 'get' && console.log('LOADED:', parsed.component);
                        }, 3000) */

                        //callback && callback(res, data, 'after');
                        break;
                    default:
                        break;
                }

                componets_data && componets_data.map(function (item) {
                    let [key, value] = item;
                    Vue.prototype.$bus.$emit(`data:${key}`, value);
                });

                //res.data.executed[component] && Vue.prototype.$bus.$emit(`data:${component}`, res.data.executed[component]);
            }
            else {
                callback && callback(res);
                return res;
            }

        })
        .catch(function(err) {
            Vue.prototype.$bus.$emit('snackbar', `ERROR: ${err.message} ${err.code ? 'CODE: ' + err.code + '.': ''}`);
            delete request_queue[url];
            return '';// Promise.reject(err);
        });
    return request_queue[url];
};

httpVueLoader.httpRequest = Vue.prototype.$request;

let component = {
    components: {
        'loading': httpVueLoader('loading'),
    },
    computed: {
        entities() {
            return this.$state.entities;
        },
        database() {
            return (this.$state.entities[this.$state.entry] && this.$state.entities[this.$state.entry][this.$state.api]) || {};
        },
        auth() {
            return this.$state.auth;
        },
        shared() {
            return this.$state.shared;
        },
        document_title() {
            return `${service} - ${this.name}`;
        },
        current_user() {
            //this.state.locationToggle && void 0;
            let id = 'current';
            let user = this.entities.user && this.entities.user[id];
            let profile = user && this.entities.profile && this.entities.profile[user.profile];
            return (user && {...user, ...profile});
        },
        parsed_route() {
            return route(this.$state.path);
        },
        address() {
            this.state.locationToggle && void 0; //ensure this will update computed value
            let pathname = window.location.pathname;
            return route(pathname);
        },
        location() {
            if(this.state.hierarchy) {
                let name = this.name || '';
                if (name === '' || this.state.hierarchy.includes(name)) {
                    let inx = this.state.hierarchy.indexOf(name);
                    let component = this.state.hierarchy[inx + 1];
                    !cache[component] && httpVueLoader.register(Vue, component);
                    return component;
                }
            }
        },
        loader() {
            return httpVueLoader;
        }
    },
    data() {
        let self = this;
        let data = {
            loading: true,
            state: this.$state,
            loaded
        };

        data.name = this.$options.name || this.$options._componentTag;

        this.$bus.$on(`data:${data.name}`, function (data) {
            //console.log(self.$data, data);
            Object.assign(self.$data, data);
        });

        data.loading = !loaded[data.name];

        this.$bus.$on(`loading:${data.name}`, function (data) {
            self.loading = data;
        });

        /*
                let current = route(window.location.pathname);
                let identified = current.component.replace(current.name, data.name);

                let assigned_data = this.$state.data[data.name] || this.$state.data[identified];

                Object.assign(data, assigned_data);
         */
        let assigned_data = this.$state.data[data.name] || {};

        Object.assign(data, assigned_data);

        return data;
    },
    beforeCreate() {
        //console.log('BEFORE CREATE:', this);
    },
    created() {
        //console.log(this.state.path);
        //this.state.route.name === this.name && this.$request(`${this.state.route.ident}.data`);
    },
    activated() {
        document.title = this.document_title;
    },
    methods: {
        parseRoute(path) {
            return route(path);
        },
        clearCache(options) {
            let {reload} = options;
            let locations = Object.entries(this.state.locations);
            locations.map(function (item) {
                let [key, value] = item;
                if(key !== 'layout')
                    delete cache[key];
            });

            if(reload) {
                this.state.entities = {};
                //this.state.hierarchy = void 0;
                this.state.locations = {};
                //this.state.locations[this.address.component] = void 0;
                this.$page(this.address.url, true);
            }
        }
    },
    watch: {
        'state.locationToggle': function () {
            this.visible && this.cancel && this.cancel();//close dialogs
            this.visible && this.emptyData && this.emptyData();
        },
        '$state.path': function() {
            //console.log(this.$state.path);
        }
    }
};

/*
Vue.use(Vuetify, {
});
*/

const theme = {
    primary: '#1976D2',
    secondary: '#b0bec5',
    accent: '#388E3C',
    error: '#b71c1c'
};

//httpVueLoader.register(Vue, 'picture-input');
//Vue.use(VueLoading);

Vue.config.devtools = true;

window.vm = new Vue({
    el: '#app',
    extends: component,
    router: router,
    data() {
        return {
            loading: loaded
        }
    },
    components: {
        'loader': httpVueLoader('loader')
    },
    created() {
        let self = this;
        this.$vuetify.theme = theme;

        this.$socket.on('server:event', function(event, content) {
            switch (event) {
                case 'update:location':
                    console.log('SOCKET:', event);
                    self.$request(`${self.$state.base_ui}${content.data}`);
                    break
            }
        });

        this.$socket.on('component:event', function(event, component, data) {
            self.$bus.emit(`${event}:${component}`, data);
        });

        this.$socket.emit('event', {hello: 'world'}, function(...args) {
            console.log('SOCKET:', args);
        });
        //console.log('LOAD:', this.loading);
    },
    computed: {
        /* loading() {
            console.log('LOAD:', loaded);
            return loaded;
        } */
    }
});
