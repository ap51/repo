//fill res.locals.entities then normalize it and send to user agent or client app

let d = {
    'entities': {
        public: false,
        'get.profile.entity': function (req, res) {

        },
        'get.phones.entity': function (req, res) {

        }
    },
    'profile': {
        'get.profile.email': function (req, res) {

        },
        'post.profile.save': function (req, res) {

        },
        'get.profile.create': function (req, res) {

        },
        'post.profile.create': function (req, res) {

        },
        'get.profile.delete': function (req, res) {

        },
        'post.profile.delete': function (req, res) {

        },
    }
};

let api = [
    {
        scope: 'profile.email',
    },
    {
        scope: 'phones',
    }
];

let routes1 = [
    {
        category: 'Profile',
        name: 'profile',
        actions: [
            {
                'data.get': function (req, res) {
                    return {
                        email: 'joe@dou.com',
                        name: 'Joe Dou'
                    } //get user by internal id in token
                }
            }
        ],
    },
    {
        category: 'Phones',
        name: 'phones',
        actions: [
            {
                '*.get': function (req, res) {
                    return [
                        {
                            id: 1,
                            phone: '+78009092233',
                            owner: 'Will Smith'
                        },
                        {
                            id: 2,
                            phone: '+78019024233',
                            owner: 'Mary Sue'
                        }
                    ] //get all users phones
                }
            }
        ],
    },
    {
        category: 'Phones',
        name: 'phone-find',
        actions: [
            {
                '*.get': function (req, res) {
                    return {
                        id: 1,
                        phone: '+78009092233',
                        owner: 'Will Smith'
                    } //get phone by ID
                }
            }
        ],
    },
    {
        category: 'Phones',
        name: 'phone',
        actions: [
            {
                '*.get': function (req, res) {
                    return {
                        id: 1,
                        phone: '+78009092233',
                        owner: 'Will Smith'
                    } //get phone by ID
                }
            },
            {
                'create.post': function (req, res, body) { //get implement in component-data tag of component
                    return {
                        id: 3,
                        phone: '+78029092233',
                        owner: 'Bob Dilan'
                    } //save body data to db
                }
            },
            {
                'save.post': function (req, res, body) {
                    return {
                        id: 1,
                        phone: '+78009092234',
                        owner: 'Will Smith'
                    } //save body data to db
                }
            },
            {
                'remove.post': function (req, res, body) {
                    return {
                        id: 1,
                        phone: '+78009092233',
                        owner: 'Will Smith'
                    } //remove phone by id in body data from db
                }
            }
        ]
    }
];

module.exports = routes;