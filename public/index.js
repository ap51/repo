
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
    base: `/${service}/ui/`,
    path: window.location.pathname.replace(`/${service}/ui/`, '') || 'about',
    route: route(window.location.pathname.replace(`/${service}/ui/`, '') || 'about'),
    entities: {},
    data: {},
    locationToggle: false,
    token: localStorage.getItem('token'),
    auth: void 0
    //token: '{user_id:1010010, user_name:"bob dilan", container_id:"pdqwp08qfu", token:"qfefw98we7ggwvv7s"}',
};

let router = new VueRouter(
    {
        base: Vue.prototype.$state.base,
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


Vue.prototype.$request = async function(url, data, method) {
    let name = url.replace('/index.vue', '');

    let parsed = route(name);
    name = parsed.name;

    //url = router.options.base + name;

    let response = !data && !parsed.action && cache[name];

    if(response)
        return response;

    let config = {
        url: url,
        method: data ? method || 'post' : 'get',
        headers: {
            //'content-type': 'application/x-www-form-urlencoded',
            //'Authorization': Vue.prototype.$state.token ? `Bearer ${Vue.prototype.$state.token}` : '',
            'token': Vue.prototype.$state.token || '',
            'location': data ? data.location || window.location.pathname : window.location.pathname
        },
        transformRequest: function(obj) {
            let str = [];
            for(let key in obj)
                str.push(encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]));
            return str.join("&");
        }
    };

    //referer && (config.headers['x-referer'] = referer);
    data && (config.data = data);

    return axios(config)
        .then(function(res) {
            if(res.status === 200) {
                let redirected = decodeURIComponent(window.location.origin + res.config.url) !== decodeURIComponent(res.request.responseURL);

                //res.data.token && Vue.set(Vue.prototype.$state, 'token', res.data.token);

                Vue.set(Vue.prototype.$state, 'auth', res.data.auth || '');

                res.data.token && Vue.set(Vue.prototype.$state, 'token', res.data.token);
                localStorage.setItem('token', Vue.prototype.$state.token);

                if (res.data.redirect_remote) {
                    window.location.replace(res.data.redirect.remote);
                    return;
                }

                if (res.data.redirect_local) {
                    let path = res.data.redirect_local.replace(Vue.prototype.$state.base, '');

                    name = path;

                    if (Vue.prototype.$state.path === path) {
                        Vue.prototype.$page(path, true);
                    }
                    else router.push(path);
                }

                cache[name] = res.data.component || cache[name];

                res.data.data && Vue.set(Vue.prototype.$state.data, name, res.data.data);

                return cache[name];
            }
            else {
                console.log(res.data);
                return res.data;
                /*
            //ОБЪЕДИНИТЬ ТОЛЬКО ТО ЧТО НОВОЕ! пример сделан в проекте

            setTimeout(function () {
                !parsed.action && parsed.action !== 'entities' && Vue.prototype.$request(`${parsed.ident}.entities`);
            }, 0);

            parsed.action === 'entities' && res.data.entities && Vue.set(Vue.prototype.$state, 'entities', res.data.entities);
*/

            }
        })
        .catch(function(err) {
            Vue.prototype.$bus.$emit('snackbar', `ERROR: ${err.message}. ${err.code ? 'CODE: ' + err.code + '.': ''}`);
            return '';// Promise.reject(err);
        });

};

httpVueLoader.httpRequest = Vue.prototype.$request;

let component = {
    computed: {
        entities() {
            return this.$state.entities;
        },
        location() {
            return this.$state.path
        },
        auth() {
            return this.$state.auth
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
        console.log(this.state.path);
        //this.state.route.name === this.name && this.$request(`${this.state.route.ident}.data`);
    },
    watch: {
        'state.locationToggle': function () {
            this.visible && this.cancel && this.cancel();//close dialogs
            this.visible && this.emptyData && this.emptyData();
        }
    }
};

window.vm = new Vue({
    el: '#app',
    router: router
});

