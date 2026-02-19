<script setup lang="ts">
</script>

<template>
  <section class="not-found hero is-fullheight is-align-items-center">
    <div class="hero-body">
      <div class="container">
        <h1 class="title">
          Not Found
        </h1>
        <h2 class="subtitle">
          Apologies, but we're not sure what you're looking for!
        </h2>
      </div>
    </div>
  </section>
</template>

<style type="text/scss" lang="scss">
  .not-found{
    &.is-fullheight{
      min-height: calc(100vh - 4rem - 5px);
    }
    background: $light-grey;
    .hero-body{
      width: 85vw;
    }
  }
</style>
