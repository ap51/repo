<template>
    <div class="layout-view">
        <h1>phone you entered not found in database:</h1>
        <v-icon color="red darken-2" class="shadow">fas fa-exclamation-circle fa-3x</v-icon>
        <h1>{{phone}}</h1>
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
                return this.results.number.replace(/(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/, '+$1 ($2) $3 - $4 - $5');
            }
        }
    }

    //# sourceURL=not-found-phone.js
</script>