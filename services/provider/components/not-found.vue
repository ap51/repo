<template>
    <div class="layout-view">
        <h1>page not found:</h1>
        <v-icon color="red darken-2" class="shadow">fas fa-unlink fa-3x</v-icon>
        <h1>"{{location}}"</h1>

        <v-btn color="blue darken-2" flat="flat" @click.stop="reload()">Try again</v-btn>
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
        methods: {
            reload() {
                window.location.pathname = this.$state.base + this.$state.path;
            }
        }
    }

    //# sourceURL=not-found.js
</script>