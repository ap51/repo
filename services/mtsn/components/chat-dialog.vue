<template>
    <v-dialog v-model="isVisible" max-width="500px" scrollable content-class="client-dialog" hide-overlay>
        <v-card>
            <v-card-title>
                <v-icon class="blue--text text--darken-2 mr-1">far fa-comment</v-icon>
                <span class="headline blue--text text--darken-2">chat</span>
            </v-card-title>
            <v-card-text>
                <v-container grid-list-md>
                    <v-layout wrap row>
                        <v-form style="margin: 4px" ref="form" lazy-validation @submit.prevent>
                            <v-flex xs12>
                                <v-text-field v-model="object.name"
                                              validate-on-blur
                                              label="Chat name"
                                              required
                                              autofocus
                                              color="blue darken-2"
                                              hint="any string value"
                                              :rules="[
                                                  () => !!object.name || 'This field is required',
                                              ]"
                                ></v-text-field>
                            </v-flex>
                            <small>*indicates required field</small>
                        </v-form>

                        <friends mode="list" :object="object" @selected="onFriendSelected" style="min-height: 490px"></friends>

                    </v-layout>
                </v-container>
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
    .table {
        width: 100%; height: auto;
    }

    .client-dialog {
        max-height: 200px;
    }
</style>

<script>
    module.exports = {
        extends: component,
        components: {
            'friends': window.vm.auth ? httpVueLoader(`friends_${window.vm.auth.public_id}`) : {}
        },
        props: [
            'visible',
            'object'
        ],
        data() {
            return {
                search: '',
                selected: [],
                headers: [
                    { width: "100%", text: 'Scope', value: 'name' },
                ],

            }
        },
        mounted() {
        },
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
            save(chat) {
                if (this.$refs.form.validate()) {
                    this.$emit('save', chat);
                }
                else this.$bus.$emit('snackbar', 'Data entered don\'t match validation rules');
            },
            onFriendSelected(selection) {
                this.object.users = selection;
            }
        },
        watch: {
            'visible': function (newValue, oldValue) {
                //!newValue && this.$emit('cancel');
                //newValue && (this.selected = this.scopes.filter(scope => this.object.scope.indexOf(scope.id) !== -1));
            },
            'selected': function (newValue, oldValue) {
                //this.visible && (this.object.scope = this.selected.map(scope => scope.id));
            }
        }
    }

    //# sourceURL=chat-dialog.js
</script>