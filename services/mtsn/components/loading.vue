<template>
        <div v-if="visible" class="loading">
            <div>
                Loading...
            </div>
        </div>
</template>

<style scoped>
    .overlay {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        width: 100%;
    }

    .loading {
        position: fixed!important;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0; 
        background: rgba(0, 0, 0, 0.0);
        z-index: 90000!important;
        pointer-events: none!important;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        width: 100%;
    }
</style>

<script>

    module.exports = {
        //props: ['visible'],
        data() {
            return {
                visible: true,
                delay: void 0,
                internal_show: false
            }
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

    //# sourceURL=loading.js
</script>