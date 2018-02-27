<template>
        <v-app ref="layout">
            <v-content>
                <v-card class="base-layout">
                    <keep-alive>
                        <component :is="location"></component>
                    </keep-alive>
                </v-card>
            </v-content>
        </v-app>


</template>

<style scoped>
    .base-layout {
        height: calc(100vh - 16px)!important;
        margin: 8px;
        border: 1px solid #ccc;
    }
    button i, a i {
        font-size: 17px;
    }
</style>

<script>
    module.exports = {
        extends: component,
        components: {
            'signin': httpVueLoader('signin')
        },
        data() {
            return {
                signin: false,
                tabs: [
                    {
                        name: 'about',
                        icon: 'far fa-question-circle'
                    },
                    {
                        name: 'find phone',
                        to: 'find-phone',
                        icon: 'fas fa-mobile'
                    },
                    {
                        name: 'phones db',
                        to: 'phones-database',
                        icon: 'fas fa-database'
                    }
                ]
            }
        },
        methods: {
            onSignIn(data) {
                console.log(data);
                this.$request('signin', data);
                this.signin = false
            }
        }
    }

    //# sourceURL=layout.js
</script>