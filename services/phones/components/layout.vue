<template>
        <v-app ref="layout">
            <v-content>
                <v-toolbar color="red darken-2" dark dense>
                    <v-tabs color="red darken-2"
                            >

                        <v-tabs-slider color="yellow"></v-tabs-slider>

                        <v-tab v-for="tab in tabs"
                               :key="tab.name"
                               :to="tab.to || tab.name">

                            <v-icon class="mr-1 mb-1">{{ tab.icon}}</v-icon>

                            {{ tab.name }}
                        </v-tab>
                    </v-tabs>

                    <v-toolbar-items>
<!--
                        <v-btn v-if="!state.session.auth" flat @click="signin = true">
                            <v-icon class="mr-1 mb-1">fas fa-user-circle</v-icon>SIGN IN
                        </v-btn>
-->

                        <v-btn v-if="state.session.auth"  flat @click="signout = true">
                            <v-icon class="mr-1 mb-1">fas fa-sign-out-alt</v-icon>{{state.session.auth}}
                        </v-btn>

                        <!--
                                                <v-btn flat href="https://localhost:3001/provider/oauth/authorize?client_id=WpF616jFKHs&redirect_uri=https://localhost:3001/provider/secret">
                                                    <v-icon class="mr-1 mb-1">fas fa-user-circle</v-icon>SIGN IN
                                                </v-btn>
                        -->

                    </v-toolbar-items>

                </v-toolbar>

                <signin :visible="signin" @cancel="signin = false"></signin>
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
        extends: component,
        components: {
            'signin': httpVueLoader('signin'),
            'signout': httpVueLoader('signout')
        },
        data() {
            return {
                signin: false,
                signout: false,
                snackbar: {
                    timeout: 3000,
                    color: 'red darken-2',
                    multiline: false,
                    vertical: false,
                    visible: false,
                    message: ''
                },
                tabs: [
                    {
                        name: 'about',
                        icon: 'far fa-question-circle'
                    },
                    {
                        name: 'find phone',
                        to: 'find-phone',
                        icon: 'fas fa-mobile'
                    },
                    {
                        name: 'phones db',
                        to: 'phones-database',
                        icon: 'fas fa-database'
                    }
                ]
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
            onSignIn(data) {
                console.log(data);
                this.signin = false
            }
        },
        watch: {
            'state.session.auth': function (newValue) {
                !newValue && (delete cache[this.location]);
                !newValue && this.$page(this.location, true);
                //!newValue && this.$request(this.location);//this.$page(this.location, true);
                !newValue && (this.signout = false);
            }
        }
    }

    //# sourceURL=layout.js
</script>