<script setup lang="ts">
import { marked } from 'marked'

const route = useRoute()

const allDocFiles = import.meta.glob<string>('../../../../kolibri-docs/**/*.md', { query: '?raw', import: 'default' })

const allPages = computed(() => {
  const pages: Record<string, Record<string, string>> = {}

  for (const path of Object.keys(allDocFiles)) {
    // path looks like ../../../../kolibri-docs/general/intro.md
    const match = path.match(/kolibri-docs\/(.+)$/)
    if (!match) continue
    const relativePath = match[1]
    const parts = relativePath.split('/')
    if (parts.length !== 2) continue

    const folder = parts[0]
    const file = parts[1].replace(/\.md$/, '')

    if (pages[folder] === undefined) {
      pages[folder] = {}
    }
    pages[folder][file] = path
  }

  return pages
})

const preferredFolderOrder = ['general', 'security', 'liquidation', 'oracle']
const preferredPageOrder = ['intro']

const sortFolders = (folders: Record<string, Record<string, string>>) => {
  return Object.entries(folders).sort(([a], [b]) => {
    const reversedOrder = [...preferredFolderOrder].reverse()
    const aIdx = reversedOrder.indexOf(a)
    const bIdx = reversedOrder.indexOf(b)
    return bIdx - aIdx
  })
}

const sortPages = (pages: Record<string, string>) => {
  return Object.entries(pages).sort(([a], [b]) => {
    const reversedOrder = [...preferredPageOrder].reverse()
    const aIdx = reversedOrder.indexOf(a)
    const bIdx = reversedOrder.indexOf(b)
    return bIdx - aIdx
  })
}

const titleCase = (str: string): string =>
  str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')

const pageContent = ref<string | null>(null)
const menuOpen = ref(false)

const syncPage = async () => {
  const folder = route.params.folder as string | undefined
  const page = route.params.page as string | undefined

  if (
    !folder ||
    !page ||
    allPages.value[folder] === undefined ||
    allPages.value[folder][page] === undefined
  ) {
    await navigateTo('/docs/general/intro', { replace: true })
    return
  }

  const filePath = allPages.value[folder][page]
  const loader = allDocFiles[filePath]
  if (loader) {
    const rawContent = await loader()
    pageContent.value = marked(rawContent) as string
  }
}

watch(() => [route.params.folder, route.params.page], () => {
  pageContent.value = null
  syncPage()
}, { immediate: true })
</script>

<template>
  <div class="project-info">
    <div class="container">
      <div class="box">
        <div class="header">
          <h1 class="title is-4 is-marginless">Documentation</h1>
          <a role="button" class="navbar-burger" :class="{ 'is-active': menuOpen }" @click="menuOpen = !menuOpen">
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </a>
        </div>
        <div class="columns is-marginless">
          <div class="column is-3 sidebar" :class="{ 'is-active': menuOpen }">
            <aside class="menu">
              <template v-for="[pageFolder, pages] in sortFolders(allPages)" :key="pageFolder">
                <p class="menu-label">
                  {{ titleCase(pageFolder) }}
                </p>
                <ul class="menu-list">
                  <li v-for="[pageName] in sortPages(pages)" :key="pageName">
                    <NuxtLink :to="`/docs/${pageFolder}/${pageName}`">{{ titleCase(pageName.replaceAll('-', ' ')) }}</NuxtLink>
                  </li>
                </ul>
              </template>
            </aside>
          </div>
          <div class="column docs-wrapper">
            <div v-if="pageContent !== null" class="docs-content content" v-html="pageContent"></div>
            <div v-else class="is-flex is-justify-content-center is-align-items-center is-height-full">
              <div class="loader is-large is-primary"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style type="text/scss" lang="scss">
  .project-info{
    background: $light-grey;
    min-height: calc(100vh - 4rem - 5px);
    .container{
      padding: 3rem 0;
      @include until($desktop){
        padding-top: 1rem;
      }
    }
    .is-height-full{
      height: 100%;
    }
    .box{
      padding: 0;
      @include until($tablet){
        .sidebar{
          display: none;
          &.is-active{
            display: block;
          }
        }
      }
      .header{
        padding: 1rem 2rem;
        border-bottom: 2px solid $light-grey;
        @include until($desktop) {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: .5rem 1rem;
          .title{
            margin-bottom: 0;
          }
        }
      }
      .sidebar{
        padding: 1rem;
        border-right: 2px solid $light-grey;
      }
      .docs-content{
        padding: 1rem;
        a{
          font-weight: bold;
        }
        .table{
          width: auto;
        }
      }
    }
    .docs-wrapper{
      overflow: scroll;
    }
  }
</style>
