<template>
    <v-dialog v-model="isVisible" hide-overlay persistent max-width="400px" hide-overlay>
        <v-card>
            <v-card-title>
                <v-icon class="mr-1 blue--text text--darken-2">fas fa-user-circle</v-icon>
                <span class="headline blue--text text--darken-2">sign up</span>
            </v-card-title>
            <v-card-text>
                <v-container grid-list-md>
                    <v-layout wrap>
                        <v-form ref="form" lazy-validation @submit.prevent>
                            <v-flex xs12>
                                <v-text-field v-model="object.name"
                                              validate-on-blur
                                              label="Name"
                                              required
                                              prepend-icon="fas fa-user"
                                              autofocus
                                              color="blue darken-2"
                                              hint="for example, Joe Dou"
                                              :rules="[
                                                  () => !!object.password || 'This field is required',
                                              ]"
                                ></v-text-field>
                            </v-flex>
                            <v-flex xs12>
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
                            </v-flex>
                            <v-flex xs12>
                                <v-text-field v-model="object.password"
                                              validate-on-blur
                                              label="Password"
                                              required
                                              prepend-icon="fas fa-key"
                                              color="blue darken-2"
                                              hint="any string value"
                                              :rules="[
                                                  () => !!object.password || 'This field is required',
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
                <v-btn color="blue darken-2" flat @click.native="cancel">cancel</v-btn>
                <v-btn color="blue darken-2" flat @click.native="submit({...object})">submit</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style scoped>

</style>

<script>
    module.exports = {
        props: [
            'visible',
            'object'
        ],
        updated() {
            console.log('ACTIVE');
        },
        computed: {
            copy: {
                cache: false,
                get: function () {
                    return {...this.object};
                }
            },
            isVisible: {
                get() {
                    return this.visible;
                },
                set(value) {
                    !value && this.cancel();
                }
            }
        },
        methods: {
            cancel() {
                this.$emit('cancel');
            },
            submitted() {
                this.$emit('save', this.object);
            },
            submit(user) {
                if (this.$refs.form.validate()) {

                    user.password = md5(`${user.email}.${user.password}`);
                    this.$request(`${this.$state.base_api}signup.submit`, user, {callback: this.submitted});

                    //this.$emit('save', user);
                }
                else this.$bus.$emit('snackbar', 'Data entered don\'t match validation rules');
            }
        },
        watch: {
            'visible': function (newValue, oldValue) {
            }
        }
    }

    //# sourceURL=signup.js
</script>