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
                        <div style="display: flex; align-items: center; width: 100%">
                            <v-pagination style="flex: 1" v-model="pagination.page" :length="pages" :total-visible="pages > 6 ? 7 : pages"></v-pagination>
                            <!-- <v-btn color="red darken-2" flat="flat" :disabled="selected.length === 0" @click.stop="remove"><v-icon color="red darken-2" class="mr-1 mb-1">fas fa-times</v-icon>remove</v-btn>
                            <v-btn color="green darken-2" flat="flat" @click.stop="append"><v-icon color="green darken-2" class="mr-1 mb-1">fas fa-plus</v-icon>append</v-btn> -->
                        </div>
                        <v-data-table item-key="id"
                                      disable-initial-sort
                                      hide-actions
                                      hide-headers
                                      :headers="headers"
                                      :items="messages"
                                      :pagination.sync="pagination"

                                      style="width: 100%; max-height: 500px; min-height: 500px; overflow: auto; border-top: 1px solid rgba(0,0,0,0.4); border-bottom: 1px solid rgba(0,0,0,0.4)">

                            <template slot="items" slot-scope="props">
                                <tr style="border-bottom: none;">
                                    <div style="margin: 8px">
                                        <td>
                                            <div style="padding: 4px; width: 50%; border: 1px solid rgba(0,0,0,0.0); border-radius: 4px" :style="props.item.recieved && 'margin-left: 50%'">
                                                <div :class="props.item.recieved ? 'green--text text--darken-2' : 'blue--text text--darken-2' " class="caption">{{ props.item.author.name + ':' }}</div>
                                                <div class="caption">{{ props.item.text }}</div>
                                                <div class="grey--text caption" style="border-top: 1px solid rgba(0,0,0,0.1); text-align: left">{{ new Date(props.item.created).toLocaleString() }}</div>
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
        extends: component,
        props: [
            'visible',
            'object',
            //'messages'
        ],
        data() {
            return {
                activePage: 1,
                pagination: {
                    rowsPerPage: 5
                },
                search: '',
                selected: [],
                headers: [
                    { width: "100%", text: 'Messages', value: 'text' },
                ],
                message: ''
            }
        },
        activated() {
        },
        computed: {
            isVisible: {
                get() {
                    return this.visible;
                },
                set(value) {
                    !value && this.cancel();
                }
            },
            messages() {
                if(this.object.id) {
                    let chat = this.entities.chat[this.object.id];
                    let messages = chat.messages && chat.messages.map(message => {
                        let msg = this.entities.message[message];
                        msg.author = this.entities.user[msg.from];

                        return msg;
                    });

                    let pages = Math.ceil(messages.length / this.pagination.rowsPerPage);
                    this.pagination.page = pages;

                    return messages;
                }

                return [];
            },
            pages () {
                if (this.pagination.rowsPerPage == null || this.pagination.totalItems == null)
                    return 0;

                if(this.messages) {
                    let pages = Math.ceil(this.messages.length / this.pagination.rowsPerPage);
                    this.pagination.pages = this.pagination.pages !== pages ? pages : this.pagination.pages;
                    return this.pagination.pages;
                }

            }
        },
        methods: {
            cancel() {
                this.$emit('cancel');
            },
            send() {
                this.message = this.message.trim();

                if(this.message) {
                    this.$emit('send', {chat: this.object.id, text: this.message, from: this.current_user.id});
                    this.message = '';
                }
/*
                this.$socket.emit('chat:message', {chat: this.object.id, text: this.message, from: this.current_user.id}, (response) => {
                    this.message = '';
                    console.log('SOCKET:', response);
                    this.entities.message[response.id] = response;
                    //Vue.set(Vue.prototype.$state.entities, 'message', response);
                });
*/

                console.log('sending...')
            },
        },
        watch: {
            'visible': function (newValue, oldValue) {
                //newValue && this.pagination.page < 2 && (this.pagination.page = this.pages);

                //newValue && (this.selected = this.scopes.filter(scope => this.object.scope.indexOf(scope.id) !== -1));
            },
            'selected': function (newValue, oldValue) {
                //this.visible && (this.object.scope = this.selected.map(scope => scope.id));
            }
        }
    }

    //# sourceURL=chat-dialog.js
</script>