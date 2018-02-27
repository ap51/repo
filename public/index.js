
let service = window.location.pathname.split('/')[1] || 'test'
let base = `/${service}/`;
let path = window.location.pathname.replace(base, '') || 'about';
let cache = {};

Vue.prototype.$state = {service, base, path, entities: {}, session: {}};

let router = new VueRouter(
    {
        base,
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
        return response;
    },
    function (error) {
        return Promise.reject(error);
    }
);

Vue.prototype.$page = function(path, force) {

    if(force || Vue.prototype.$state.path !== path) {
        !cache[path] && httpVueLoader.register(Vue, path);
        Vue.prototype.$state.path = path;
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
        }
    };

    data && (config.data = data);

    return axios(config)
        .then(function(res) {
            res.data.session && Vue.set(Vue.prototype.$state, 'session', res.data.session);

            if(!res.data.error) {
                if (res.data.redirect) {
                    let path = res.data.redirect.replace(base, '');

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

