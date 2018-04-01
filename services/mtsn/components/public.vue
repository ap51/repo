<template>
    <div class="layout-view">
        <v-card flat width="60vw">
            <v-container

                    grid-list-lg
            >
                <v-layout column>
                    <v-flex xs12>
                        <v-card color="blue darken-2" class="white--text">
                            <v-container fluid grid-list-lg>
                                <v-layout row>
                                    <v-avatar size="70px" slot="activator">
                                        <img src="static/foster.jpg" :alt="current_profile.name">
                                    </v-avatar>
                                    <v-flex xs12>
                                        <div>
                                            <div class="headline">{{current_profile.name}}</div>
                                            <div>{{current_profile.status || 'anything...'}}</div>
                                        </div>
                                    </v-flex>
                                </v-layout>
                            </v-container>
                            <v-card-actions>
                                <v-toolbar flat color="blue darken-2" dense tabs="tabs">
                                     <v-tabs v-model="active" color="blue darken-2" dark dense :right="false" show-arrows>

                                        <v-tabs-slider color="yellow"></v-tabs-slider>

                                        <v-tab v-for="tab in tabs"
                                            :key="tab.name"
                                            :to="tab.to || tab.name">

                                            <v-icon class="mr-1 mb-1">{{ tab.icon}}</v-icon>

                                            {{tab.name}}
                                        </v-tab>

                                    </v-tabs>
                                </v-toolbar>
                            </v-card-actions>
                        </v-card>
                    </v-flex>
                    <v-flex xs12>
                        <!--<router-view name="tabs[active].name"></router-view>-->
                        <keep-alive>
                            <component :is="parseRoute(active).component"></component>
                        </keep-alive>
                    </v-flex>
                </v-layout>
            </v-container>
        </v-card>
    </div>
</template>

<script>
    module.exports = {
        name: 'public',
        extends: component,
        components: {
            /*
                        'feed': httpVueLoader('feed'),
                        'friends': httpVueLoader('friends'),
                        'charts': httpVueLoader('charts'),
                        'profile': httpVueLoader('profile'),
                        'search': httpVueLoader('search'),
                        'phones': httpVueLoader('phones'),
                        'applications': httpVueLoader('applications'),
            */
        },
        data() {
            return {
                active: '',
            }
        },
        created() {
            console.log('public create', this.active);
            //httpVueLoader.register(Vue, this.parsed_route.component);
            //console.log(this.tabs[this.active].name);
        },
        activated() {
            console.log('ACTIVE', this.active)
            this.active = (!(this.active === '') && this.active) || this.tabs[0].to || this.tabs[0].name;
            newValue = this.active.replace(Vue.prototype.$state.base_ui, '');
            newValue !== this.state.path && this.$router.replace(newValue);
        },
        computed: {
        },
        watch: {
            'active': function (newValue, oldValue) {
                //console.log(this.tabs[newValue])
                //let location = this.parseRoute(newValue);
                //this.loader.register(Vue, location.component);
                newValue = newValue.replace(Vue.prototype.$state.base_ui, '');
                let tab = this.shared.layout_tabs.find(tab => tab.to === oldValue.replace(Vue.prototype.$state.base_ui, '') || tab.dynamic);
                newValue && tab && (tab.to = newValue);
                newValue && newValue !== this.state.path && this.$router.replace(newValue);
            }
        }
    }

    //# sourceURL=public.js
</script>

<style scoped>
    iframe {
        width: 100%;
        height: 100%;
        border: none;
    }

    .profile-details {
        display: flex;
        align-items: center;
        overflow: auto;
        height: 100%;
        width: 70vw;
    }

    /*
        .profile-details div:first-child {
            min-width: 150px;
        }
    */

    div.profile {
        width: 40%;
        margin: 4px;
    }

    div.applications {
        width: 60%;
        margin: 4px;
        height: auto;
    }

    .layout-view {
        display: flex;
        align-items: center;
        overflow: auto;
        height: 100%;
    }

    .layout-view {
        flex-direction: column;
    }

    .layout-view p {
        width: 50vw;
        text-align: center;
    }

    .layout-view h1 {
        margin-top: 8px;
        margin-bottom: 8px;
    }

</style>
