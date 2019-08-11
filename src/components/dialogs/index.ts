import Vue from 'vue'

Vue.component('ConfirmCopyDialog', () => import(/* webpackChunkName: "ccd" */'./ConfirmCopyDialog.vue'))
Vue.component('ConfirmDeleteDialog', () => import(/* webpackChunkName: "cdd" */'./ConfirmDeleteDialog.vue'))
Vue.component('ConfirmExportDialog', () => import(/* webpackChunkName: "ced" */'./ConfirmExportDialog.vue'))
Vue.component('ConfirmMergeDialog', () => import(/* webpackChunkName: "cmd" */'./ConfirmMergeDialog.vue'))
Vue.component('ConfirmShuffleDialog', () => import(/* webpackChunkName: "csd" */'./ConfirmShuffleDialog.vue'))
Vue.component('PlaylistEditDialog', () => import(/* webpackChunkName: "ped" */'./PlaylistEditDialog.vue'))
Vue.component('PlaylistPickerDialog', () => import(/* webpackChunkName: "ppd" */'./PlaylistPickerDialog.vue'))
Vue.component('SortDialog', () => import(/* webpackChunkName: "sd" */'./SortDialog.vue'))
