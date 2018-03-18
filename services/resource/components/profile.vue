<template>
    <div class="layout-view">
        <v-dialog v-model="frame" max-width="500px">
            <v-card>
                <iframe v-if="frame" style="width: 100%;height: 100%;border: none;" src="https://localhost:5000/phones/about"></iframe>
            </v-card>
        </v-dialog>
        <v-btn flat @click="frame = !frame"></v-btn>
        <h1>OAuth server:</h1>

        <div>
            <p>
                ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ
            </p>
        </div>
    </div>
</template>

<style scoped>
    iframe {
        width: 100%;
        height: 100%;
        border: none;
    }

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
        extends: component,
        data() {
            return {
                frame: false
            }
        }
    }

    //# sourceURL=profile.js
</script>