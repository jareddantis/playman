import Vue from 'vue'
import '../styles/global.scss'

Vue.component('PlaylistCard', () => import(/* webpackChunkName: "PlaylistCard" */ './PlaylistCard.vue'))
