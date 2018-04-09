<template>
    <div class="layout-view">
        <!-- <h1>phones database:</h1> -->

        <div>
            <v-btn color="red darken-2" flat="flat" :disabled="selected.length === 0" @click.stop="remove"><v-icon class="mr-1 mb-1">fas fa-times</v-icon>remove selected</v-btn>
            <v-btn color="green darken-2" flat="flat" @click.stop="append"><v-icon class="mr-1 mb-1">fas fa-plus</v-icon>append user</v-btn>
        </div>

        <div class="text-xs-center pt-2">
            <v-pagination v-model="pagination.page" :length="pages" :total-visible="pages"></v-pagination>
        </div>
        
        <v-data-table v-if="this.database.users"
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
                <td><a @click="edit(props.item.id)">{{ props.item.email }}</a></td>
                <td><a @click="edit(props.item.id)">{{ props.item.name }}</a></td>
                <td><a @click="edit(props.item.id)">{{ props.item.group }}</a></td>
            </template>
        </v-data-table>

         <user-dialog :visible="dialog.visible" :object="dialog.object" @save="save" @cancel="cancel"></user-dialog>
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

/*     .table {
        min-width: 60vw;
        max-width: 60vw;
    }
 */
</style>

<script>
    module.exports = {
        extends: component,
        components: {
            'user-dialog': httpVueLoader('user-dialog')
        },
        data() {
            return {
                frame: false,

                dialog: {
                    visible: false,
                    object: {}
                },

                pagination: {
                    rowsPerPage: 14
                },

                search: '',
                selected: [],
                headers: [
                    { width: "35%", text: 'EMail', value: 'email' },
                    { width: "35%", text: 'Name', value: 'name' },
                    { width: "30%", text: 'Access group', value: 'group' }
                ],
                activePage: void 0
            }
        },
        computed: {
            entity() {
                this.pagination.page = this.activePage || this.pagination.page || 1;
                return this.database.users ? this.database.users.map(user => this.entities.user[user]) : [];
            },
            pages () {
                if (this.pagination.rowsPerPage == null || this.pagination.totalItems == null)
                    return 0;

                if(this.database.users) {
                    let pages = Math.ceil(this.database.users.length / this.pagination.rowsPerPage);
                    this.pagination.pages = this.pagination.pages !== pages ? pages : this.pagination.pages;
                    return this.pagination.pages;
                }

            }
        },
        methods: {
            onNames(res) {
                let generated = res.data.results[0];

                this.dialog.object = {
                    name: `${generated.name.title}. ${generated.name.first} ${generated.name.last}`,
                    email: generated.email,
                    password: generated.login.password,
                    group: 'users'
                };
            },
            append() {
                this.dialog.object = {
                    name: 'loading...',
                    email: 'loading...',
                };
                this.dialog.visible = true;
                this.$request('https://randomuser.me/api', null, {callback: this.onNames, no_headers: true});
            },
            edit(id) {
                let user = {...this.entities.user[id]};
                user.password = '';

                this.dialog.object = user;
                this.dialog.visible = true;
            },
            remove() {
                this.activePage = this.pagination.page;
                this.$request(`${this.$state.base_api}users.remove`, this.selected, {method: 'delete', callback: this.cancel});
            },
            save(user) {
                this.activePage = this.pagination.page;
                user = {...user};
                user.password = user.password ? md5(`${user.email}.${user.password}`) : void 0;

                !user.password && (delete user.password);

                this.$request(`${this.$state.base_api}users.save`, user, {callback: this.cancel});
            },
            cancel(response) {
                response && response.data.method === 'DELETE' && (this.selected = []);
                this.dialog.visible = false;
            }
        }
    }

    //# sourceURL=users.js
</script>
