<template>
        <v-app ref="layout">
            <v-content>
                <v-toolbar color="blue darken-2" dark dense>
                    <v-toolbar-title class="mr-2"><v-icon class="mr-1 mb-1">{{icon}}</v-icon><small>{{title.toUpperCase() + ' (My Tiny Social Network)'}}</small></v-toolbar-title>

                    <v-tabs v-model="active" color="blue darken-2"
                            :right="false">

                        <v-tabs-slider color="yellow"></v-tabs-slider>

                        <v-tab v-for="tab in tabs"
                             :key="tab.name"
                             :to="tab.to || tab.name"
                             v-if="!tab.invisible">

                                <v-icon class="mr-1 mb-1">{{ tab.icon}}</v-icon>

                                {{ tab.name }}
                        </v-tab>

                    </v-tabs>

                    <!--<v-spacer></v-spacer>-->

<!--
                    <v-tabs color="blue darken-2"
                            :right="true">

                        <v-tabs-slider color="yellow"></v-tabs-slider>

                        <v-tab v-for="tab in tabs"
                               :key="tab.name"
                               :to="tab.to || tab.name"
                               v-if="tab.right">

                            <v-icon class="mr-1 mb-1">{{ tab.icon}}</v-icon>

                            {{ tab.name }}
                        </v-tab>

                    </v-tabs>
-->

                    <v-toolbar-items >

                        <v-btn v-if="!auth.name" flat @click="signin = true">
                            <v-icon class="mr-1 mb-1">fas fa-sign-in-alt</v-icon>SIGN IN
                        </v-btn>

                        <v-btn v-if="auth.name"  flat @click="signout = true">
                            <v-icon class="mr-1 mb-1">fas fa-user-circle</v-icon>{{auth.name}}
                        </v-btn>

                        <!--
                                                <v-btn flat href="https://localhost:3001/provider/oauth/authorize?client_id=WpF616jFKHs&redirect_uri=https://localhost:3001/provider/secret">
                                                    <v-icon class="mr-1 mb-1">fas fa-user-circle</v-icon>SIGN IN
                                                </v-btn>
                        -->

                    </v-toolbar-items>

                </v-toolbar>

                <dialog-signin :visible="signin" @cancel="signin = false"></dialog-signin>
                <signout :visible="signout" :object="current_user" @cancel="signout = false"></signout>

                <v-card class="base-layout">
                    <keep-alive>
                        <component @event="onChildEvent" :is="location"></component>
                    </keep-alive>
                </v-card>

                <v-snackbar
                    :timeout="snackbar.timeout"
                    :color="snackbar.color"
                    :multi-line="snackbar.multiline"
                    :vertical="snackbar.vertical"
                    v-model="snackbar.visible">
                    {{ snackbar.message }}
                    <v-btn dark flat @click.native="snackbar.visible = false">Close</v-btn>
                </v-snackbar>
            </v-content>
        </v-app>
</template>

<style scoped>
    .toolbar__title {
        overflow: visible;
    }

    .base-layout {
        height: calc(100vh - 64px)!important;
        margin: 8px;
        border: 1px solid #ccc;
    }
    button i, a i {
        font-size: 17px;
    }
</style>

<script>
    module.exports = {
        name: 'layout',
        extends: component,
        components: {
            'dialog-signin': httpVueLoader('dialog-signin'),
            'signout': httpVueLoader('signout'),
        },
        data() {
            return {
/*
                current_tab: {
                    name: '',
                    icon: 'far fa-plus',
                    invisible: true
                },
*/
                active: void 0,
                //signin: false,
                signout: false,
                snackbar: {
                    timeout: 4000,
                    color: 'red darken-2',
                    multiline: false,
                    vertical: false,
                    visible: false,
                    message: ''
                }
            }
        },
        created() {
            let self = this;

            this.$bus.$on('signin', function () {
                self.signin = true;
            });

            this.$bus.$on('snackbar', function (message) {
                self.snackbar.message = message;
                self.snackbar.visible = true;
            });
        },
        activated() {
            //this.$state.shared.location = void 0;
        },
        computed: {
            active_tab: {
                get() {
                    return this.tabs.find(tab => tab.active);
                },
                cache: false
            },
            tab_found() {
                return !!(this.active ? this.tabs.find(tab => this.address.ident == (tab.to || tab.name)) : false);
            },
/*
            current_tab() {
                let tab = {
                    name: this.active,
                    icon: 'far fa-plus',
                    invisible: this.active ? this.tabs.find(tab => this.active.replace(this.state.base_ui, '') == (tab.to || tab.name)) : true
                };

                return tab;
            }
*/
        },
        methods: {
            onChildEvent(data) {
                if(data && data.name) {
                    switch(data.name) {
                        case 'active:changed':
                            let tab = this.tabs.find(tab => tab.name === 'private'); //не private а родительский элемент в иерархии текущей
                            tab && (tab.to = this.parseRoute(data.value).ident);
                            this.active = data.value;

                            this.active_tab.invisible = this.tab_found;
                            break;
                    }
                }
            }
        },
        watch: {
            'tabs': function (new_value, old_value) {
                if(new_value.length < old_value.length) {
                    this.active_tab.invisible = this.tab_found;
                    this.active_tab.name = this.address.ident;
                }

                //let found = newValue.find(tab => this.active.replace(this.state.base_ui, '') == (tab.to || tab.name));
            
                //!found && this.$router.push('about');
/*
                if(!found) {
                    this.tabs.push({
                        name: this.active.replace(this.state.base_ui, ''),
                        to: this.active.replace(this.state.base_ui, ''),
                        icon: 'far fa-plus'
                    })
                }
*/
            },

            'active': function (new_value, old_value) {
/*                 //newValue && (delete cache[this.location]);
                newValue && (cache = {});
                !newValue && Vue.set(Vue.prototype.$state, 'entities', {});
                //newValue && (delete cache['layout']);
                //this.$page(this.location, true);
                //!newValue && this.$request(this.location);//this.$page(this.location, true);
                !newValue && (this.signout = false);
                newValue && (this.signin = false);
 */
            }
        }
    }

    //# sourceURL=layout.js
</script>