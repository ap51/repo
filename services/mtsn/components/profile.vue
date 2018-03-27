<template>
    <div class="layout-view">
        <v-toolbar flat color="white lighten-2" dense >
            <v-toolbar-title>{{name}}:</v-toolbar-title>
            <v-btn flat="flat" :disabled="false" @click.stop="remove"><v-icon color="red darken-2" class="mr-1 mb-1">fas fa-times</v-icon>remove</v-btn>
            <v-btn flat="flat" @click.stop="append"><v-icon color="green darken-2" class="mr-1 mb-1">fas fa-plus</v-icon>append</v-btn>
            <v-spacer></v-spacer>
        </v-toolbar>
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
