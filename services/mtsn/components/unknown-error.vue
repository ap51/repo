<template>
    <div class="layout-view">
        <h1>unknown error</h1>
        <v-icon color="red darken-2" class="shadow">fas fa-error fa-3x</v-icon>
        <h1>"{{address.ident}}"</h1>

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