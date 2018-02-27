<template>
    <div class="layout-view">
        <v-card>
            <v-card-title>
                <v-icon class="mr-1">fas fa-user-circle</v-icon>
                <span class="headline">Authorization in OAUTH Service Provider</span>
            </v-card-title>
            <v-card-text>
                <v-container grid-list-md>
                    <v-layout wrap>
                        <v-flex xs12>
                            <v-text-field v-model="email" label="Email" required prepend-icon="fas fa-at" autofocus color="blue darken-2"></v-text-field>
                        </v-flex>
                        <v-flex xs12>
                            <v-text-field v-model="password" label="Password" type="password" required prepend-icon="fas fa-key" color="blue darken-2"></v-text-field>
                        </v-flex>
                    </v-layout>
                </v-container>
                <small>*indicates required field</small>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-2" flat @click.native="cancel()">cancel</v-btn>
                <v-btn color="blue darken-2" flat @click.native="signin()">sign in</v-btn>
            </v-card-actions>
        </v-card>
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
        text-align: center;
    }

    .layout-view h1 {
        margin-top: 8px;
        margin-bottom: 8px;
    }
</style>

<script>
    module.exports = {
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
            signin() {
                let data = {
                    email: this.email,
                    password: md5(`${this.email}.${this.password}`),
                    client_id: 'WpF616jFKHs',
                    grant_type: 'password'
                };
                this.$emit('signin', data);
                this.$request('token', data);
            }
        }
    }

    //# sourceURL=signin.js
</script>