<template>
    <v-dialog v-model="isVisible" max-width="400px" hide-overlay>
        <v-card>
            <v-card-title>
                <v-icon class="mr-1 blue--text text--darken-2">fas fa-mobile</v-icon>
                <span class="headline blue--text text--darken-2">phone</span>
            </v-card-title>
            <v-card-text>
                <v-container grid-list-md>
                    <v-layout wrap>
                        <v-form ref="form" lazy-validation @submit.prevent>
                            <v-flex xs12>
                                <v-text-field v-model="phone.number"
                                              label="Number"
                                              required
                                              prepend-icon="fas fa-mobile"
                                              autofocus
                                              color="blue darken-2"
                                              mask="+# (###) ### - ## - ##"
                                              hint="for example, 79009000101"
                                              :rules="rules(phone)"
                                ></v-text-field>
                            </v-flex>
                            <v-flex xs12>
                                <v-text-field v-model="phone.owner"
                                              validate-on-blur
                                              label="Owner"
                                              required
                                              prepend-icon="fas fa-user"
                                              color="blue darken-2"
                                              hint="any string value"
                                              :rules="[
                                                  () => !!phone.owner || 'This field is required',
                                              ]"
                                ></v-text-field>
                            </v-flex>
                        </v-form>
                    </v-layout>
                </v-container>
                <small>*indicates required field</small>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-2" flat @click.native="cancel">cancel</v-btn>
                <v-btn color="blue darken-2" flat @click.native="save(phone)">save</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style scoped>

</style>

<script>
    module.exports = {
        props: [
            'visible',
            'phone'
        ],
        computed: {
            copy: {
                cache: false,
                get: function () {
                    return {...this.phone};
                }
            },
            isVisible: {
                get() {
                    
                    return this.visible;
                },
                set(value) {
                    !value && this.cancel();
                }
            }
        },
        methods: {
            rules(phone) {
                return  [
                    () => !!phone.number || 'This field is required',
                    () => !!phone.number && phone.number.length >= 11 || 'Phone number must be at least 11 digits'
                ]
            },
            cancel() {
                this.$emit('cancel');
            },
            save(phone) {
                if (this.$refs.form.validate()) {
                    this.$emit('save', phone);
                }
                else this.$bus.$emit('snackbar', 'Data entered don\'t match validation rules');
            }
        },
        watch: {
            'visible': function (newValue, oldValue) {
            }
        }
    }

    //# sourceURL=phone-dialog.js
</script>