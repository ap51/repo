<template>
    <div class="layout-view">
        <h1>User profile details:</h1>

        <div class="profile-details">
            <v-card class="applications">
                <v-card-title>
                    <v-icon class="mr-1">fas fa-cogs</v-icon>
                    <span class="headline">applications</span>
                </v-card-title>
                <v-card-text>
                    <v-container grid-list-md>
                        <v-layout wrap>

                        </v-layout>
                    </v-container>

                </v-card-text>
            </v-card>
        </div>
    </div>
</template>

<style scoped>
    iframe {
        width: 100%;
        height: 100%;
        border: none;
    }

    .profile-details {
        display: flex;
        align-items: center;
        overflow: auto;
        height: 100%;
        width: 100%;
    }

/*
    .profile-details div:first-child {
        min-width: 150px;
    }
*/

    div.profile {
        width: 40%;
        margin: 4px;
    }

    div.applications {
        width: 60%;
        margin: 4px;
        height: auto;
    }

    .layout-view {
        display: flex;
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
        extends: component,
        data() {
            return {
                frame: false
            }
        },
        computed: {
            object() {
                return (this.entities.profile && this.entities.profile.current) || {};
            },
            profile() {
                return (this.entities.profile && this.entities.profile.current) || {};
            }
        }
    }

    //# sourceURL=profile.js
</script>
