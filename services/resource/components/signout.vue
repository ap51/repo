<template>
    <v-dialog v-model="visible" persistent max-width="400px">
        <v-card>
            <v-card-title>
                <v-icon class="mr-1">fas fa-user-circle</v-icon>
                <span class="headline">sign out</span>
            </v-card-title>
            <v-card-text>
                <v-container grid-list-md>
                    <v-layout>
                        THIS ACTION WILL SIGN YOU OUT!
                    </v-layout>
                </v-container>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-2" flat @click.native="cancel()">cancel</v-btn>
                <v-btn color="blue darken-2" flat @click.native="signout()">sign out</v-btn>
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
    .modal {

    }
</style>

<script>
    module.exports = {
        extends: component,
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
            },
            signout() {
                let data = {
                    location: window.location.pathname
                };

                cache = {};
                this.$request('signout', data);
            }
        }
    }

    //# sourceURL=signin.js
</script>