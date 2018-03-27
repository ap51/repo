<template>
    <div class="layout-view">
        <v-toolbar flat color="white lighten-2" dense class="elevation-1 ma-1">
            <v-toolbar-title>{{name}}:</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn flat to="public:jd"><v-icon color="green darken-2" class="mr-1 mb-1">far fa-check-circle</v-icon>go jd</v-btn>
            <!-- <v-btn flat="flat" :disabled="selected.length === 0" @click.stop="remove"><v-icon color="red darken-2" class="mr-1 mb-1">fas fa-times</v-icon>remove</v-btn> -->
            <v-btn :disabled="!changed" flat="flat" @click.stop="apply({...object})"><v-icon color="green darken-2" class="mr-1 mb-1">far fa-check-circle</v-icon>apply</v-btn>
        </v-toolbar>
        <v-card flat width="50%">
            <v-card-text>
                <v-container grid-list-md>
                    <v-layout wrap>
                        <v-form ref="form" lazy-validation @submit.prevent>
                            <v-flex xs12>
                                <v-text-field v-model="object.public_id"
                                              validate-on-blur
                                              label="Public ID"
                                              required
                                              prepend-icon="fas fa-mobile"
                                              autofocus
                                              color="blue darken-2"
                                              hint="any string value"
                                              :rules="[
                                                  () => !!object.public_id || 'This field is required',
                                              ]"
                                ></v-text-field>
                            </v-flex>
                            <v-flex xs12>
                                <v-text-field v-model="object.status"
                                              validate-on-blur
                                              label="Status text"
                                              prepend-icon="fas fa-user"
                                              color="blue darken-2"
                                              hint="any string value"
                                ></v-text-field>
                            </v-flex>
<!--  
                            <v-flex xs12>
                                <v-text-field v-model="object.avatar"
                                              validate-on-blur
                                              label="Owner"
                                              required
                                              prepend-icon="fas fa-user"
                                              color="blue darken-2"
                                              hint="any string value"
                                              :rules="[
                                                  () => !!object.avatar || 'This field is required',
                                              ]"
                                ></v-text-field>
                            </v-flex>

 -->                        
                        </v-form>
                    </v-layout>
                </v-container>
                <small>*indicates required field</small>
            </v-card-text>
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
        width: 100%;
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
                frame: false,
                changed: false,
                internal_object: void 0
            }
        },
        created() {
        },
        computed: {
            object() {
                    this.internal_object = this.internal_object || this.current_profile;//(this.entities.profile && {...this.entities.profile[thi]});

                    this.changed = JSON.stringify(this.internal_object) !== JSON.stringify(this.current_profile);

                    return this.internal_object;
            }
        },
        methods: {
            applied(res) {
                this.changed = false;
            },
            apply(profile) {
                this.$request(`${this.$state.base_api}profile.save`, profile, {callback: this.applied});
            },
        },
    }

    //# sourceURL=profile.js
</script>
