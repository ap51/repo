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
                                        <img src="static/foster.jpg" :alt="current_user.name">
                                    </v-avatar>
                                    <v-flex xs12>
                                        <div>
                                            <div class="headline">{{current_user.name}}</div>
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
                                           v-if="!tab.right">

                                        <v-icon class="mr-1 mb-1">{{ tab.icon}}</v-icon>

                                        {{ tab.name }}
                                    </v-tab>

                                </v-tabs>
                                </v-toolbar>
                            </v-card-actions>
                        </v-card>
                    </v-flex>
                    <v-flex xs12>
                        <keep-alive>
                            <component :is="tabs[active].name"></component>
                        </keep-alive>
                    </v-flex>
                </v-layout>
            </v-container>
        </v-card>
    </div>
</template>

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

<script>
    module.exports = {
        extends: component,
        components: {
            'feed': httpVueLoader('feed'),
            'friends': httpVueLoader('friends'),
            'charts': httpVueLoader('charts'),
            'profile': httpVueLoader('profile'),
            'search': httpVueLoader('search'),
            'phones': httpVueLoader('phones'),
            'applications': httpVueLoader('applications'),
        },
        data() {
            return {
                active: 0,
                tabs: [
                    {
                        name: 'feed',
                        icon: 'fas fa-newspaper'
                    },
                    {
                        name: 'friends',
                        icon: 'fas fa-users'
                    },
                    {
                        name: 'charts',
                        to: 'public',
                        icon: 'far fa-comments'
                    },
                    {
                        name: 'profile',
                        icon: 'far fa-address-card'
                    },
                    {
                        name: 'search',
                        icon: 'fas fa-search'
                    },
                    {
                        name: 'phones',
                        icon: 'fas fa-mobile'
                    },
                    {
                        name: 'applications',
                        icon: 'fas fa-cogs'
                    },
                ]
            }
        },
        computed: {
/*
            object() {
                return (this.entities.profile && this.entities.profile.current) || {};
            },
            profile() {
                return (this.entities.profile && this.entities.profile.current) || {};
            }
*/
        },
        watch: {
            'active': function (newValue, oldValue) {
                //console.log(this.tabs[newValue])
            }
        }
    }

    //# sourceURL=public.js
</script>
