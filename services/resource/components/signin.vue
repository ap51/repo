<template>
    <v-dialog v-model="visible" persistent max-width="500px">
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
    </v-dialog>
</template>

<style scoped>
</style>

<script>
    module.exports = {
        extends: component,
        props: [
            'visible'
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
            signin() {
                if (this.$refs.form.validate()) {
                    let data = {
                        email: this.email,
                        password: md5(`${this.email}.${this.password}`),
                        location: window.location.pathname
                    };

                    this.$request('signin', data);
                }
                else this.$bus.$emit('snackbar', 'Data entered doesn\'t match validation rules');
            }
        }
    }

    //# sourceURL=signin.js
</script>