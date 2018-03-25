<template>
    <v-dialog v-model="visible" hide-overlay persistent max-width="500px">
        <signin :reset="!visible" @cancel="cancel"></signin>
    </v-dialog>
</template>

<style scoped>
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

    //# sourceURL=dialog-signin.js
</script>