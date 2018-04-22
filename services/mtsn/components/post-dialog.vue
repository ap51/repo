<template>
    <v-dialog v-model="isVisible" max-width="600px" hide-overlay>
        <v-card>
            <v-card-title>
                <v-icon class="mr-1 blue--text text--darken-2">fas fa-mobile</v-icon>
                <span class="headline blue--text text--darken-2">Post</span>
            </v-card-title>
            <v-card-text>
                <v-container grid-list-md>
                    <v-layout wrap>
                        <v-form ref="form" lazy-validation @submit.prevent>
                            <v-flex xs12>
                                <v-text-field v-model="object.title"
                                              label="Title"
                                              required
                                              prepend-icon="fas fa-mobile"
                                              autofocus
                                              color="blue darken-2"
                                              hint="any string"
                                              :rules="[
                                                  () => !!object.title || 'This field is required',
                                              ]"
                                ></v-text-field>
                            </v-flex>
                            <v-flex xs12>
                                <v-text-field v-model="object.text"
                                              validate-on-blur
                                              label="Text"
                                              required
                                              prepend-icon="fas fa-user"
                                              color="blue darken-2"
                                              hint="any string value"
                                              multi-line
                                              counter="1024"
                                              :rules="[
                                                  () => !!object.text || 'This field is required',
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
            save(object) {
                if (this.$refs.form.validate()) {
                    this.$emit('save', object);
                }
                else this.$bus.$emit('snackbar', 'Data entered don\'t match validation rules');
            }
        },
        watch: {
            'visible': function (newValue, oldValue) {
            }
        }
    }

    //# sourceURL=post-dialog.js
</script>