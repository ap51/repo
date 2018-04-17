<template>
    <v-dialog v-model="isVisible" max-width="600px" scrollable content-class="client-dialog">
        <v-card>
            <v-card-title>
                <v-icon class="mr-1">far fa-comments</v-icon>
                <span class="headline">{{object.name}}</span>
            </v-card-title>
            <v-card-text>
                <v-container grid-list-md>
                    <v-layout wrap row>
                        <v-data-table item-key="id"
                                      disable-initial-sort
                                      hide-actions
                                      hide-headers
                                      :headers="headers"
                                      :items="messages"

                                      style="width: 100%; height: 100%; border-top: 1px solid rgba(0,0,0,0.4); border-bottom: 1px solid rgba(0,0,0,0.0)">

                            <template slot="items" slot-scope="props">
                                <tr style="border-bottom: none;">
                                    <div style="margin: 8px">
                                        <td>
                                            <div style="padding: 4px; width: 50%; border: 1px solid rgba(0,0,0,0.0); border-radius: 4px" :style="props.item.recieved && 'margin-left: 50%'">
                                                <div :class="props.item.recieved ? 'green--text text--darken-2' : 'blue--text text--darken-2' " class="caption">{{ props.item.author.name + ':' }}</div>
                                                <div class="subheading">{{ props.item.text }}</div>
                                                <div class="grey--text" class="caption" style="border-top: 1px solid rgba(0,0,0,0.1); text-align: left">{{ new Date(props.item.created).toLocaleString() }}</div>
                                            </div>
                                        </td>
                                    </div>
                                </tr>
                            </template>
                        </v-data-table>

                        <v-text-field v-model="message"
                                      validate-on-blur
                                      label="Your message:"
                                      placeholder="type message here"
                                      autofocus
                                      color="green darken-2"
                                      hint="to send press ctrl+enter"
                                      persistent-hint
                                      multi-line
                                      rows="2"
                                      no-resize
                                      @keyup.ctrl.enter="send"
                        ></v-text-field>
                    </v-layout>
                </v-container>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-2" flat @click.native="cancel">close</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style scoped>
    tr {
        border-bottom: none;
    }
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
            'messages'
        ],
        data() {
            return {
                search: '',
                selected: [],
                headers: [
                    { width: "100%", text: 'Messages', value: 'text' },
                ],
                message: ''
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
            send() {
                this.message = '';
                console.log('sending...')
            },
        },
        watch: {
            'visible': function (newValue, oldValue) {
                //newValue && (this.selected = this.scopes.filter(scope => this.object.scope.indexOf(scope.id) !== -1));
            },
            'selected': function (newValue, oldValue) {
                //this.visible && (this.object.scope = this.selected.map(scope => scope.id));
            }
        }
    }

    //# sourceURL=chat-dialog.js
</script>