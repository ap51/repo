
let cache = {};
let service = window.location.pathname.split('/')[1];
let route = function (path) {
    let [route, action] = path.split('.');
    let [name, id] = route.split(':');

    return {
        name,
        id,
        action,
        ident: route
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
                path: '/*',
                components: {
                    'layout': httpVueLoader('layout'),
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
    let path = to.params.name;

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
        error.message = error.response.data || error.message;
        error.code = error.response.status || error.code;
        return Promise.reject(error);
    }
);

Vue.prototype.$page = function(path, force) {
    if(force || Vue.prototype.$state.path !== path) {
        //force && (Vue.prototype.$state.path = '');
        !cache[path] && httpVueLoader.register(Vue, path);
        Vue.prototype.$state.locationToggle = !Vue.prototype.$state.locationToggle;
        Vue.prototype.$state.path = route(path).name;
    }
};

Vue.prototype.$bus = new Vue({});

axios.defaults.headers['post'] = {};

Vue.prototype.$request = async function(url, data, options) {
    let name = url.replace('/index.vue', '');

    let parsed = route(name);
    name = parsed.name;

    let {method, callback, encode} = options || {};

    let response = !data && !parsed.action && cache[name];

    if(response)
        return response;

    let config = {
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

                res.data.data && Vue.set(Vue.prototype.$state.data, name, res.data.data);

                Object.assign(Vue.prototype.$state.shared, res.data.shared);
            }

            switch (res.status) {
                case 221:
                        let redirected = decodeURIComponent(window.location.origin + res.config.url) !== decodeURIComponent(res.request.responseURL);

                        cache[name] = res.data.component || cache[name];

                        Vue.prototype.$request(`${Vue.prototype.$state.base_api}${name}.get`);

                        return cache[name];
                    break;
                case 222:
                        let api = res.data.result;
                        let entry = res.data.entry;

                        let database = res.data.entities[entry][api];

                        let merge = deepmerge(Vue.prototype.$state.entities, res.data.entities, {
                            arrayMerge: function (destination/*entities*/, source/*data*/, options) {
                                //ALL ARRAYS MUST BE SIMPLE IDs HOLDER AFTER NORMALIZE
                                if(res.data.method === 'DELETE') {
                                    return destination.filter(id => source.indexOf(id) === -1);
                                }

                                let a = new Set(destination);
                                let b = new Set(source);
                                let union = Array.from(new Set([...a, ...b]));

                                return union;
                            }
                        });

                        Vue.set(Vue.prototype.$state, 'api', api);
                        Vue.set(Vue.prototype.$state, 'entry', entry);

                        Vue.set(Vue.prototype.$state, 'entities', merge);

                        callback && callback(res);
                    break;
                default:
                    callback && callback(res);
                    break;
            }

/*
            if(res.status === 221) {
                let redirected = decodeURIComponent(window.location.origin + res.config.url) !== decodeURIComponent(res.request.responseURL);

                cache[name] = res.data.component || cache[name];

                Vue.prototype.$request(`${Vue.prototype.$state.base_api}${name}.get`);

                return cache[name];
            }
            else {
                let api = res.data.result;
                let entry = res.data.entry;

                let database = res.data.entities[entry][api];

                let merge = deepmerge(Vue.prototype.$state.entities, res.data.entities, {
                    arrayMerge: function (destination/!*entities*!/, source/!*data*!/, options) {
                        //ALL ARRAYS MUST BE SIMPLE IDs HOLDER AFTER NORMALIZE
                        if(res.data.method === 'DELETE') {
                            return destination.filter(id => source.indexOf(id) === -1);
                        }
                        
                        let a = new Set(destination);
                        let b = new Set(source);
                        let union = Array.from(new Set([...a, ...b]));

                        return union;
                    }
                });
                
                Vue.set(Vue.prototype.$state, 'api', api);
                Vue.set(Vue.prototype.$state, 'entry', entry);

                Vue.set(Vue.prototype.$state, 'entities', merge);

                callback && callback(res);
            }
*/
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
        location() {
            return this.$state.path;
        },
        auth() {
            return this.$state.auth;
        },
        shared() {
            return this.$state.shared;
        }
    },
    data() {
        let data = {
            state: this.$state
        };

        data.name = this.$options.name || this.$options._componentTag;
        Object.assign(data, this.$state.data[data.name]);

        return data;
    },
    created() {
        //console.log(this.state.path);
        //this.state.route.name === this.name && this.$request(`${this.state.route.ident}.data`);
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

window.vm = new Vue({
    el: '#app',
    router: router,
    created() {
        this.$vuetify.theme = theme
    }
});
