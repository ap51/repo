const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const JSON5 = require('json5');


module.exports = class Component {
    constructor(router) {
        this.router = router;
        this.service = router.service;
        this.name = router.req.params.name;
        this.user = router.res.locals.user;

        let module = path.join(__dirname, this.service, 'database', 'schema');
        this.schema = fs.existsSync(`${module}.js`) ? require(module) : void 0;
    }

    get data() {
        return {}
    }

    get entity() {
        return {}
    }
};