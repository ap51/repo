<template>
        <v-card>
            <v-card-title>
                <v-icon class="mr-1">fas fa-user-circle</v-icon>
                <span class="headline">sign in</span>
            </v-card-title>
            <v-card-text>
                <v-container grid-list-md>
                    <v-layout wrap >
                        <v-form ref="form" class="form" lazy-validation @submit.prevent>
                            <v-flex xs12>
                                <v-text-field v-model="email"
                                              label="Email"
                                              required
                                              prepend-icon="fas fa-at"
                                              autofocus
                                              color="blue darken-2"
                                              :rules="[
                                                  () => !!email || 'This field is required',
                                              ]"
                                ></v-text-field>
                            </v-flex>
                            <v-flex xs12>
                                <v-text-field v-model="password"
                                              label="Password"
                                              type="password"
                                              required
                                              prepend-icon="fas fa-key"
                                              color="blue darken-2"
                                              :rules="[
                                                  () => !!password || 'This field is required',
                                              ]"
                                ></v-text-field>
                            </v-flex>
                        </v-form>
                    </v-layout>
                </v-container>
                <small>*indicates required field</small>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-2" flat @click.native="cancel()">cancel</v-btn>
                <v-btn color="blue darken-2" flat @click.native="signin()">sign in</v-btn>
            </v-card-actions>
        </v-card>
</template>

<style scoped>
</style>

<script>
    module.exports = {
        extends: component,
        props: [
            'reset'
        ],
        data() {
            return {
/*
                email: '',
                password: ''
*/
            }
        },
        methods: {
            cancel() {
                this.$emit('cancel');
            },
            signin() {
                if (this.$refs.form.validate()) {
                    let data = {
                        email: this.email,
                        password: md5(`${this.email}.${this.password}`),
                        //location: 'about'
                    };

                    this.$request('signin.submit', data);
                }
                else this.$bus.$emit('snackbar', 'Data entered doesn\'t match validation rules');
            }
        },
        watch: {
            'reset': function (newValue) {
                //newValue && this.$refs.form.reset();
            }
        }
    }

    //# sourceURL=signin.js
</script>

<server-script>
    const Component = require('./component');

    module.exports = class SignIn extends Component {
        constructor(router, req, res) {
            super(router, req, res);

        }

        get data() {
            let _data = {
                email: 'ap@gmail.com',
                password: '123'
            };

            return _data;
        }

        get entity() {
            return `select * from user`
        }

        async submit(req, res) {
            //console.log(req.jwt);
            //debugger;
            try {
                req.body.username = req.body.email;

                await this.router.authenticateHandler({force: true})(req, res);
                if (res.locals.error) {
                    res.locals.error = void 0;

                    let {client_id, client_secret, scope} = await this.router.database.findOne('client', {client_id: 'authentificate'});

                    req.body.client_id = client_id;
                    req.body.client_secret = client_secret;
                    req.body.grant_type = 'password';
                    req.body.scope = scope.join(',');

                    await this.router.tokenHandler({})(req, res);
                }

                //res.redirect_local = req.headers.location;

/*                 res.locals.shared = {
                    layout_tabs: [
                        {
                            name: 'clients',
                            icon: 'fas fa-users'
                        }
                    ]
                }
 */
            }
            catch (err) {
                debugger;
                let {code, message} = err;
                res.locals.error = {code, message};
            }
        }
    }

</server-script>