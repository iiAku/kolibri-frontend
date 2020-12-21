import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

import Index from '@/pages/Index'
import ProjectInfo from "@/pages/ProjectInfo";
import AllOvens from "@/pages/AllOvens";
import NotFound from "@/pages/NotFound";

const routes = [
    {
        path: '/',
        name: 'Index',
        component: Index
    },
    {
        path: '/project-info',
        name: 'ProjectInfoRoot',
        component: ProjectInfo,
    },
    {
        path: '/project-info/:folder/:page',
        name: 'ProjectInfo',
        component: ProjectInfo,
    },
    {
        path: '/all-ovens',
        name: 'AllOvens',
        component: AllOvens
    },
    { path: "*", component: NotFound }
]

export default new VueRouter({
    mode: "history",
    linkActiveClass: 'is-active',
    routes
})
