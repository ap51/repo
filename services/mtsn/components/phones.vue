<template>
    <div class="layout-view">
        <!-- <h1>phones database:</h1> -->

<!--         <div>
            <v-btn color="red darken-2" flat="flat" :disabled="selected.length === 0" @click.stop="remove"><v-icon class="mr-1 mb-1">fas fa-times</v-icon>remove selected</v-btn>
            <v-btn color="green darken-2" flat="flat" @click.stop="append"><v-icon class="mr-1 mb-1">fas fa-plus</v-icon>append phone</v-btn>
        </div>
 -->
<!--
        <v-toolbar flat color="white lighten-2" dense class="">
            <v-toolbar-title>{{name}}:</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn flat="flat" :disabled="selected.length === 0" @click.stop="remove"><v-icon color="red darken-2" class="mr-1 mb-1">fas fa-times</v-icon>remove</v-btn>
            <v-btn flat="flat" @click.stop="append"><v-icon color="green darken-2" class="mr-1 mb-1">fas fa-plus</v-icon>append</v-btn>
        </v-toolbar>
-->

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
                <td><a @click="edit(props.item.id)">{{ props.item.number }}</a></td>
                <td><a @click="edit(props.item.id)">{{ props.item.owner }}</a></td>
            </template>
        </v-data-table>

         <phone-dialog :visible="dialog.visible" :phone="dialog.object" @save="save" @cancel="cancel"></phone-dialog>
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

    .table {
        min-width: 100%;
        max-width: 100%;
    }

    /*
        .table {
            min-width: 60vw;
            max-width: 60vw;
        }
    */

</style>

<script>
    module.exports = {
        extends: component,
        components: {
            'phone-dialog': httpVueLoader('phone-dialog')
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
                    { width: "30%", text: 'Number', value: 'number' },
                    { width: "70%", text: 'Owner', value: 'owner' }
                ],
                activePage: void 0
            }
        },
        created() {
            //console.log(this.database);
        },
        computed: {
            entity() {
                this.pagination.page = this.activePage || this.pagination.page || 1;
                return this.database.users ? (this.entities.user.current.phones || []).map(phone => this.entities.phone[phone]).map(phone => {phone.number = (phone.number + '').replace(/(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/, '+$1 ($2) $3 - $4 - $5'); return phone}) : [];
            },
            pages () {
                if (this.pagination.rowsPerPage == null || this.pagination.totalItems == null)
                    return 0;

                if(this.entities.user) {
                    let pages = Math.ceil((this.entities.user.current.phones || []).length / this.pagination.rowsPerPage);
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
            edit(id) {
                let phone = this.entities.phone[id];
                console.log(phone);
                this.dialog.object = {...phone};
                this.dialog.visible = true;
            },
            remove() {
                this.activePage = this.pagination.page;
                this.$request(`${this.$state.base_api}phones.remove`, this.selected, {method: 'delete', callback: this.cancel});
            },
            save(phone) {
                this.activePage = this.pagination.page;
                this.$request(`${this.$state.base_api}phones.save`, phone, {callback: this.cancel});
            },
            cancel(response) {
                response && response.config.method.toUpperCase() === 'DELETE' && (this.selected = []);
                this.dialog.visible = false;
            }
        }
    }

    //# sourceURL=phones.js
</script>
