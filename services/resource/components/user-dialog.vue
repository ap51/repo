<template>
    <v-dialog v-model="isVisible" max-width="400px">
        <v-card>
            <v-card-title>
                <v-icon class="mr-1">fas fa-user</v-icon>
                <span class="headline">user</span>
            </v-card-title>
            <v-card-text>
                <v-container grid-list-md>
                    <v-layout wrap>
                        <v-form ref="form" lazy-validation @submit.prevent>
                            <v-flex xs12>
                                <v-text-field v-model="object.email"
                                              validate-on-blur
                                              label="EMail"
                                              required
                                              prepend-icon="fas fa-at"
                                              autofocus
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
                                              autofocus
                                              color="blue darken-2"
                                              hint="any string value"
                                              placeholder="enter password to change"
                                              :rules="[
                                                  () => (!!!object.id && !!object.password) || ((!!object.id && !!!object.password)) || ((!!object.id && !!object.password)) || 'This field is required'
                                              ]"
                                ></v-text-field>
                            </v-flex>
                            <v-flex xs12>
                                <v-text-field v-model="object.name"
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
                            </v-flex>
                            <v-flex xs12>
                                <v-text-field v-model="object.group"
                                              validate-on-blur
                                              label="Group"
                                              required
                                              prepend-icon="fas fa-user-secret"
                                              color="blue darken-2"
                                              hint="any string value"
                                              :rules="[
                                                  () => !!object.group || 'This field is required',
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
                <v-btn color="blue darken-2" flat @click.native="save(object)">save</v-btn>
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
        computed: {
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
            save(user) {
                if (this.$refs.form.validate()) {
                    this.$emit('save', user);
                }
                else this.$bus.$emit('snackbar', 'Data entered don\'t match validation rules');
            }
        },
        watch: {
            'visible': function (newValue, oldValue) {
            }
        }
    }

    //# sourceURL=user-dialog.js
</script>