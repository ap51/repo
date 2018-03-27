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
                                <picture-input
                                        ref="pictureInput"
                                        @change="onChange"
                                        width="200"
                                        height="200"
                                        margin="0"
                                        :plain="false"
                                        accept="image/jpeg,image/png"
                                        size="10"
                                        :crop="false"
                                        :removable="false"
                                        :auto-toggle-aspect-ratio="true"
                                        :hide-change-button="true"
                                        :custom-strings="strings">
                                </picture-input>
                                <v-btn flat @click="$refs.pictureInput.removeImage()"><v-icon color="green darken-2" class="mr-1 mb-1">far fa-check-circle</v-icon>remove</v-btn>

                            </v-flex>
                            <v-flex xs12>
                                <v-text-field v-model="object.public_id"
                                              label="Public ID"
                                              required
                                              prepend-icon="fas fa-id-card"
                                              autofocus
                                              color="blue darken-2"
                                              hint="^[a-zA-Z0-9-]{5,}$"
                                              :rules="[
                                                  () => {
                                                    return (!!object.public_id && /^[a-zA-Z0-9-]{5,}$/.test(object.public_id)) || 'This field must equals ^[a-zA-Z0-9-]{5,}$'
                                                  }
                                              ]"
                                ></v-text-field>
                            </v-flex>
                            <v-flex xs12>
                                <v-text-field v-model="object.status"
                                              validate-on-blur
                                              label="Status text"
                                              prepend-icon="far fa-comment-alt"
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

    .picture-preview {
        width: 100%;
        height: 100%;
        position: relative;
        z-index: 10001;
        box-sizing: border-box;
        background-color: transparent!important;
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
        components: {
            PictureInput
        },
        data() {
            return {
                frame: false,
                changed: false,
                internal_object: void 0,
                strings: {
                    upload: '<h1>Bummer!</h1>',
                    drag: 'Drag a 😺 GIF or GTFO'
                }
            }
        },
        created() {
            //let fp = FilePond.create();
        },
        computed: {
            object() {
                    this.internal_object = this.internal_object || this.current_profile;//(this.entities.profile && {...this.entities.profile[thi]});

                    this.changed = JSON.stringify(this.internal_object) !== JSON.stringify(this.current_profile);

                    return this.internal_object;
            }
        },
        methods: {
            onChange (image) {
                console.log('New picture selected!')
                if (image) {
                    console.log('Picture loaded.')
                    this.image = image
                } else {
                    console.log('FileReader API not supported: use the <form>, Luke!')
                }
            },
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
