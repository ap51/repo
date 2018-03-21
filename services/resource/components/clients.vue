<template>
    <div class="layout-view">
        <h1>OAuth resource server:</h1>

        <div>
            <p>
                Менеджер сторонних клиентских приложений
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

<server-script>
    const Component = require('./component');

    module.exports = class Profile extends Component {
        constructor(router, req, res) {
            super(router, req, res);

        }
/* 
        get shared() {
            if(this.user && this.user.group === 'admin') {
                return {
                    layout_tabs: [
                        {
                            name: 'clients',
                            icon: 'fas fa-users'
                        }
                    ]
                }
            }
            else return {}
        }
 */
        get data() {
            return {};
        }
    }
</server-script>