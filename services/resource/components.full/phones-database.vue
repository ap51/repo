<template>
    <div class="layout-view pa-1">
        <h1>phones database:</h1>

        <div>
            <v-btn color="red darken-2" flat="flat" :disabled="selected.length === 0" @click.stop="remove"><v-icon class="mr-1 mb-1">fas fa-times</v-icon>remove selected</v-btn>
            <v-btn color="green darken-2" flat="flat" @click.stop="append"><v-icon class="mr-1 mb-1">fas fa-plus</v-icon>append phone</v-btn>
        </div>

        <div class="text-xs-center pt-2">
            <v-pagination v-model="pagination.page" :length="pages" :total-visible="pages"></v-pagination>
        </div>

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

        <phone-dialog :visible="phone.visible" :phone="phone.copy" @save="save" @cancel="cancel"></phone-dialog>

    </div>
</template>

<style scoped>
    .layout-view {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        overflow: auto;
        height: 100%;
        flex-direction: column;
    }

    .table {
        width: 50vw;
    }

    .data-icon {
        font-size: 14px;
    }

</style>

<script>
    module.exports = {
        extends: component,
        components: {
            'phone-dialog': httpVueLoader('phone-dialog')
        },
        data() {
            return {
                phone: {
                    visible: false,
/*
                    data: {
                        number: '',
                        owner: ''
                    },
*/
                    copy: {
                        number: '',
                        owner: ''
                    }
                },
                pagination: {
                    rowsPerPage: 12
                },
                search: '',
                selected: [],
                headers: [
                    {
                        text: 'Phone number',
                        value: 'phone',
                        sortable: false
                    },
                    {
                        text: 'Owner',
                        value: 'owner',
                        sortable: false
                    }
                ],
/*
                rows: [
                    {
                        number: 89991113344,
                        owner: 'mr. Joe Doe'
                    },
                    {
                        number: 92223334455,
                        owner: 'mr. Joe Black'
                    },
                    {
                        number: 89991113344,
                        owner: 'mr. Joe Doe'
                    },
                    {
                        number: 92223334455,
                        owner: 'mr. Joe Black'
                    },
                    {
                        number: 89991113344,
                        owner: 'mr. Joe Doe'
                    },
                    {
                        number: 92223334455,
                        owner: 'mr. Joe Black'
                    },
                    {
                        number: 89991113344,
                        owner: 'mr. Joe Doe'
                    },
                    {
                        number: 92223334455,
                        owner: 'mr. Joe Black'
                    },
                    {
                        number: 89991113344,
                        owner: 'mr. Joe Doe'
                    },
                    {
                        number: 92223334455,
                        owner: 'mr. Joe Black'
                    },
                    {
                        number: 89991113344,
                        owner: 'mr. Joe Doe'
                    },
                    {
                        number: 92223334455,
                        owner: 'mr. Joe Black'
                    },
                    {
                        number: 89991113344,
                        owner: 'mr. Joe Doe'
                    },
                    {
                        number: 92223334455,
                        owner: 'mr. Joe Black'
                    },
                    {
                        number: 89991113344,
                        owner: 'mr. Joe Doe'
                    },
                    {
                        number: 92223334455,
                        owner: 'mr. Joe Black'
                    },
                    {
                        number: 89991113344,
                        owner: 'mr. Joe Doe'
                    },
                    {
                        number: 92223334455,
                        owner: 'mr. Joe Black'
                    },
                    {
                        number: 89991113344,
                        owner: 'mr. Joe Doe'
                    },
                    {
                        number: 92223334455,
                        owner: 'mr. Joe Black'
                    },
                    {
                        number: 89991113344,
                        owner: 'mr. Joe Doe'
                    },
                    {
                        number: 92223334455,
                        owner: 'mr. Joe Black'
                    },
                    {
                        number: 89991113344,
                        owner: 'mr. Joe Doe'
                    },
                    {
                        number: 92223334455,
                        owner: 'mr. Joe Black'
                    },
                    {
                        number: 89991113344,
                        owner: 'mr. Joe Doe'
                    },
                    {
                        number: 92223334455,
                        owner: 'mr. Joe Black'
                    },
                    {
                        number: 89991113344,
                        owner: 'mr. Joe Doe'
                    },
                    {
                        number: 92223334455,
                        owner: 'mr. Joe Black'
                    },
                    {
                        number: 89991113344,
                        owner: 'mr. Joe Doe'
                    },
                    {
                        number: 92223334455,
                        owner: 'mr. Joe Black'
                    },
                    {
                        number: 89991113344,
                        owner: 'mr. Joe Doe'
                    },
                    {
                        number: 92223334455,
                        owner: 'mr. Joe Black'
                    },
                    {
                        number: 89991113344,
                        owner: 'mr. Joe Doe'
                    },
                    {
                        number: 92223334455,
                        owner: 'mr. Joe Black'
                    },
                    {
                        number: 89991113344,
                        owner: 'mr. Joe Doe'
                    },
                    {
                        number: 92223334455,
                        owner: 'mr. Joe Black'
                    },
                    {
                        number: 89991113344,
                        owner: 'mr. Joe Doe'
                    },
                    {
                        number: 92223334455,
                        owner: 'mr. Joe Black'
                    },
                    {
                        number: 89991113344,
                        owner: 'mr. Joe Doe'
                    },
                    {
                        number: 92223334455,
                        owner: 'mr. Joe Black'
                    },
                    {
                        number: 89991113344,
                        owner: 'mr. Joe Doe'
                    },
                    {
                        number: 92223334455,
                        owner: 'mr. Joe Black'
                    },
                    {
                        number: 89991113344,
                        owner: 'mr. Joe Doe'
                    },
                    {
                        number: 92223334455,
                        owner: 'mr. Joe Black'
                    },
                    {
                        number: 89991113344,
                        owner: 'mr. Joe Doe'
                    },
                    {
                        number: 92223334455,
                        owner: 'mr. Joe Black'
                    },
                    {
                        number: 89991113344,
                        owner: 'mr. Joe Doe'
                    },
                    {
                        number: 92223334455,
                        owner: 'mr. Joe Black'
                    },
                    {
                        number: 89991113344,
                        owner: 'mr. Joe Doe'
                    },
                    {
                        number: 92223334455,
                        owner: 'mr. Joe Black'
                    },
                    {
                        number: 89991113344,
                        owner: 'mr. Joe Doe'
                    },
                    {
                        number: 92223334455,
                        owner: 'mr. Joe Black'
                    },
                    {
                        number: 89991113344,
                        owner: 'mr. Joe Doe'
                    },
                    {
                        number: 92223334455,
                        owner: 'mr. Joe Black'
                    },
                    {
                        number: 89991113344,
                        owner: 'mr. Joe Doe'
                    },
                    {
                        number: 92223334455,
                        owner: 'mr. Joe Black'
                    },
                    {
                        number: 89991113344,
                        owner: 'mr. Joe Doe'
                    },
                    {
                        number: 92223334455,
                        owner: 'mr. Joe Black'
                    },
                    {
                        number: 89991113344,
                        owner: 'mr. Joe Doe'
                    },
                    {
                        number: 92223334455,
                        owner: 'mr. Joe Black'
                    },
                    {
                        number: 89991113344,
                        owner: 'mr. Joe Doe'
                    },
                    {
                        number: 92223334455,
                        owner: 'mr. Joe Black'
                    },
                    {
                        number: 89991113344,
                        owner: 'mr. Joe Doe'
                    },
                    {
                        number: 92223334455,
                        owner: 'mr. Joe Black'
                    },
                    {
                        number: 89991113344,
                        owner: 'mr. Joe Doe'
                    },
                    {
                        number: 92223334455,
                        owner: 'mr. Joe Black'
                    },
                    {
                        number: 89991113344,
                        owner: 'mr. Joe Doe'
                    },
                    {
                        number: 92223334455,
                        owner: 'mr. Joe Black'
                    },
                    {
                        number: 89991113344,
                        owner: 'mr. Joe Doe'
                    },
                    {
                        number: 92223334455,
                        owner: 'mr. Joe Black'
                    },
                ]
*/
            }
        },
        computed: {
            items() {
                return this.entities.phones.reduce(function(memo, row) {
                    if(row) {
                        row.number = row.number + '';
                        row.phone = row.number.replace(/(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/, '+$1 ($2) $3 - $4 - $5');
                        memo.push(row);
                    }
                    return memo;
                }, []);
            },
            pages () {
                if (this.pagination.rowsPerPage == null ||
                    this.pagination.totalItems == null
                )
                return 0;

                return Math.ceil(this.entities.phones.length / this.pagination.rowsPerPage)
            }

        },
        methods: {
            append() {
                this.phone.method = 'post';

                this.phone.copy = {
                    number: '',
                    owner: 'owner ' + new Date().toLocaleString()
                };

                this.phone.visible = true;
            },
            edit(item) {
                this.phone.method = 'patch';

                this.phone.copy = {...item};
                this.phone.visible = true;
            },
            save(item) {
                this.phone.visible = false;
                this.$request('phone', item, this.phone.method);
            },
            cancel() {
                this.phone.visible = false;
            },
            remove() {
                this.$request('phone', this.selected, 'delete');
            }
        }
    }

    //# sourceURL=phones-database.js
</script>