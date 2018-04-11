<template>
    <v-dialog v-if="object" v-model="visible" persistent max-width="400px">
        <v-card>
            <v-card-title>
                <v-icon class="mr-1">fas fa-sign-out-alt</v-icon>
                <span class="headline">sign out</span>
            </v-card-title>
            <v-card-text>
                THIS ACTION WILL SIGN YOU OUT!
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-2" flat @click.native="cancel">cancel</v-btn>
                <v-btn color="blue darken-2" flat @click.native="submit">sign out</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style scoped>
    .flex {
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }

</style>

<script>
    module.exports = {
        extends: component,
        props: [
            'visible',
            'object'
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
            },
            submitted() {
                this.$emit('cancel');
                this.clearCache({reload: true});
            },
            submit() {
                let data = {

                };

                this.$request(`${Vue.prototype.$state.base_api}signout.submit`, data, {callback: this.submitted});
            }
        }
    }

    //# sourceURL=signout.js
</script>