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

                        <v-data-table style="border-top: 1px solid rgb(128, 128, 128)"
                                      item-key="id"
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
                                        <div class="subheading"><a @click.prevent=edit(props.item.id)>{{ props.item.title }}</a></div>
                                        <div style="border-top: 1px solid rgba(0,0,0,0.1); max-height: 150px; overflow: auto" class="caption" v-html="props.item.text"></div>
                                        <div style="display: flex; align-items: center; border-top: 1px solid rgba(0,0,0,.12)">
                                            <div style="flex: 1" class="grey--text" style="" class="caption">{{ new Date(props.item.created).toLocaleString() }}</div>
                                            <v-btn flat small icon color="pink">
                                                <v-icon>favorite</v-icon>
                                            </v-btn>
                                            <v-btn flat small icon color="indigo">
                                                <v-icon>star</v-icon>
                                            </v-btn>
                                        </div>
                                    </div>

                                </td>
                            </template>
                        </v-data-table>

                    </v-flex>
                </v-layout>
            </v-container>
        </v-card>

         <post-dialog :visible="dialog.visible" :object="dialog.object" @save="save" @cancel="cancel"></post-dialog>
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
            'post-dialog': httpVueLoader('post-dialog')
        },
        data() {
            return {
                text: '',

                dialog: {
                    visible: false,
                    object: {}
                },

                pagination: {
                    rowsPerPage: 6
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
            onNames(res) {
                let generated = res.data.results[0];

                this.dialog.object.title = `${generated.name.title}. ${generated.name.first} ${generated.name.last}`;
                this.dialog.object.text = `${generated.name.title}. ${generated.name.first} ${generated.name.last}`;
            },
            append() {
                this.dialog.object = {
                    title: 'loading...',
                    text: 'loading...'
                };
                this.dialog.visible = true;
                this.$request('https://randomuser.me/api', null, {callback: this.onNames, no_headers: true});
            },
            edit(id) {
                let object = this.entities.post[id];
                console.log(object);
                this.dialog.object = {...object};
                this.dialog.visible = true;
            },
            remove() {
                this.activePage = this.pagination.page;
                this.$request(`${this.$state.base_api}feed.remove`, this.selected, {method: 'delete', callback: this.cancel});
            },
            save(post) {
                this.activePage = this.pagination.page;
                this.$request(`${this.$state.base_api}${this.address.ident}.save`, post, {callback: this.cancel});
            },
            cancel(response) {
                response && response.config.method.toUpperCase() === 'DELETE' && (this.selected = []);
                this.dialog.visible = false;
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