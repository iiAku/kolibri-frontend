<template>
  <div class="project-info">
    <div class="container">
      <div class="box">
        <div class="header">
          <h1 class="title is-4 is-marginless">Kolibri Documentation</h1>
          <a @click="menuOpen=!menuOpen" role="button" v-on:clickout="menuOpen=false" class="navbar-burger" :class="{'is-active': menuOpen}">
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </a>
        </div>
        <div class="columns is-marginless">
          <div class="column is-3 sidebar" :class="{'is-active': menuOpen}">
            <aside class="menu">
              <template v-for="[pageFolder, pages] in sortFolders(allPages)">
                <p :key="pageFolder" class="menu-label">
                  {{ titleCase(pageFolder) }}
                </p>
                <ul :key="JSON.stringify(pages)" class="menu-list">
                  <li :key="url" v-for="[page, url] in sortPages(pages)">
                    <router-link :to="{ name: 'ProjectInfo', params: { folder: pageFolder, page: page } }">{{ titleCase(page.replaceAll('-', ' ')) }}</router-link>
                  </li>
                </ul>
              </template>
            </aside>
          </div>
          <div class="column">
            <div v-if="pageContent !== null" v-html="pageContent" class="docs-content content"></div>
            <div v-else class="is-flex is-justify-content-center is-align-items-center is-height-full">
              <div class="loader is-large is-primary"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import marked from 'marked'
import _ from 'lodash'

const allDocs = (ctx => {
  let keys = ctx.keys();
  let values = keys.map(ctx);
  return keys.reduce((o, k, i) => { o[k] = values[i]; return o; }, {});
})(require.context('../../../documentation/public/', true, /.md$/));

export default {
  name: 'ProjectInfo',
  async mounted(){
    this.syncPage()
  },
  components: {
  },
  computed: {
  },
  methods: {
    sortFolders(folders){
      return _(folders)
          .toPairs()
          .orderBy(([folderName]) => {
            return this.preferredFolderOrder.slice().reverse().indexOf(folderName)
          }, 'desc')
          .value()
    },
    sortPages(pages){
      return _(pages)
          .toPairs()
          .orderBy(([pageName]) => {
            return this.preferredPageOrder.slice().reverse().indexOf(pageName)
          }, 'desc')
          .value()
    },
    syncPage(){
      if (
          // If we have a requested page that doesn't exist, redirect them to the intro
          (this.$route.name === 'ProjectInfo' || this.$route.name === 'ProjectInfoRoot') &&
          (
              this.$route.params.folder === undefined ||
              this.$route.params.page === undefined ||
              this.allPages[this.$route.params.folder] === undefined ||
              this.allPages[this.$route.params.folder][this.$route.params.page] === undefined
          )
      ){
        this.resetPage()
      } else {
        const url = this.allPages[this.$route.params.folder][this.$route.params.page]
        fetch(url)
          .then(async (result) => {
            let response = await result.text()
            this.pageContent = marked(response)
          })
      }
    },
    resetPage(){
      return this.$router.replace({ name: 'ProjectInfo', params: { folder: 'general', page: 'intro' } })
    },
    titleCase(str) {
      return str.toLowerCase().split(' ').map(function(word) {
        return (word.charAt(0).toUpperCase() + word.slice(1));
      }).join(' ');
    }
  },
  watch:{
    $route (to){
      if (to.name === 'ProjectInfo' || to.name === 'ProjectInfoRoot'){
        this.pageContent = null
        this.syncPage()
      }
    }
  },
  data(){
    return {
      pageContent: null,
      menuOpen: false,
      pages: allDocs,
      preferredFolderOrder: ['general', 'security', 'liquidation', 'oracle'],
      preferredPageOrder: ['intro'],
      allPages: _(allDocs).reduce((acc, url, filename) => {
        const [folder, file] = filename.substr(2).split('/')
        if (acc[folder] === undefined) {
          acc[folder] = {}
        }

        acc[folder][file.slice(0, -3)] = url

        return acc
      }, {}),
    }
  }
}
</script>

<style type="text/scss" lang="scss">
  @import '../assets/sass/globals';
  .project-info{
    background: $light-grey;
    min-height: calc(100vh - 4rem - 5px);
    .container{
      padding: 3rem 0;
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
        @include until($tablet) {
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
  }
</style>
