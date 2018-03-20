const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const JSON5 = require('json5');


module.exports = class Component {
    constructor(router, req, res) {
        this.router = router;
        this.service = router.service;
        this.name = req.params.name;
        this.auth = req.token.auth;

        //console.log('CONSTRUCTOR: ', this.name);
        
/*         this.user = router.user;
        this.user && console.log('USER EXISTS: ', this.name, this.user);
 */
        let module = path.join(__dirname, this.service, 'database', 'schema');
        //this.schema = fs.existsSync(`${module}.js`) ? require(module) : void 0;
    }

    get data() {
        return {}
    }

    shared(req, res) {
        return {}
    }

    get entity() {
        return {}
    }
};