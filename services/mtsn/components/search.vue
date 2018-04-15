<template>
    <div class="layout-view">
        <v-card flat width="50vw">
            <v-container grid-list-lg>
                <v-layout column>
                    <v-flex xs12>
                        <v-toolbar flat color="white lighten-2" dense class="">

                            <v-icon color="primary" class="mr-2">fas fa-chevron-right</v-icon>

                            <v-text-field v-model="text" @keyup.enter="find" single-line hide-details autofocus clearable placeholder="search string..." hint="any regular expression"></v-text-field>
<!--
                            <v-btn icon color="primary" @click="find">
                                <v-icon>fas fa-search</v-icon>
                            </v-btn>
-->
                        </v-toolbar>
                    </v-flex>

<!--
                    <div v-if="text && !entity.length" class="layout-view">
                        <h1>page not found:</h1>
                        <v-icon color="red darken-2" class="shadow">fas fa-unlink fa-3x</v-icon>
                        <h1>"{{address.ident}}"</h1>

                        <v-btn color="blue darken-2" flat="flat" @click.stop="reload()">Try again</v-btn>
                    </div>
-->

                    <v-flex flat xs12>
<!--
                        <v-toolbar flat color="white lighten-2" dense class="">
                           &lt;!&ndash; <v-toolbar-title>{{name}}:</v-toolbar-title>&ndash;&gt;
                            <v-spacer></v-spacer>
                        </v-toolbar>
-->

                        <div style="display: flex; align-items: center;">
                            <v-pagination style="flex: 1" v-model="pagination.page" :length="pages" :total-visible="pages"></v-pagination>
                            <v-btn color="green darken-2" flat :disabled="selected.length === 0" @click.stop="append"><v-icon color="green darken-2" class="mr-1 mb-1">fas fa-plus</v-icon>append to friends</v-btn>
                        </div>

                        <v-data-table item-key="id"
                                      disable-initial-sort

                                      :headers="headers"
                                      :items="entity"
                                      v-model="selected"
                                      select-all
                                      class=""
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
                                <td >
                                    <div style="display: flex; align-items: center">
                                        <v-icon class="mr-2" :disabled="!props.item.isFriend" color="orange darken-2" style="font-size: 20px; height: 22px;">fas fa-user-circle</v-icon>
                                        <div style="flex: 1" class=""><a :href="'./feed:' + props.item.public_id" @click.prevent="$router.push('feed:' + props.item.public_id)">{{ props.item.name }}</a></div>

                                        <v-btn icon>
                                            <v-icon color="accent" style="font-size: 20px; height: 22px;">far fa-comment</v-icon>
                                        </v-btn>
                                    </div>

                                </td>
                            </template>
                        </v-data-table>

                    </v-flex>
                </v-layout>
            </v-container>
        </v-card>
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
        data() {
            return {
                text: '',

                pagination: {
                    rowsPerPage: 12
                },

                selected: [],
                headers: [
                    { width: "100%", text: 'User', value: 'name' },
                    /*{ width: "10%", text: 'Friend', value: 'isFriend' },*/
                ],
            }
        },
        computed: {
            entity() {
                this.pagination.page = this.activePage || this.pagination.page || 1;
                return this.database.found ? this.database.found.map(user => this.entities.user[user]) : [];
            },
            pages () {
                if (this.pagination.rowsPerPage == null || this.pagination.totalItems == null)
                    return 0;

                if(this.database.found) {
                    let pages = Math.ceil(this.database.found.length / this.pagination.rowsPerPage);
                    this.pagination.pages = this.pagination.pages !== pages ? pages : this.pagination.pages;
                    return this.pagination.pages;
                }

            }
        },
        methods: {
            toggle(item) {
                const i = this.selected.indexOf(item);

                if (i > -1) {
                    this.selected.splice(i, 1)
                } else {
                    this.selected.push(item)
                }
            },
            onFind(res, data, time) {
                !time && (this.database.found = []);
            },
            onAppend(res) {
                this.selected = [];
            },
            find() {
                this.text = this.text || '';
                if(this.text.trim()) {
                    this.$request(`${this.$state.base_api}search.find`, {text: this.text}, {callback: this.onFind});
                }
                else this.database.found = [];

            },
            append() {
                this.activePage = this.pagination.page;
                this.$request(`${this.$state.base_api}search.append`, this.selected, {callback: this.onAppend});
            }
        },
        watch: {
            'selected': function (new_value, o) {
/*
                if(new_value.length) {
                    let not_friends = new_value.filter(user => !user.isFriend);
                    not_friends.length !== new_value.length && (this.selected = not_friends);
                }
*/
                //console.log(n, o)
            }
        }
    }

    //# sourceURL=search.js
</script>