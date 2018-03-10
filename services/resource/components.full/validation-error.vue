<template>
    <div class="layout-view">
        <h1>phone you entered does not match input mask</h1>
        <v-icon color="red darken-2" class="shadow">fas fa-exclamation-triangle fa-3x</v-icon>
        <h1>whong numer: {{phone}}</h1>
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
        font-size: 10px;
    }

</style>

<script>
    module.exports = {
        extends: component,
        props: ['results'],
        computed: {
            phone(){
                return this.results.number;
            }
        }
    }

    //# sourceURL=validation-error.js
</script>