module.exports = {
    data(router) {
        return {
            title: 'My Tiny Social Network',
            auth: '',
            icon: 'fab fa-empire',
            signin: false,

            tabs: [
                {
                    name: 'about',
                    icon: 'far fa-question-circle'
                },
                {
                    name: 'profile',
                    icon: 'fas fa-user-circle'
                },
                {
                    name: 'find phone',
                    to: 'find-phone',
                    icon: 'fas fa-mobile'
                },
                {
                    name: 'phones db',
                    to: 'phones-database',
                    icon: 'fas fa-database'
                }
            ]

        }
    },
    entity(router) {
        return {}
    }
};