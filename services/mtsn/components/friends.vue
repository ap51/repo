<template>
    <div class="layout-view">
<!--
        <v-toolbar flat color="white lighten-2" dense class="">
            <v-toolbar-title>{{name}}:</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn flat :disabled="selected.length === 0" @click.stop="remove"><v-icon color="red darken-2" class="mr-1 mb-1">fas fa-times</v-icon>remove from friends</v-btn>
        </v-toolbar>
-->

        <div style="display: flex; align-items: center; width: 100%">
            <v-pagination style="flex: 1" v-model="pagination.page" :length="pages" :total-visible="pages > 6 ? 7 : pages"></v-pagination>
            <v-btn v-if="!mode" color="red darken-2" flat :disabled="selected.length === 0" @click.stop="remove"><v-icon color="red darken-2" class="mr-1 mb-1">fas fa-times</v-icon>remove from friends</v-btn>
            <v-btn v-if="!mode" color="green darken-2" flat :disabled="selected.length === 0" @click.stop="chat(selected)"><v-icon color="green darken-2" class="mr-1 mb-1">far fa-comment</v-icon>begin chat</v-btn>
        </div>

        <v-data-table style="border-top: 1px solid rgba(0,0,0,0.4); border-bottom: 1px solid rgba(0,0,0,0.4)"
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
                <td>
<!--
                    <a @click="toggle(props.item)">{{ props.item.name }}</a>
-->
                    <div style="display: flex; align-items: center">
                        <v-icon class="mr-2" color="orange darken-2" style="font-size: 20px; height: 22px;">fas fa-user-circle</v-icon>
                        <div style="flex: 1" class=""><a :href="'./posts:' + props.item.public_id" @click.prevent="$router.push('posts:' + props.item.public_id)">{{ props.item.name }}</a></div>
                        <!--<div style="flex: 1" class=""><a :href="'myfeed:wer' + ">{{ props.item.name }}</a></div>-->

                        <v-btn icon v-if="!mode" @click="chat([props.item])">
                            <v-icon color="accent" style="font-size: 20px; height: 22px;">far fa-comment</v-icon>
                        </v-btn>
                    </div>
                </td>
            </template>
        </v-data-table>

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
        props: [
            'mode',
            'object'
        ],
        data() {
            return {
                text: '',

                pagination: {
                    rowsPerPage: 8
                },

                selected: [],
                headers: [
                    { width: "100%", text: 'User', value: 'name' },
                    //{ width: "0%", text: 'OOO', value: 'id' },
                ],
            }
        },
        computed: {
            entity() {
                this.pagination.page = this.activePage || this.pagination.page || 1;
                return (this.database.users && this.entities.user.current.friends) ? this.entities.user.current.friends.map(user => this.entities.user[user]) : [];
            },
            pages () {
                if (this.pagination.rowsPerPage == null || this.pagination.totalItems == null)
                    return 0;

                if(this.entities.user && this.entities.user.current.friends) {
                    let pages = Math.ceil(this.entities.user.current.friends.length / this.pagination.rowsPerPage);
                    this.pagination.pages = this.pagination.pages !== pages ? pages : this.pagination.pages;
                    return this.pagination.pages;
                }

            }
        },
        methods: {
/*
            toggle(item) {
                const i = this.selected.indexOf(item);

                if (i > -1) {
                    this.selected.splice(i, 1)
                } else {
                    this.selected.push(item)
                }
            },
*/
            onRemoved(res) {
                this.selected = [];
                this.pagination.page = this.activePage || this.pagination.page || 1;
            },
            remove() {
                //this.activePage = this.pagination.page;
                this.$request(`${this.$state.base_api}friends.remove`, this.selected, {method: 'delete', callback: this.onRemoved});
            },
            chat(selected) {
                //this.activePage = this.pagination.page;
                this.$request(`${this.$state.base_api}chats.begin`, {name: `chat:${new Date() * 1}`, users: selected}, {callback: this.onRemoved});
            }
        },
        watch: {
            'object': function (newValue, oldValue) {
                newValue && this.object.users.length && (this.selected = this.object.users.map(id => {return {id}}));
            },
            'selected': function (newValue, oldValue) {
                this.$emit('selected', newValue.map(user => user.id));
                //this.selection.length && (this.selected = this.selection.map(id => {return {id}}));
            },
        }
    }

    //# sourceURL=friends.js
</script>