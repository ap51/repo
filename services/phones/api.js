/*let routes = module.exports;*/

//fill res.locals.entities then normalize it and send to user agent or client app
let redirect = [
    {
        '*.*': function (req, res) {
            return {
                redirect: `https://localhost:5000/resource${req.url}`
            }
        }
    }
];

let routes = [
    {
        category: 'External',
        public: false,
        name: 'profile',
        actions: redirect
    },
    {
        category: 'Phones',
        public: false,
        name: 'phones',
        actions: redirect
    },
    {
        category: 'Phones',
        public: false,
        name: 'phone',
        actions: redirect
    },
    {
        category: 'Phones',
        public: false,
        name: 'phone-find',
        actions: redirect
    }
];

module.exports = routes;