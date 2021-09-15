<template>
  <popper
      trigger="hover"
      :options="{ placement: 'bottom' }"
      :disabled="disabled"
  >
    <div :class="extraClasses" class="popper">
      <slot name="popup-title"></slot>
      <slot name="popup-content"></slot>
    </div>

    <slot slot="reference"></slot>
  </popper>
</template>

<script>
import Popper from 'vue-popperjs'

export default {
  name: 'Popover',
  props: ['popupTitle', 'popupContent', 'disabled', 'extraClasses'],
  mounted(){

  },
  components: {
    Popper
  },
  data(){
    return {
    }
  },
  methods: {

  }
}
</script>

<style type="text/scss" lang="scss">
@import '../assets/sass/globals';
.popper{
  color: $grey-dark;
}
</style>
