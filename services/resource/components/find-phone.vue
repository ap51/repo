<template>
    <div class="layout-view">
        <h1>enter phone number:</h1>
        <div class="phone">
            <v-form ref="form" lazy-validation @submit.prevent="find">
                <v-text-field
                        v-model="number"
                        label="phone number"
                        single-line
                        prepend-icon="fas fa-mobile"
                        color="blue darken-2"
                        mask="+# (###) ### - ## - ##"
                        hint="for example, 79009000101"
                        :rules="[
                          () => !!number || 'This field is required',
                          () => !!number && number.length >= 11 || 'phone number must be at least 11 digits',
                        ]"
                ></v-text-field>
            </v-form>
        </div>

        <div>
            <v-btn color="blue darken-2" flat="flat" @click.stop="clear"><v-icon class="mr-1 mb-1">fas fa-times-circle</v-icon>clear</v-btn>
            <v-btn color="blue darken-2" flat="flat" @click.stop="find"><v-icon class="mr-1 mb-1">fas fa-search</v-icon>find</v-btn>
        </div>

        <div>
            <component :is="out" :results="results"></component>
        </div>
    </div>
</template>

<style scoped>
    .layout-view {
        display: flex;
        justify-content: start;
        align-items: center;
        overflow: auto;
        height: 100%;
    }

    .layout-view {
        flex-direction: column;
    }

    .phone {
        width: 25%;
    }

    .layout-view h1 {
        margin-top: 8px;
        margin-bottom: 8px;
    }

</style>

<script>
    module.exports = {
        extends: component,
        components: {
            'not-found-phone': httpVueLoader('not-found-phone'),
            'found-phone': httpVueLoader('found-phone'),
            'validation-error': httpVueLoader('validation-error'),
        },
        data() {
            return {
                number: '',
                results: '',
                out: ''
            }
        },
        methods: {
            find() {
                let self = this;

                this.results = {
                    number: this.number
                };


                if (this.$refs.form.validate()) {

                    let found = this.entities.phones.find(function (phone) {
                        let match = phone.number === self.number;
                        match && (self.results = phone);
                        return match;
                    });

                    this.out = found ? 'found-phone' : 'not-found-phone';
                }
                else this.out = 'validation-error';
            },
            clear () {
                this.$refs.form.reset()
            }
        },
        watch: {
            'number': function () {
                this.out = '';
            }
        }
    }

    //# sourceURL=find-phone.js
</script>