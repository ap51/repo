<template>
    <div class="layout-view">
        <!-- <h1>phones database:</h1> -->

<!--
        <v-toolbar flat color="white lighten-2" dense class="">
            &lt;!&ndash;<v-toolbar-title>{{name}}:</v-toolbar-title>&ndash;&gt;
            <v-spacer></v-spacer>
            <v-btn color="red darken-2" flat="flat" :disabled="selected.length === 0" @click.stop="remove"><v-icon class="mr-1 mb-1">fas fa-times</v-icon>remove selected</v-btn>
            <v-btn color="green darken-2" flat="flat" @click.stop="append"><v-icon class="mr-1 mb-1">fas fa-plus</v-icon>append client</v-btn>
        </v-toolbar>
-->

<!--
        <div>
            <v-btn color="red darken-2" flat="flat" :disabled="selected.length === 0" @click.stop="remove"><v-icon class="mr-1 mb-1">fas fa-times</v-icon>remove selected</v-btn>
            <v-btn color="green darken-2" flat="flat" @click.stop="append"><v-icon class="mr-1 mb-1">fas fa-plus</v-icon>append client</v-btn>
        </div>
-->

        <div style="display: flex; align-items: center; width: 100%">
            <v-pagination style="flex: 1" v-model="pagination.page" :length="pages" :total-visible="pages"></v-pagination>
            <v-btn color="red darken-2" flat="flat" :disabled="selected.length === 0" @click.stop="remove"><v-icon class="mr-1 mb-1">fas fa-times</v-icon>remove selected</v-btn>
            <v-btn color="green darken-2" flat="flat" @click.stop="append"><v-icon class="mr-1 mb-1">fas fa-plus</v-icon>append client</v-btn>
        </div>
        
        <v-data-table v-if="this.database.clients"
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
                <td><a @click="edit(props.item.id)">{{ props.item.app_name }}</a></td>
                <td><a @click="edit(props.item.id)">{{ props.item.client_id }}</a></td>
                <td><a @click="edit(props.item.id)">{{ props.item.client_secret }}</a></td>
                <td><a @click="edit(props.item.id)">{{ props.item.scope }}</a></td>
            </template>
        </v-data-table>

         <client-dialog :visible="dialog.visible" :scopes="scopes" :object="dialog.object" @save="save" @cancel="cancel"></client-dialog>
    </div>
</template>

<style scoped>
    .layout-view {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        overflow: auto;
        height: 100%;
        flex-direction: column;
    }


</style>

<script>
    module.exports = {
        extends: component,
        components: {
            'client-dialog': httpVueLoader('client-dialog')
        },
        data() {
            return {
                frame: false,

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
                    { width: "25%", text: 'Application name', value: 'app_name' },
                    { width: "20%", text: 'Client ID', value: 'client_id' },
                    { width: "25%", text: 'Client secret', value: 'client_secret' },
                    { width: "30%", text: 'Scopes', value: 'scope' }
                ],
                activePage: void 0
            }
        },
        created() {
            //this.$request(`${this.$state.base_ui}client-dialog.get`);
        },
        computed: {
            entity() {
                this.pagination.page = this.activePage || this.pagination.page || 1;
                return this.database.clients ? this.database.clients.map(client => this.entities.client[client]) : [];
            },
            scopes() {
                return this.database.scopes ? this.database.scopes.map(scope => this.entities.scope[scope]) : [];
            },
            pages () {
                if (this.pagination.rowsPerPage == null || this.pagination.totalItems == null)
                    return 0;

                if(this.database.clients) {
                    let pages = Math.ceil(this.database.clients.length / this.pagination.rowsPerPage);
                    this.pagination.pages = this.pagination.pages !== pages ? pages : this.pagination.pages;
                    return this.pagination.pages;
                }

            }
        },
        methods: {
            onNames(res) {
                let generated = res.data.results[0];

                this.dialog.object.app_name = generated.login.username;
            },
            onAppend(res) {
                Object.assign(this.dialog.object, res.data.entities.client.created);
            },
            append() {
                //this.dialog.object = this.entities.client.created;
                this.dialog.object = {
                    app_name: 'loading...',
                    client_id: 'loading...',
                    client_secret: 'loading...',
                    scope: [],
                };
                this.dialog.visible = true;
                this.$request('https://randomuser.me/api', null, {callback: this.onNames, no_headers: true});
                this.$request(`${this.$state.base_ui}client-dialog.get`, null, {callback: this.onAppend});
            },
            edit(id) {
                let client = {...this.entities.client[id]};

                this.dialog.object = client;
                this.dialog.visible = true;
            },
            remove() {
                this.activePage = this.pagination.page;
                this.$request(`${this.$state.base_api}clients.remove`, this.selected, {method: 'delete', callback: this.cancel});
            },
            save(client) {
                this.activePage = this.pagination.page;

                this.$request(`${this.$state.base_api}clients.save`, client, {callback: this.saved});
            },
            saved(response, client) {
                client.id && (this.entities.client[client.id] = client);
                this.cancel(response);
            },
            cancel(response) {
                response && response.config.method.toUpperCase() === 'DELETE' && (this.selected = []);
                this.dialog.visible = false;
            }
        }
    }

    //# sourceURL=clients.js
</script>
