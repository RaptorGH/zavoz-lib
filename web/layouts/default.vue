<script setup>
const { session, signOut } = useAuth()
</script>

<template>
  <main class="z-main">
    <header class="z-row">
      <NuxtLink to="/" class="z-title">Переписка бота Zavoz</NuxtLink>
      <span v-if="session">
        <span class="z-muted">{{ session.user.email }}</span>
        <button class="z-link" @click="signOut">Выйти</button>
      </span>
    </header>
    <slot />
  </main>
</template>

<style>
:root{--bg:#f6f7f9;--card:#fff;--text:#1c1f24;--muted:#6b7280;--line:#e5e7eb;--in:#eef2ff;--out:#ecfdf5;--accent:#2563eb;--err:#dc2626}
@media (prefers-color-scheme:dark){:root{--bg:#111418;--card:#1a1e24;--text:#e6e8eb;--muted:#9aa3af;--line:#2a2f37;--in:#1e2740;--out:#14302a;--accent:#6ea0ff;--err:#f87171}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:16px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
a{color:var(--accent);text-decoration:none}
.z-main{max-width:760px;margin:0 auto;padding:16px}
.z-title{font-size:20px;font-weight:700;color:var(--text)}
.z-card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px;margin-bottom:12px;display:block;color:var(--text)}
.z-main label{display:block;font-size:14px;color:var(--muted);margin:10px 0 4px}
.z-main input{width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--text);font:inherit}
.z-main button{padding:10px 16px;border:0;border-radius:8px;background:var(--accent);color:#fff;font:inherit;cursor:pointer;margin-top:14px}
.z-main button.z-link{background:none;color:var(--accent);padding:4px 8px;margin:0}
.z-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:space-between;margin:8px 0 16px}
.z-msg{padding:10px 12px;border-radius:10px;margin:8px 0;white-space:pre-wrap;word-break:break-word}
.z-msg.in{background:var(--in);margin-right:12%}
.z-msg.out{background:var(--out);margin-left:12%}
.z-meta{font-size:12px;color:var(--muted);margin-top:4px}
.z-err{color:var(--err);margin-top:10px;font-size:14px}
.z-muted{color:var(--muted);font-size:14px}
</style>
