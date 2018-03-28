
let cache = {};
let service = window.location.pathname.split('/')[1];

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
    token: localStorage.getItem('token'),
    auth: {}
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
            {
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
            {
                path: '/*',
                components: {
                    'layout': httpVueLoader('layout'),
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

    Vue.prototype.$page(path, true);

    next();
});


axios.interceptors.request.use(
    function (config) {
        return config;
    },
    function (error) {
        return Promise.reject(error);
    }
);

axios.interceptors.response.use(
    function (response) {
        if(response.data.error)
            return Promise.reject(response.data.error);
        return response;
    },
    function (error) {
        //error.response.status === 401 && (Vue.prototype.$state.auth = void 0);
        error.message = (error.response && error.response.data) || error.message;
        error.code = error.response.status || error.code;
        return Promise.reject(error);
    }
);

Vue.prototype.$page = function(path, force) {
    if(force || Vue.prototype.$state.path !== path) {
        //force && (Vue.prototype.$state.path = '');
        let parsed = route(path);
        let {ident, url, name, component} = parsed;

        !cache[component] && httpVueLoader.register(Vue, component);

        Vue.prototype.$state.locationToggle = !Vue.prototype.$state.locationToggle;
        Vue.prototype.$state.path = url;
    }
};

Vue.prototype.$bus = new Vue({});

axios.defaults.headers['post'] = {};

Vue.prototype.$request = async function(url, data, options) {
    let name = url.replace('/index.vue', '').replace(/_/gi, ':');

    let parsed = route(name);
    name = parsed.name;
    let {ident, component} = parsed;

    url.indexOf(component) === 0 && (url = Vue.prototype.$state.base_ui + parsed.url);

    let {method, callback, encode, config, no_headers} = options || {};

    let response = !data && !parsed.action && cache[component];

    if(response)
        return response;

    let conf = {
        url: url,
        method: data ? method || 'post' : 'get',
        headers: {
            'content-type': encode ? 'application/x-www-form-urlencoded' : 'application/json',
            //'Authorization': Vue.prototype.$state.token ? `Bearer ${Vue.prototype.$state.token}` : '',
            'token': Vue.prototype.$state.token || '',
            'location': data ? data.location || window.location.pathname : window.location.pathname
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

    return axios(config)
        .then(function(res) {
            if(res.status > 220) {
                res.data.token && Vue.set(Vue.prototype.$state, 'token', res.data.token);
                localStorage.setItem('token', Vue.prototype.$state.token);
                Vue.set(Vue.prototype.$state, 'auth', res.data.auth || '');

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

                res.data.data && Vue.set(Vue.prototype.$state.data, component, res.data.data);

                Object.assign(Vue.prototype.$state.shared, res.data.shared);
            }

            switch (res.status) {
                case 221:
                        let redirected = decodeURIComponent(window.location.origin + res.config.url) !== decodeURIComponent(res.request.responseURL);

                        cache[component] = res.data.component || cache[component];

                        Vue.prototype.$request(`${Vue.prototype.$state.base_api}${parsed.ident}.get`);
                        //console.log('REQUEST:', `${Vue.prototype.$state.base_api}${parsed.ident}.get`);

                        return cache[component];
                    break;
                case 222:
                        callback && callback(res, data);

                        let api = res.data.result;
                        let entry = res.data.entry;

                        let database = res.data.entities[entry][api];

                        let merge = deepmerge(Vue.prototype.$state.entities, res.data.entities, {
                            arrayMerge: function (destination/*entities*/, source/*data*/, options) {
                                //ALL ARRAYS MUST BE SIMPLE IDs HOLDER AFTER NORMALIZE
                                if(res.data.method === 'DELETE') {
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
                    break;
                default:
                    callback && callback(res);
                    return res;
                    break;
            }

        })
        .catch(function(err) {
            Vue.prototype.$bus.$emit('snackbar', `ERROR: ${err.message} ${err.code ? 'CODE: ' + err.code + '.': ''}`);
            return '';// Promise.reject(err);
        });

};

httpVueLoader.httpRequest = Vue.prototype.$request;

let component = {
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
            return (this.entities.user && this.entities.user.current) || {name: 'unknown'};
        },
        current_profile() {
            return (this.entities.profile && this.entities.profile[this.parsed_route.id]) || {name: 'unknown'};
        },
        parsed_route() {
            return route(this.$state.path);
        },
        location() {
            //return route(this.$state.path).component;

            let route = this.parsed_route.component;
            if(this.auth || this.parsed_route.name === 'feed') {
                let location_change = ['feed', 'friends', 'charts', 'profile', 'search', 'phones', 'applications'].indexOf(this.parsed_route.name) !== -1;
                route = location_change ? route.replace(this.parsed_route.name, 'public') : route;
                //location_change && route !== this.location && httpVueLoader.register(Vue, route);
            }
            return route;
        },
    },
    data() {
        let data = {
            state: this.$state
        };

        data.name = this.$options.name || this.$options._componentTag;
        let current = route(window.location.pathname);
        let identified = current.component.replace(current.name, data.name);

        let assigned_data = this.$state.data[data.name] || this.$state.data[identified];

        Object.assign(data, assigned_data);

        return data;
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
        }
    },
    watch: {
        'state.locationToggle': function () {
            this.visible && this.cancel && this.cancel();//close dialogs
            this.visible && this.emptyData && this.emptyData();
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

window.vm = new Vue({
    el: '#app',
    router: router,
    components: {
    },
    created() {
        this.$vuetify.theme = theme
    }
});
