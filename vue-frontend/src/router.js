import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

import Index from '@/pages/Index'
import ProjectInfo from "@/pages/ProjectInfo";
import AllOvens from "@/pages/AllOvens";
import NotFound from "@/pages/NotFound";
import TOS from "@/pages/TOS";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import SigningTool from "@/pages/SigningTool";
import LiquidityPool from "@/pages/LiquidityPool";
import Farming from "@/pages/Farming";

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
    {
        path: '/terms-of-service',
        name: 'TOS',
        component: TOS
    },
    {
        path: '/privacy-policy',
        name: 'PrivacyPolicy',
        component: PrivacyPolicy
    },
    {
        path: '/signing-tool',
        name: 'SigningTool',
        component: SigningTool
    },
    {
        path: '/liquidity-pool',
        name: 'LiquidityPool',
        component: LiquidityPool
    },
    {
        path: '/farming',
        name: 'Farming',
        component: Farming
    },
    { path: "*", component: NotFound }
]

export default new VueRouter({
    mode: "history",
    linkActiveClass: 'is-active',
    routes
})
