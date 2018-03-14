
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
    path: window.location.pathname.replace(`/${service}/`, '') || 'about',
    route: route(window.location.pathname.replace(`/${service}/`, '') || 'about'),
    entities: {},
    data: {},
    token: sessionStorage.getItem('token'),
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
        return Promise.reject(error);
    }
);

Vue.prototype.$page = function(path, force) {

    if(force || Vue.prototype.$state.path !== path) {
        !cache[path] && httpVueLoader.register(Vue, path);
        Vue.prototype.$state.path = route(path).name;
    }
};

Vue.prototype.$bus = new Vue({});


Vue.prototype.$request = async function(url, data, method) {
    let name = url.replace('/index.vue', '');

    url = router.options.base + name;

    let response = !data && cache[name];

    if(response)
        return response;

/*
    let search = window.location.search.slice(1);
    search = search.split('&');

    search = search.reduce(function (memo, item) {
        let [key, value] = item.split('=');
        memo[key] = value;

        return memo;
    }, {});

    let referer = search && search['from'];
*/

    let config = {
        url: url,
        method: data ? method || 'post' : 'get',
        headers: {
            'Authorization': Vue.prototype.$state.token ? `Bearer ${Vue.prototype.$state.token}` : '',
            'x-service': router.options.base,
            //'Access-Control-Allow-Origin': '*'
        }
    };

    //referer && (config.headers['x-referer'] = referer);
    data && (config.data = data);

    return axios(config)
        .then(function(res) {
            let redirected = decodeURIComponent(window.location.origin + res.config.url) !== decodeURIComponent(res.request.responseURL);
            if(false) {
                //window.location.href = res.request.responseURL;
                //window.history.pushState(null, null, res.request.responseURL);
            }
            else {
                res.data.token && Vue.set(Vue.prototype.$state, 'token', res.data.token);
                sessionStorage.setItem('token', Vue.prototype.$state.token);

                if (res.data.redirect) {
                    if(res.data.redirect.local) {
                        let path = res.data.redirect.replace(Vue.prototype.$state.base, '');

                        Vue.prototype.$page(path);

                        name = path;
                    }
                    else {
                        window.location.replace(res.data.redirect.remote);
                        return;
                    }
                }

                cache[name] = res.data.component || cache[name];

                res.data.data && Vue.set(Vue.prototype.$state.data, name, res.data.data);
                //ОБЪЕДИНИТЬ ТОЛЬКО ЧТО НОВОЕ! пример сделан в проекте
                res.data.entities && Vue.set(Vue.prototype.$state, 'entities', res.data.entities);

                return cache[name];
            }
        })
        .catch(function(err) {
            Vue.prototype.$bus.$emit('snackbar', err);
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
        }
    },
    data() {
        let data = {
            state: this.$state,
        };

        Object.assign(data, this.$state.data[this.$options.name || this.$options._componentTag]);

        return data;
    },
    watch: {
        'state.path': function () {
            this.visible && this.cancel && this.cancel();
        }
    }
};

window.vm = new Vue({
    el: '#app',
    router: router
});

