<template>
    <div class="layout-view">
        <div style="display: flex; align-items: center; width: 100%">
            <v-pagination style="flex: 1" v-model="pagination.page" :length="pages" :total-visible="pages"></v-pagination>
            <v-btn color="red darken-2" flat="flat" :disabled="selected.length === 0" @click.stop="remove"><v-icon color="red darken-2" class="mr-1 mb-1">fas fa-times</v-icon>remove</v-btn>
            <v-btn color="green darken-2" flat="flat" @click.stop="append"><v-icon color="green darken-2" class="mr-1 mb-1">fas fa-plus</v-icon>append</v-btn>
        </div>

        <v-data-table v-if="this.database.users"
                      style="border-top: 1px solid rgb(128, 128, 128)"
                      item-key="id"
                      disable-initial-sort

                      :headers="headers"
                      :items="entity"
                      :search="search"
                      v-model="selected"
                      select-all
                      class="elevation-1"
                      :pagination.sync="pagination"
                      hide-actions>

            <template slot="items" slot-scope="props">
                <td>
                    <v-checkbox
                            primary
                            hide-details
                            v-model="props.selected">
                    </v-checkbox>
                </td>
                <td>
                    <a @click="messages(props.item.id)">    
                        <v-badge left overlap color="green darken-2">
                            <!-- <span slot="badge">222</span> -->
                            <v-icon slot="badge" dark>fas fa-exclamation</v-icon>
                            <!-- <span slot="badge">2</span> -->
                            <span>{{ props.item.name }}</span>
                        </v-badge>
                    </a>
                </td>
                <!--<td><a @click="edit(props.item.id)">{{ props.item.owner }}</a></td>-->
            </template>
        </v-data-table>

        <messages :visible="dialog.visible==='messages'" :object="dialog.object" @send="send" @cancel="cancel"></messages>

        <!--<chat-dialog :visible="dialog.visible" :object="dialog.object" @send="send" @cancel="cancel"></chat-dialog>-->
    </div>
</template>

<style scoped>
    .badge__badge {
        width: 16px; 
        height: 16px; 
        font-size: 12px;
    }

    .badge__badge > i {
        font-size: 11px;
    }

    .layout-view {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        overflow: auto;
        height: 100%;
        flex-direction: column;
    }

    .table {
        min-width: 100%;
        max-width: 100%;
    }
</style>

<script>
    module.exports = {
        extends: component,
        components: {
            //'chat-dialog': httpVueLoader('chat-dialog'),
            'messages': httpVueLoader('messages')
        },
        data() {
            return {
                dialog: {
                    visible: false,
                    object: {}
                },

                pagination: {
                    rowsPerPage: 8
                },

                search: '',
                selected: [],
                headers: [
                    { width: "100%", text: 'Name', value: 'name' },
                    //{ width: "70%", text: 'Owner', value: 'owner' }
                ],
                activePage: void 0,
                active: void 0
                //messages: []
            }
        },
        computed: {
            entity() {
                this.pagination.page = this.activePage || this.pagination.page || 1;
                return this.database.users ? (this.entities.user.current.chats || []).map(chat => this.entities.chat[chat]) : [];
            },
            pages () {
                if (this.pagination.rowsPerPage == null || this.pagination.totalItems == null)
                    return 0;

                if(this.entities.user) {
                    let pages = Math.ceil((this.entities.user.current.chats || []).length / this.pagination.rowsPerPage);
                    this.pagination.pages = this.pagination.pages !== pages ? pages : this.pagination.pages;
                    return this.pagination.pages;
                }

            }
        },
        methods: {
            onNames(res) {
                let generated = res.data.results[0];

                this.dialog.object.owner = `${generated.name.title}. ${generated.name.first} ${generated.name.last}`;
            },
            append() {
                this.dialog.object = {
                    number: '' + Math.floor(Math.random() * 90000000000) + 10000000000,
                    owner: 'loading...'
                };
                this.dialog.visible = true;
                this.$request('https://randomuser.me/api', null, {callback: this.onNames, no_headers: true});
            },
            messages(id) {
                this.$request(`${this.$state.base_ui}messages:${id}.getByChat`, void 0, {on_merge: (data) => {
                    this.active = id;

                    let chat = this.entities.chat[id];
                    this.dialog.object = {...chat};
                    this.dialog.visible = 'messages';
                }});
            },
            remove() {
                //this.activePage = this.pagination.page;
                //this.$request(`${this.$state.base_api}phones.remove`, this.selected, {method: 'delete', callback: this.cancel});
            },
            send(data) {
                //this.activePage = this.pagination.page;
                this.$request(`${this.$state.base_ui}messages.send`, data, {callback: function (res) {
                        console.log(res);
                }});
/*
                this.$request(`${this.$state.base_ui}chats.send`, data, {callback: function (res) {
                        console.log(res);
                }});
*/
            },
            save(phone) {
                //this.activePage = this.pagination.page;
                //this.$request(`${this.$state.base_api}phones.save`, phone, {callback: this.cancel});
            },
            cancel(response) {
                response && response.config.method.toUpperCase() === 'DELETE' && (this.selected = []);
                this.dialog.visible = false;
            }
        }
    }

    //# sourceURL=chats.js
</script>