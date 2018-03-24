<template>
    <div class="layout-view">
        <v-data-table v-if="entity"
                :headers="headers"
                :items="entity"
                :search="search"
                v-model="selected"
                item-key="_id"
                select-all
                class="elevation-1"
                disable-initial-sort
        >
            <template slot="headerCell" slot-scope="props">
                <v-tooltip bottom>
                    <span slot="activator">
                      {{ props.header.text }}
                    </span>
                    <span>
                      {{ props.header.text }}
                    </span>
                </v-tooltip>
            </template>
            <template slot="items" slot-scope="props">
                <td>
                    <v-checkbox
                        primary
                        hide-details
                        v-model="props.selected">
                    </v-checkbox>
                </td>
                <td>{{ props.item.app_name }}</td>
                <td>{{ props.item.client_id }}</td>
                <td>{{ props.item.grants }}</td>
                <td>{{ props.item.scope }}</td>
                <td>{{ props.item.redirectUris }}</td>
            </template>
        </v-data-table>
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
                frame: false,

                search: '',
                selected: [],
                headers: [
                    { text: 'Application name', value: 'app_name' },
                    { text: 'Client ID', value: 'client_id' },
                    { text: 'Allowed Grants', value: 'grants' },
                    { text: 'Allowed Scopes', value: 'scope' },
                    { text: 'Redirects', value: 'redirectUris' }
                ]
            }
        },
        computed: {
            entity() {
                return this.database.client ? this.database.clients.map(client => this.entities.client[client]) : [];
            }
        }
    }

    //# sourceURL=clients.js
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