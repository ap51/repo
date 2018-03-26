<template>
    <v-dialog v-if="object" v-model="visible" persistent max-width="400px">
        <v-card>
            <v-card-title>
                <v-icon class="mr-1">fas fa-user-circle</v-icon>
                <span class="headline">account</span>
            </v-card-title>
            <v-card-text>
                <v-container grid-list-md>
                    <v-layout>
                        <v-card flat width="100%" class="profile">
                            <v-card-text>
                                <v-container grid-list-md>
                                    <v-layout wrap>
                                        <v-form ref="form" lazy-validation @submit.prevent>
                                            <v-flex xs12>
                                                <v-text-field v-model="object.name"
                                                              autofocus
                                                              validate-on-blur
                                                              label="Name"
                                                              required
                                                              prepend-icon="fas fa-user"
                                                              color="blue darken-2"
                                                              hint="any string value"
                                                              :rules="[
                                                      () => !!object.name || 'This field is required',
                                                  ]"
                                                ></v-text-field>
                                                <v-text-field v-model="object.email"
                                                              validate-on-blur
                                                              label="EMail"
                                                              required
                                                              prepend-icon="fas fa-at"
                                                              color="blue darken-2"
                                                              hint="any string value"
                                                              :rules="[
                                                      () => !!object.email || 'This field is required',
                                                  ]"
                                                ></v-text-field>
                                                <v-text-field v-model="object.password"
                                                              :required="!!!object.id"
                                                              validate-on-blur
                                                              label="Password"
                                                              prepend-icon="fas fa-key"
                                                              color="blue darken-2"
                                                              hint="any string value"
                                                              placeholder="enter password to change"
                                                              :rules="[
                                                      () => (!!!object.id && !!object.password) || ((!!object.id && !!!object.password)) || ((!!object.id && !!object.password)) || 'This field is required'
                                                  ]"
                                                ></v-text-field>
                                            </v-flex>
                                        </v-form>
                                    </v-layout>
                                </v-container>
                                <small>*indicates required field</small>
                            </v-card-text>
                        </v-card>
                    </v-layout>
                </v-container>
            </v-card-text>
            <v-card-actions>
                <v-btn color="blue darken-2" flat @click.native="signout()">sign out</v-btn>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-2" flat @click.native="cancel">cancel</v-btn>
                <v-btn color="blue darken-2" flat @click.native="save({...object})">save</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style scoped>
    .flex {
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }

</style>

<script>
    module.exports = {
        extends: component,
        props: [
            'visible',
            'object'
        ],
        data() {
            return {
                email: '',
                password: ''
            }
        },
        methods: {
            cancel() {
                this.$emit('cancel');
            },
            signout() {
                let data = {

                };

                cache = {};
                this.$request(`${Vue.prototype.$state.base_api}signout.submit`, data);
            },
            save(user) {
                if (this.$refs.form.validate()) {

                    user.password = user.password ? md5(`${user.email}.${user.password}`) : void 0;

                    !user.password && (delete user.password);

                    this.$request(`${this.$state.base_api}signout.save`, user, {callback: this.cancel});

                    delete this.object.password;
                }
                else this.$bus.$emit('snackbar', 'Data entered don\'t match validation rules');
            }
        }
    }

    //# sourceURL=signout.js
</script>