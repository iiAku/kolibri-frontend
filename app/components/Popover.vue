<template>
  <VDropdown :triggers="['hover']" placement="bottom" :disabled="disabled" :popperClass="extraClasses">
    <slot />
    <template #popper>
      <div :class="extraClasses" class="popover-content">
        <slot name="popup-title" />
        <slot name="popup-content" />
      </div>
    </template>
  </VDropdown>
</template>

<script setup lang="ts">
defineProps<{
  disabled?: boolean
  extraClasses?: string
}>()
</script>

<style lang="scss">
.v-popper--theme-dropdown {
  display: inline;
}
.popover-content {
  color: $grey-dark;
}
</style>
