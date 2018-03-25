<template>
    <div class="layout-view">
        <h1>User profile details:</h1>

        <div class="profile-details">
            <v-card class="profile">
                <v-card-title>
                    <v-icon class="mr-1">fas fa-user</v-icon>
                    <span class="headline">user</span>
                </v-card-title>
                <v-card-text>
                    <v-container grid-list-md>
                        <v-layout wrap>
                            <v-form ref="form" lazy-validation @submit.prevent>
                                <v-flex xs12>
                                    <v-text-field v-model="object.email"
                                                  validate-on-blur
                                                  label="EMail"
                                                  required
                                                  prepend-icon="fas fa-at"
                                                  autofocus
                                                  color="blue darken-2"
                                                  hint="any string value"
                                                  :rules="[
                                                      () => !!object.email || 'This field is required',
                                                  ]"
                                    ></v-text-field>
                                    <v-text-field v-model="object.password"
                                                  :required="!!!object.id"
                                                  validate-on-blur
                                                  label="Password"
                                                  prepend-icon="fas fa-key"
                                                  autofocus
                                                  color="blue darken-2"
                                                  hint="any string value"
                                                  placeholder="enter password to change"
                                                  :rules="[
                                                      () => (!!!object.id && !!object.password) || ((!!object.id && !!!object.password)) || ((!!object.id && !!object.password)) || 'This field is required'
                                                  ]"
                                    ></v-text-field>
                                </v-flex>
                                <v-flex xs12>
                                    <v-text-field v-model="object.name"
                                                  validate-on-blur
                                                  label="Name"
                                                  required
                                                  prepend-icon="fas fa-user"
                                                  color="blue darken-2"
                                                  hint="any string value"
                                                  :rules="[
                                                      () => !!object.name || 'This field is required',
                                                  ]"
                                    ></v-text-field>
                                </v-flex>
                                <v-flex xs12>
                                    <v-text-field v-model="object.group"
                                                  validate-on-blur
                                                  label="Group"
                                                  required
                                                  prepend-icon="fas fa-user-secret"
                                                  color="blue darken-2"
                                                  hint="any string value"
                                                  :rules="[
                                                      () => !!object.group || 'This field is required',
                                                  ]"
                                    ></v-text-field>
                                </v-flex>
                            </v-form>
                        </v-layout>
                    </v-container>
                    <small>*indicates required field</small>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="blue darken-2" flat @click.native="cancel">cancel</v-btn>
                    <v-btn color="blue darken-2" flat @click.native="save(object)">save</v-btn>
                </v-card-actions>
            </v-card>
            <v-card class="applications">
                <v-card-title>
                    <v-icon class="mr-1">fas fa-cogs</v-icon>
                    <span class="headline">applications</span>
                </v-card-title>
                <v-card-text>
                    <v-container grid-list-md>
                        <v-layout wrap>

                        </v-layout>
                    </v-container>

                </v-card-text>
            </v-card>
        </div>
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
        data() {
            return {
                frame: false
            }
        },
        computed: {
            object() {
                return (this.entities.profile && this.entities.profile.current) || {};
            },
            profile() {
                return (this.entities.profile && this.entities.profile.current) || {};
            }
        }
    }

    //# sourceURL=profile.js
</script>

<server-script>
    const Component = require('./component');

    module.exports = class Profile extends Component {
        constructor(router, req, res) {
            super(router, req, res);

        }
/* 
        get shared() {
            if(this.user && this.user.group === 'admin') {
                return {
                    layout_tabs: [
                        {
                            name: 'clients',
                            icon: 'fas fa-users'
                        }
                    ]
                }
            }
            else return {}
        }
 */
        get data() {
            return {};
        }
    }
</server-script>