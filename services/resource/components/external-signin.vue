<template>
    <div class="layout-view">
        <signin style="width: 35vw;" @cancel="cancel"></signin>
    </div>
</template>

<style scoped>
    .layout-view {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
/*
        flex-direction: column;
        width: 30vw;
*/
    }
</style>

<script>
    module.exports = {
        extends: component,
        components: {
            'signin': httpVueLoader('signin'),
        },
        props: [
            'visible'
        ],
        data() {
            return {
                email: '',
                password: ''
            }
        },
        methods: {
            cancel() {
                this.$emit('cancel');
            }
        }
    }

    //# sourceURL=external-signin.js
</script>