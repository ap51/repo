<template>
    <div class="layout-view">
        <h1>access denied</h1>
        <v-icon color="red darken-2" class="shadow">fas fa-minus-circle fa-3x</v-icon>
        <h1>"{{address.ident}}"</h1>

        <v-btn color="blue darken-2" flat="flat" @click="signin()">Sign in</v-btn>
    </div>
</template>

<style scoped>
    .layout-view {
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: auto;
        height: 100%;
    }

    .layout-view {
        flex-direction: column;
    }

    .layout-view p {
        width: 50vw;
    }

    .layout-view h1 {
        margin-top: 8px;
        margin-bottom: 8px;
    }

</style>

<script>
    module.exports = {
        extends: component,
        mounted() {
        },
        methods: {
            signin() {
                this.$bus.$emit('signin');
            }
        }
    }

    //# sourceURL=unauthorized.js
</script>