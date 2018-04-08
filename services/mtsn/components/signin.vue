<template>
    <div>
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
                <v-btn color="blue darken-2" flat @click.native="signup()">sign up</v-btn>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-2" flat @click.native="cancel()">cancel</v-btn>
                <v-btn color="blue darken-2" flat @click.native="signin()">sign in</v-btn>
            </v-card-actions>
        </v-card>

        <signup :visible="dialog.visible" :object="dialog.object" @save="registrate" @cancel="cancelRegistration"></signup>
    </div>
</template>

<style scoped>
</style>

<script>
    module.exports = {
        extends: component,
        components: {
            'signup': httpVueLoader('signup')
        },
        props: [
            'reset'
        ],
        data() {
            return {
                dialog: {
                    visible: false,
                    object: {}
                }
            }
        },
        methods: {
            registrate(user) {
                this.email = user.email;
                this.password = user.password;

                this.dialog.visible = false;
            },
            cancelRegistration() {
                this.dialog.visible = false;
            },
            onNames(res) {
                let generated = res.data.results[0];

                this.dialog.object = {
                    email: generated.email,
                    name: `${generated.name.first} ${generated.name.last}`,
                    password: generated.login.password
                };
            },
            signup() {
                this.dialog.object = {
                    email: '',
                    name: '',
                    password: ''
                };
                this.dialog.visible = true;
                this.$request('https://randomuser.me/api', null, {callback: this.onNames});
            },
            cancel() {
                this.$emit('cancel');

            },
            submitted() {
                this.$emit('cancel');
                this.clearCache({reload: true});
            },
            signin() {
                if (this.$refs.form.validate()) {
                    let data = {
                        email: this.email,
                        password: md5(`${this.email}.${this.password}`),
                        //location: 'about'
                    };

                    //this.$request('signin.submit', data, { encode: true });
                    this.$request(`${Vue.prototype.$state.base_api}signin.submit`, data, { callback: this.submitted, encode: true });

                }
                else this.$bus.$emit('snackbar', 'Data entered don\'t match validation rules');
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