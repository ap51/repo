<template>
    <v-dialog v-model="isVisible" max-width="600px" scrollable content-class="client-dialog" hide-overlay>
        <v-card>
            <v-card-title>
                <v-icon class="mr-1 blue--text text--darken-2">far fa-comments</v-icon>
                <span class="headline blue--text text--darken-2">{{object.name}}</span>
            </v-card-title>
            <v-card-text>
                <v-container grid-list-md>
                    <v-layout wrap row style="position: relative">
                        <div style="display: flex; align-items: center; width: 100%">
                            <v-pagination style="flex: 1" v-model="pagination.page" :length="pages" :total-visible="pages > 6 ? 7 : pages"></v-pagination>
                        </div>

                        <v-data-table id="tbl" v-scroll:#tbl="loadMore"
                                      item-key="id"
                                      disable-initial-sort
                                      hide-actions
                                      hide-headers
                                      :headers="headers"
                                      :items="messages"
                                      :pagination.sync="pagination"

                                      style="width: 100%; max-height: 450px; min-height: 450px; overflow: auto; border-top: 1px solid rgba(0,0,0,0.4); border-bottom: 1px solid rgba(0,0,0,0.4)">

                            <template slot="items" slot-scope="props">
                                <tr style="border-bottom: none;">
                                    <div style="margin: 8px">
                                        <td>
                                            <div style="padding: 4px; width: 50%; border: 1px solid rgba(0,0,0,0.0); border-radius: 4px" :style="props.item.recieved && 'margin-left: 50%'">
                                                <div :class="props.item.recieved ? 'blue--text text--darken-2' : 'green--text text--darken-2' " class="caption">{{ props.item.author.name + ':' }}</div>
                                                <div class="caption">{{ props.item.text }}</div>
                                                <div class="grey--text caption" style="border-top: 1px solid rgba(0,0,0,0.1); text-align: left">
                                                    {{ new Date(props.item.created).toLocaleString() }}

                                                    <v-icon :class="props.item.seen.length === 1 ? 'grey--text' : 'green--text text--darken-2'" style="font-size: 12px; margin-bottom: 2px">{{object.users.length === props.item.seen.length ? 'fas fa-check-circle' : 'far fa-check-circle'}}</v-icon>


                                                </div>
                                            </div>
                                        </td>
                                    </div>
                                </tr>
                            </template>
                        </v-data-table>

                        <div style="width: 100%; position: relative">
                            <v-text-field v-model="message"
                                          validate-on-blur
                                          label="Your message:"
                                          placeholder="type message here"
                                          autofocus
                                          color="blue darken-2"
                                          hint="to send press ctrl+enter"
                                          persistent-hint
                                          multi-line
                                          rows="3"
                                          no-resize
                                          @keyup.ctrl.enter="send">
                            </v-text-field>
                            <v-btn absolute top right fab small flat icon color="blue darken-2" style="top: 4px" @click="send">
                                <v-icon style="font-size: 20px; height: 22px;">fas fa-arrow-alt-circle-up</v-icon>
                            </v-btn>
                            <v-btn absolute top right fab small flat icon color="blue darken-2" style="top: 50px" @click="attach">
                                <v-icon style="font-size: 20px; height: 22px;">fas fa-paperclip</v-icon>
                            </v-btn>

                        </div>
                    </v-layout>
                </v-container>
            </v-card-text>
            <v-card-actions>
                <v-btn color="blue darken-2" flat @click.native="edit">chat details</v-btn>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-2" flat @click.native="close">close</v-btn>
            </v-card-actions>
        </v-card>

        <chat-dialog :visible="dialog.visible" :object="dialog.object" @save="save" @cancel="cancel"></chat-dialog>
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
        components: {
            'chat-dialog': httpVueLoader('chat-dialog')
        },
        props: [
            'visible',
            'object',
            //'messages'
        ],
        data() {
            return {
                dialog: {
                    visible: false,
                    object: {}
                },

                activePage: 1,
                pagination: {
                    rowsPerPage: 6,
                    sortBy: 'created',
                    descending: false
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
                    !value && this.close();
                }
            },
            messages() {
                if(this.object.id && this.entities.chat) {
                    let chat = this.entities.chat[this.object.id];
                    let messages = chat && chat.messages && chat.messages.map(message => {
                        let msg = this.entities.message[message];

                        let id = this.$state.auth.id;
                        msg.seen = msg.seen || [];
                        if(this.isVisible && msg.seen.indexOf(id) === -1) {
                            msg.seen.push(id);
                            this.$request(`${this.$state.base_ui}messages:${msg.id}.update`, {...msg});
                        }

                        msg.author = this.entities.user[msg.from];
                        return msg;
                    });

                    let pages = (messages && Math.ceil(messages.length / this.pagination.rowsPerPage)) || 0;
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
            loadMore(...args) {
                //console.log('SCROLLED', args);
            },
            close() {
                this.$emit('cancel');
            },
            attach() {
                console.log('attaching...')
            },
            send() {
                this.message = this.message.trim();

                if(this.message) {
                    this.$emit('send', {chat: this.object.id, text: this.message, from: this.current_user.id});
                    this.message = '';
                }
                console.log('sending...')
            },
            edit() {
                //this.dialog.object = {...chat};
                this.$request(`${this.$state.base_ui}friends.get`);
                this.dialog.object = {...this.object};
                this.dialog.visible = true;
            },
            cancel() {
                this.dialog.visible = false;
            },
            save(data) {
                Object.assign(this.object, data);
                this.$request(`${this.$state.base_ui}chats.save`, data, {callback: this.cancel});
            }
        },
        watch: {
            'visible': function (newValue, oldValue) {
                //!newValue && this.$emit('cancel');
                //newValue && this.pagination.page < 2 && (this.pagination.page = this.pages);

                //newValue && (this.selected = this.scopes.filter(scope => this.object.scope.indexOf(scope.id) !== -1));
            },
            'selected': function (newValue, oldValue) {
                //this.visible && (this.object.scope = this.selected.map(scope => scope.id));
            }
        }
    }

    //# sourceURL=messages.js
</script>