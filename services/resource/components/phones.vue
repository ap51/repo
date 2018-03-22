<template>
    <div class="layout-view">
        <v-data-table v-if="this.database.user"
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
                <td>{{ props.item.number}}</td>
                <td>{{ props.item.owner }}</td>
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
                    { text: 'Number', value: 'number' },
                    { text: 'Owner', value: 'owner' }
                ]
            }
        },
        computed: {
            entity() {
                return this.database.user ? this.entities.user.current.phone.map(phone => this.entities.phone[phone]).map(phone => {phone.number = (phone.number + '').replace(/(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/, '+$1 ($2) $3 - $4 - $5'); return phone}) : [];
            }
        }
    }

    //# sourceURL=phones.js
</script>

<server-script>
    const Component = require('./component');

    module.exports = class Profile extends Component {
        constructor(router, req, res) {
            super(router, req, res);

        }

        get data() {
            return {};
        }
    }
</server-script>