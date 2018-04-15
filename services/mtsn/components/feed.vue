<template>
    <div class="layout-view">
        <v-card flat width="50vw">
            <v-container grid-list-lg>
                <v-layout column>
<!--
                    <v-flex xs12>
                        <v-toolbar flat color="white lighten-2" dense class="">
                             <v-toolbar-title>{{name}}:</v-toolbar-title>
                        </v-toolbar>
                    </v-flex>
-->

                    <!--<v-flex v-if="entity.length" flat xs12>-->
                    <v-flex flat xs12>
<!--
                        <v-toolbar flat color="white lighten-2" dense class="">
                            &lt;!&ndash; <v-toolbar-title>{{name}}:</v-toolbar-title>&ndash;&gt;
                            <v-spacer></v-spacer>

                        </v-toolbar>
-->

                        <div style="display: flex; align-items: center;">
                            <v-pagination style="flex: 1" v-model="pagination.page" :length="pages" :total-visible="pages"></v-pagination>
                            <v-btn color="red darken-2" flat :disabled="selected.length === 0" @click.stop="remove"><v-icon color="red darken-2" class="mr-1 mb-1">fas fa-times</v-icon>remove post</v-btn>
                            <v-btn color="green darken-2" flat @click.stop="append"><v-icon color="green darken-2" class="mr-1 mb-1">fas fa-plus</v-icon>append post</v-btn>
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
                                    <div class="ma-2">
                                        <div class="subheading">{{ props.item.title }}</div>
                                        <div class="caption">{{ props.item.text }}</div>
                                        <div class="grey--text" style="border-top: 1px solid rgba(0,0,0,.12)" class="caption">{{ new Date(props.item.created).toLocaleString() }}</div>
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
                    { width: "100%", text: 'Post', value: 'title' },
                    /*{ width: "10%", text: 'Friend', value: 'isFriend' },*/
                ],
            }
        },
        computed: {
            entity() {
                this.pagination.page = this.activePage || this.pagination.page || 1;
                let posts = this.database.feed && this.entities.feed[this.address.id] ? this.entities.feed[this.address.id].posts.map(post => this.entities.post[post]) : [];
                return posts;
            },
            pages () {
                if (this.pagination.rowsPerPage == null || this.pagination.totalItems == null)
                    return 0;

                if(this.database.feed && this.entities.feed[this.address.id]) {
                    let pages = Math.ceil(this.entities.feed[this.address.id].posts.length / this.pagination.rowsPerPage);
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

    //# sourceURL=feed.js
</script>