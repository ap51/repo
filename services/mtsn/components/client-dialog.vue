<template>
    <v-dialog v-model="isVisible" max-width="500px" scrollable content-class="client-dialog">
        <v-card>
            <v-card-title>
                <v-icon class="mr-1">fas fa-cog</v-icon>
                <span class="headline">client</span>
            </v-card-title>
            <v-card-text>
                <v-container grid-list-md>
                    <v-layout wrap row>
                        <v-form style="margin: 4px" ref="form" lazy-validation @submit.prevent>
                            <v-flex xs12>
                                <v-text-field v-model="object.app_name"
                                              validate-on-blur
                                              label="Application name"
                                              required
                                              autofocus
                                              color="blue darken-2"
                                              hint="any string value"
                                              :rules="[
                                                  () => !!object.app_name || 'This field is required',
                                              ]"
                                ></v-text-field>
                                <v-text-field v-model="object.client_id"
                                              readonly
                                              validate-on-blur
                                              label="Client ID"
                                              color="blue darken-2"
                                              hint="any string value"
                                              placeholder="enter password to change"
                                ></v-text-field>
                            </v-flex>
                            <v-flex xs12>
                                <v-text-field v-model="object.client_secret"
                                              readonly
                                              validate-on-blur
                                              label="Client secret"
                                              color="blue darken-2"
                                              hint="any string value"
                                ></v-text-field>
                            </v-flex>
<!--
                            <v-flex xs12>
                                <v-text-field v-model="object.scope"
                                              readonly
                                              validate-on-blur
                                              label="Scopes"
                                              required
                                              color="blue darken-2"
                                              hint="any string value"
                                              :rules="[
                                                  () => !!object.scope || 'This field is required',
                                              ]"
                                ></v-text-field>
                            </v-flex>
-->
                        </v-form>
                        <small>*indicates required field</small>

                        <v-data-table v-if="scopes"
                                      item-key="id"
                                      disable-initial-sort

                                      :headers="headers"
                                      :items="scopes"
                                      :search="search"
                                      v-model="selected"
                                      select-all
                                      style="width: 100%; height: 100%;">

                            <template slot="items" slot-scope="props">
                                <td>
                                    <v-checkbox
                                            primary
                                            hide-details
                                            v-model="props.selected">
                                    </v-checkbox>
                                </td>
                                <td>
                                    <div>
                                        <div class="subheading">{{ props.item.name }}</div>
                                        <div class="caption">{{ props.item.description }}</div>
                                    </div>
                                </td>
                            </template>
                        </v-data-table>

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
        props: [
            'visible',
            'object',
            'scopes'
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
            save(user) {
                if (this.$refs.form.validate()) {
                    this.$emit('save', user);
                }
                else this.$bus.$emit('snackbar', 'Data entered don\'t match validation rules');
            }
        },
        watch: {
            'visible': function (newValue, oldValue) {
                newValue && (this.selected = this.scopes.filter(scope => this.object.scope.indexOf(scope.id) !== -1));
            },
            'selected': function (newValue, oldValue) {
                this.visible && (this.object.scope = this.selected.map(scope => scope.id));
            }
        }
    }

    //# sourceURL=client-dialog.js
</script>