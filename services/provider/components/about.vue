<template>
    <div class="layout-view">
        <h1>OAUTH Service Provider</h1>

        <div>
            <p>
<!--
                &emsp;&emsp;
-->
                User oauth/auth page to sign in and get access token.
            </p>
        </div>
        <v-btn color="blue darken-2" flat="flat" to="auth">auth</v-btn>
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