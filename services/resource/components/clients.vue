<template>
    <div class="layout-view">
        <h1>OAuth resource server:</h1>

        <v-data-table
                :headers="headers"
                :items="items"
                class="table elevation-1 mt-2 ma-1"
                :search="search"
                v-model="selected"
                item-key="number"
                select-all
                class="elevation-1"
                next-icon="fas fa-chevron-right"
                prev-icon="fas fa-chevron-left"
                sort-icon="fas fa-arrow-up"
                :pagination.sync="pagination"
                hide-actions
        >
            <template slot="items" slot-scope="props">
                <tr>
                    <td>
                        <v-checkbox
                                primary
                                hide-details
                                v-model="props.selected"
                                color="blue darken-2"
                        ></v-checkbox>
                    </td>
                    <td @click="edit(props.item)">
                        <v-icon class="data-icon pb-1 mr-1">fas fa-mobile</v-icon>
                        <a>{{ props.item.phone }}</a>
                    </td>
                    <td @click="edit(props.item)">
                        <v-icon class="data-icon pb-1 mr-1">fas fa-user</v-icon>
                        <a>{{ props.item.owner }}</a>
                    </td>
                </tr>
            </template>

            <template slot="footer">
                <td colspan="100%">
                    <strong>total records: {{entities.phones.length}}</strong>
                </td>
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