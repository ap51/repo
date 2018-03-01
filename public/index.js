
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
    entities: {

    },
    session: {
        id: 0,
        token: '',
        user: ''
    }
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
    //path = route(path).name;

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

    let config = {
        url: url,
        method: data ? method || 'post' : 'get',
        headers: {
            'Authorization': 'Bearer sdlflsdk',
            'x-service': router.options.base
        }
    };

    data && (config.data = data);

    return axios(config)
        .then(function(res) {
            res.data.session && Vue.set(Vue.prototype.$state, 'session', res.data.session);

            if(!res.data.error) {
                if (res.data.redirect) {
                    let path = res.data.redirect.replace(Vue.prototype.$state.base, '');

                    Vue.prototype.$page(path);

                    name = path;
                }
                cache[name] = res.data.component || cache[name];

                res.data.data && Vue.set(Vue.prototype.$state, 'entities', res.data.data);

                return cache[name];
            }
            else Vue.prototype.$bus.$emit('snackbar', res.data.error);
        })
        .catch(function(err) {
            return Promise.reject(err);
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
        return {
            state: this.$state
        }
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

