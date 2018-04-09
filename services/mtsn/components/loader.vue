<template>
    <div v-if="show" class="loader-overlay">
        <div v-bind:style="styles" style="z-index: 999" class="spinner spinner--circle-4"></div>
    </div>
</template>

<script>
    module.exports = {
        data() {
            return {
                visible: true,
                internal_show: true
            }
        },
        props: {
            size: {
                default: '60px'
            },
/*
            visible: {
                default: true
            }
*/
        },
        created() {
            let self = this;
            this.$bus.$on(`loading`, function(data) {
                if(data) {
                    self.delay = setTimeout(function() {
                        self.visible = true;
                    }, 250);
                }
                else {
                    self.delay && clearTimeout(self.delay);
                    self.visible = false;
                }

            });
        },
        computed: {
            styles () {
                return {
                    width: this.size,
                    height: this.size,
                    'z-index': 9999
                }
            },
            show() {
                let self = this;
                if(self.visible) {
                    self.delay = setTimeout(function() {
                        self.internal_show = true;
                    }, 250);
                }
                else {
                    self.delay && clearTimeout(self.delay);
                    self.internal_show = false;
                }

                return self.visible && self.internal_show;
            }

        }
    }
    //# sourceURL=spin-loader.js
</script>

<!--<style lang="scss" scoped>-->
<style scoped>
    .loader-overlay {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 100%;
        background-color: rgba(0, 0, 0, 0);
        z-index: 999;
    }

    .spinner {
        position: absolute;
        z-index: 999;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        margin: auto;
        width: 40px;
        height: 40px;
        box-sizing: border-box;
        /*position: relative;*/
        border: 3px solid transparent;
        border-top-color: #f7484e;
        border-radius: 50%;
        animation: circle-4-spin 2s linear infinite;
    }
    .spinner:before, .spinner:after {
        content: '';
        box-sizing: border-box;
        position: absolute;
        border: 3px solid transparent;
        border-radius: 50%;
    }

    .spinner:before {
        border-top-color: #f8b334;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        animation: circle-4-spin 3s linear infinite;
    }

    .spinner:after {
        border-top-color: #41b883;
        top: 6px;
        left: 6px;
        right: 6px;
        bottom: 6px;
        animation: spin 4s linear infinite;
    }

    @keyframes circle-4-spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
</style>

