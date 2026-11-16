/*
 * Zavoz Lib 2.x: «мини-Nuxt» без сервера и без Node.
 * Подключает Vue Router и загрузчик .vue-файлов, читает манифест routes.json и компоненты из Supabase Storage (бакет lib, папка web/)
 * и строит приложение с теми же понятиями, что в Nuxt: app.vue, pages/, layouts/, composables/, middleware/,
 * definePageMeta, useRoute, useRouter, navigateTo, useState, useRuntimeConfig, NuxtPage, NuxtLayout, NuxtLink.
 * Файлы в web/ написаны по правилам Nuxt 3 и без изменений переносятся в проект Nuxt (см. README.md).
 *
 * Страница вызывает: ZavozLib.mount('#app', { supabaseUrl, supabaseKey }). Секретов здесь нет.
 */
(function (global) {
  'use strict';
  var VERSION = '2.0.0';
  var CDN = {
    router: 'https://cdn.jsdelivr.net/npm/vue-router@4.4.5/dist/vue-router.global.prod.js',
    sfc: 'https://cdn.jsdelivr.net/npm/vue3-sfc-loader@0.9.5/dist/vue3-sfc-loader.js',
  };

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('Не загрузился скрипт ' + src)); };
      document.head.appendChild(s);
    });
  }

  async function mount(selector, opts) {
    var el = document.querySelector(selector);
    try {
      var Vue = global.Vue;
      if (!Vue || !global.supabase) throw new Error('Нужны Vue и supabase-js (подключите их до библиотеки)');
      await loadScript(CDN.router);
      await loadScript(CDN.sfc);
      var VueRouter = global.VueRouter;
      var loader = global['vue3-sfc-loader'];
      var base = opts.webBase || opts.supabaseUrl + '/storage/v1/object/public/lib/web/';
      var cfg = { public: { supabaseUrl: opts.supabaseUrl, supabaseKey: opts.supabaseKey } };

      var res = await fetch(base + 'routes.json?t=' + Date.now());
      if (!res.ok) throw new Error('Не найден routes.json (' + res.status + '). Опубликуйте web/ функцией publish-lib');
      var manifest = await res.json();

      // ---- Автоимпорт в стиле Nuxt: Vue API и функции рантайма доступны компонентам как глобальные ----
      var router = VueRouter.createRouter({ history: VueRouter.createWebHashHistory(), routes: [] });
      var guardActive = false;
      var states = {};
      var middleware = {};
      var layouts = {};
      var cache = {};

      function navigateTo(to) {
        if (guardActive) return { __redirect: to };
        return router.push(to);
      }
      function useState(key, init) {
        if (!states[key]) states[key] = Vue.ref(typeof init === 'function' ? init() : init);
        return states[key];
      }
      Object.assign(global, {
        ref: Vue.ref, reactive: Vue.reactive, computed: Vue.computed, watch: Vue.watch, watchEffect: Vue.watchEffect,
        onMounted: Vue.onMounted, onUnmounted: Vue.onUnmounted, onBeforeUnmount: Vue.onBeforeUnmount, nextTick: Vue.nextTick,
        toRef: Vue.toRef, toRefs: Vue.toRefs, shallowRef: Vue.shallowRef, provide: Vue.provide, inject: Vue.inject,
        useRoute: VueRouter.useRoute, useRouter: VueRouter.useRouter,
        navigateTo: navigateTo, useState: useState,
        useRuntimeConfig: function () { return cfg; },
        definePageMeta: function () {}, // в Nuxt это макрос компилятора; здесь мета берётся из routes.json
        defineNuxtRouteMiddleware: function (fn) { return fn; },
      });

      var sfcOptions = {
        moduleCache: { vue: Vue, 'vue-router': VueRouter },
        getFile: async function (url) {
          var r = await fetch(url);
          if (!r.ok) throw new Error(url + ': ' + r.status);
          return { getContentData: function (asBinary) { return asBinary ? r.arrayBuffer() : r.text(); } };
        },
        addStyle: function (css) {
          var st = document.createElement('style');
          st.textContent = css;
          document.head.appendChild(st);
        },
      };
      function load(file) {
        if (!cache[file]) cache[file] = loader.loadModule(base + file, sfcOptions);
        return cache[file];
      }

      // ---- composables/: все экспортируемые функции становятся глобальными (как автоимпорт Nuxt) ----
      for (var i = 0; i < (manifest.composables || []).length; i++) {
        var mod = await load(manifest.composables[i]);
        Object.keys(mod).forEach(function (k) { if (typeof mod[k] === 'function') global[k] = mod[k]; });
      }
      // ---- middleware/ и layouts/ ----
      var mwNames = Object.keys(manifest.middleware || {});
      for (var j = 0; j < mwNames.length; j++) {
        var m = await load(manifest.middleware[mwNames[j]]);
        middleware[mwNames[j]] = m.default || m;
      }
      var lyNames = Object.keys(manifest.layouts || {});
      for (var k2 = 0; k2 < lyNames.length; k2++) layouts[lyNames[k2]] = await load(manifest.layouts[lyNames[k2]]);

      // ---- pages/ → маршруты ----
      (manifest.routes || []).forEach(function (r) {
        router.addRoute({ path: r.path, name: r.name, meta: r.meta || {}, component: function () { return load(r.file); } });
      });
      router.beforeEach(async function (to, from) {
        var names = (to.meta && to.meta.middleware) || [];
        for (var n = 0; n < names.length; n++) {
          var fn = middleware[names[n]];
          if (!fn) continue;
          var out;
          guardActive = true;
          try { out = await fn(to, from); } finally { guardActive = false; }
          if (out === false) return false;
          if (out && out.__redirect !== undefined) return out.__redirect;
        }
      });

      var root = manifest.app
        ? await load(manifest.app)
        : { template: '<NuxtLayout><NuxtPage /></NuxtLayout>' };
      var app = Vue.createApp(root);
      app.component('NuxtPage', VueRouter.RouterView);
      app.component('NuxtLink', {
        props: { to: { type: [String, Object], required: true } },
        setup: function (props, ctx) {
          return function () { return Vue.h(VueRouter.RouterLink, { to: props.to }, { default: function () { return ctx.slots.default && ctx.slots.default(); } }); };
        },
      });
      app.component('NuxtLayout', {
        setup: function (_p, ctx) {
          var route = VueRouter.useRoute();
          return function () {
            var name = route.meta && route.meta.layout !== undefined ? route.meta.layout : 'default';
            var comp = name === false ? null : layouts[name];
            return comp ? Vue.h(comp, null, { default: function () { return ctx.slots.default && ctx.slots.default(); } }) : ctx.slots.default && ctx.slots.default();
          };
        },
      });
      app.use(router);
      app.mount(selector);
      await router.isReady();
      return app;
    } catch (e) {
      if (el) el.innerHTML = '<p style="color:#dc2626;font:14px system-ui;padding:16px">Ошибка запуска: ' + String(e.message || e).replace(/</g, '&lt;') + '</p>';
      throw e;
    }
  }

  global.ZavozLib = { version: VERSION, mount: mount };
})(window);
