<template>
        <v-app ref="layout">
            <v-content>
                <v-toolbar color="blue darken-2" dark dense>
                    <v-toolbar-title class="mr-2"><v-icon class="mr-1 mb-1">{{icon}}</v-icon><small>{{title + ': external signin'}}</small></v-toolbar-title>
<!--
                    <v-toolbar-items>

                        <v-btn flat to="about"><v-icon class="mr-1 mb-1">{{icon}}</v-icon>{{title}}</v-btn>
                    </v-toolbar-items>
-->

                    <v-tabs v-model="active" v-if="location !== 'external-signin'" color="blue darken-2"
                            :right="false">

                        <v-tabs-slider color="yellow"></v-tabs-slider>

                        <v-tab v-for="tab in shared.layout_tabs"
                             :key="tab.name"
                             :to="tab.to || tab.name"
                             v-if="!tab.right">

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

                    <v-toolbar-items v-if="location !== 'external-signin'">
                        <v-btn flat @click="apiCall">
                            <v-icon class="mr-1 mb-1">fas fa-plus</v-icon>API+
                        </v-btn>

                        <v-btn flat @click="apiCallRestricted">
                            <v-icon class="mr-1 mb-1">fas fa-plus</v-icon>API-
                        </v-btn>

                        <v-btn v-if="!auth.name" flat @click="signin = true">
                            <v-icon class="mr-1 mb-1">fas fa-user-circle</v-icon>SIGN IN
                        </v-btn>

                        <v-btn v-if="auth.name"  flat @click="signout = true">
                            <v-icon class="mr-1 mb-1">fas fa-sign-out-alt</v-icon>{{auth.name}}
                        </v-btn>

                        <!--
                                                <v-btn flat href="https://localhost:3001/provider/oauth/authorize?client_id=WpF616jFKHs&redirect_uri=https://localhost:3001/provider/secret">
                                                    <v-icon class="mr-1 mb-1">fas fa-user-circle</v-icon>SIGN IN
                                                </v-btn>
                        -->

                    </v-toolbar-items>

                </v-toolbar>

                <dialog-signin :visible="signin" @cancel="signin = false"></dialog-signin>
                <signout :visible="signout" @cancel="signout = false"></signout>

                <v-card class="base-layout">
                    <keep-alive>
                        <component :is="location"></component>
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
            'signout': httpVueLoader('signout')
        },
        data() {
            return {
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
            })
        },
        methods: {
            apiCall(data) {
                this.$request(`${window.location.origin}/${this.state.service}/api/profile.get`, data);
            },
            apiCallRestricted(data) {
                this.$request(`${window.location.origin}/${this.state.service}/api/client.get`, data);
            }

        },
        watch: {
            'shared.layout_tabs': function (newValue, oldValue) {
                //let found = newValue.filter(tab => this.active == (tab.to || tab.name)).length;
                //!found && this.$router.replace('about');
            },
            'state.auth.name': function (newValue, oldValue) {
                //newValue && (delete cache[this.location]);
                newValue && (cache = {});
                !newValue && Vue.set(Vue.prototype.$state, 'entities', {});
                //newValue && (delete cache['layout']);
                this.$page(this.location, true);
                //!newValue && this.$request(this.location);//this.$page(this.location, true);
                !newValue && (this.signout = false);
                newValue && (this.signin = false);
            }
        }
    }

    //# sourceURL=layout.js
</script>

<server-script>
    const Component = require('./component');

    module.exports = class Layout extends Component {
        constructor(router, req, res) {
            super(router, req, res);

        }
        
        shared(req, res) {

            let _data = {
                layout_tabs: [
                    {
                        name: 'about',
                        icon: 'far fa-question-circle'
                    },
                    {
                        name: 'profile',
                        icon: 'fas fa-user-circle'
                    },
                    {
                        name: 'find phone',
                        to: 'find-phone',
                        icon: 'fas fa-mobile'
                    },
                    {
                        name: 'phones db',
                        to: 'phones',
                        icon: 'fas fa-database'
                    }
                ]
            };

            if(req.token.auth && req.token.auth.group === 'admins') {
                _data.layout_tabs.push(
                    {
                        name: 'clients',
                        icon: 'fas fa-users'
                    },
                    {
                        name: 'users',
                        icon: 'fas fa-users'
                    },
                );
            };

            return _data;
        }

        get data() {
            return {
                title: this.service,
                icon: 'fab fa-empire',
                signin: false,
            };
        }
    }
</server-script>