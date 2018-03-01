<template>
    <div class="layout-view pa-1">
        <h1>phone you entered found in database:</h1>
        <v-icon color="green darken-2" class="shadow">fas fa-check-circle fa-3x</v-icon>

        <v-data-table
                :headers="headers"
                :items="items"
                hide-actions
                class="table elevation-1 mt-2 ma-1"
        >
            <template slot="items" slot-scope="props">
                <td>
                    <v-icon class="data-icon pb-1 mr-1">fas fa-mobile</v-icon>
                    {{ props.item.phone }}
                </td>
                <td>
                    <v-icon class="data-icon pb-1 mr-1">fas fa-user</v-icon>
                    {{ props.item.owner }}
                </td>
            </template>
        </v-data-table>

    </div>
</template>

<style scoped>
    .layout-view {
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: auto;
        height: 100%;
        flex-direction: column;
        font-size: 10px;
    }

    .table {
        width: 100%
    }

    .data-icon {
        font-size: 14px;
    }

</style>

<script>
    module.exports = {
        extends: component,
        props: ['results'],
        data() {
            return {
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
                ]
            }
        },
        computed: {
            phone(){
                return (this.results.number + '').replace(/(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/, '+$1 ($2) $3 - $4 - $5');
            },
            items() {
                return [{
                    phone: this.phone,
                    owner: this.results.owner
                }];
            }
        }
    }

    //# sourceURL=found-phone.js
</script>