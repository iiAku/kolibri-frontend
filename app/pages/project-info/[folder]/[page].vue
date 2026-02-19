<script setup lang="ts">
const route = useRoute()
navigateTo(`/docs/${route.params.folder}/${route.params.page}`, { redirectCode: 301 })
</script>
