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
    .layout-view {
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: auto;
        height: 100%;
        flex-direction: column;
    }

</style>

<script>
    module.exports = {
        extends: component,
        data() {
            return {
            }
        }
    }

    //# sourceURL=search.js
</script>