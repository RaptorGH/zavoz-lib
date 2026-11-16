# zavoz-lib: интерфейс на Vue в стиле Nuxt, без сервера и без Node

Библиотека пользователя. Публикуется в публичный бакет Supabase `lib`; страница на GitHub Pages ([zavoz-web](https://github.com/RaptorGH/zavoz-web)) только подключает её.

## Структура (как в Nuxt 3)
```
zavoz-lib.js          «мини-Nuxt»: рантайм (подключает Vue Router и загрузчик .vue, строит приложение). Версия в VERSION.
web/                  корень проекта в духе Nuxt (его можно взять как корень проекта Nuxt)
├── app.vue           корневой компонент: <NuxtLayout><NuxtPage /></NuxtLayout>
├── pages/            страницы, маршруты по файлам: index.vue → /, login.vue → /login, chat/[id].vue → /chat/:id
├── layouts/          каркасы страниц (default.vue со <slot />)
├── composables/      функции useXxx (автоподключаются, как в Nuxt)
└── middleware/       защита страниц: definePageMeta({ middleware: 'auth' })
```

## Как это работает без Node
1. `index.html` на GitHub Pages подключает Vue, supabase-js и `zavoz-lib.js`.
2. Рантайм читает `web/routes.json` (собирает функция `publish-lib` по структуре `web/pages` аналогично файловой маршрутизации Nuxt), подгружает `.vue` и `.js` из бакета и компилирует их в браузере (vue3-sfc-loader). Маршрутизация в режиме `#` (hash), как `hashMode` в Nuxt для статического хостинга.
3. Для компонентов доступны привычные функции Nuxt: `ref/computed/watch/onMounted…`, `useRoute`, `useRouter`, `navigateTo`, `useState`, `useRuntimeConfig`, `definePageMeta`, `defineNuxtRouteMiddleware`, компоненты `NuxtPage`, `NuxtLayout`, `NuxtLink`.

## Публикация
1. Правки в этой папке → `git push` в репозиторий `RaptorGH/zavoz-lib` (ветка `main`).
2. Вызвать функцию: `POST https://auvxkluwnpzujmzjgrrv.supabase.co/functions/v1/publish-lib` с заголовком `Authorization: Bearer <anon-ключ>`. Она берёт файлы из GitHub, кладёт в бакет `lib`, пересобирает `web/routes.json`.
3. При изменении `zavoz-lib.js` повышать `VERSION`. Лимит GitHub API без токена: 60 запросов в час (одна публикация ≈ число файлов + 1).

## Перенос на настоящий Nuxt 3
- Копируете `web/` как корень проекта Nuxt (`app.vue`, `pages/`, `layouts/`, `composables/`, `middleware/` лежат на тех же местах). Маршруты Nuxt построит сам, `routes.json` не нужен.
- В `nuxt.config.ts`: `ssr: false`, `app: { baseURL }` и при необходимости `router: { options: { hashMode: true } }`; в `runtimeConfig.public`: `supabaseUrl`, `supabaseKey`.
- `useSupabaseClient` и `useAuth` оставляются как свои composables (или заменяются модулем `@nuxtjs/supabase`).
- Что учесть: Nuxt при `definePageMeta` берёт мету из файла сам; `navigateTo` внутри middleware возвращается как у Nuxt; сторонние `import` в `.vue` в рантайме пока не поддерживаются (в Nuxt они будут работать).

## Куда сохраняется сессия входа
Supabase-js хранит сессию в `localStorage` браузера (ключ `sb-<id проекта>-auth-token`), не в куках. Домен хранения: `raptorgh.github.io`.
