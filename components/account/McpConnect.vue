<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthedFetch } from '~/composables/useAuthedFetch'

// "MCP" tab on /account: how to plug the blog's MCP endpoint (/mcp) into each
// AI client, plus the clients currently holding a token and a kill switch.
// Shown only to studio grantees — the endpoint refuses everyone else anyway.
//
// Every client below signs in through the same OAuth flow (dynamic client
// registration + the consent page at /oauth/authorize), so no token is ever
// copied by hand. Keep the steps in sync with the vendors' docs when they move.

interface ConnectedClient {
  clientId: string
  clientName: string
  lastIssuedAt: string
}

interface Step {
  text: string
  code?: string
}

interface ClientGuide {
  key: string
  label: string
  note?: string
  steps: Step[]
}

const { authedFetch } = useAuthedFetch()

// The canonical URL on the server and in the guide; `window.location.origin`
// keeps the snippets right on preview / localhost too.
const mcpUrl = ref('https://ravy.pro/mcp')

const guides = computed<ClientGuide[]>(() => [
  {
    key: 'claude',
    label: 'Claude',
    note: 'claude.ai web, Claude Desktop and the mobile apps share connectors — add it once, it shows up everywhere. Needs a paid plan.',
    steps: [
      { text: 'Open Settings → Connectors → Add custom connector.' },
      { text: 'Name it "ravy.pro" and paste the URL. Leave the OAuth fields under Advanced empty.', code: mcpUrl.value },
      { text: 'Click Connect, sign in here with this Google account and press Allow.' },
      { text: 'In a chat, enable the connector from the tools menu and ask for a post.' },
    ],
  },
  {
    key: 'claude-code',
    label: 'Claude Code',
    steps: [
      { text: 'Add the server (user scope makes it available in every project):', code: `claude mcp add --transport http --scope user ravy ${mcpUrl.value}` },
      { text: 'Start claude, run /mcp, pick "ravy" → Authenticate. A browser tab opens for the sign-in.', code: '/mcp' },
    ],
  },
  {
    key: 'codex',
    label: 'Codex',
    note: 'OpenAI Codex CLI and the Codex IDE extension read the same ~/.codex/config.toml.',
    steps: [
      { text: 'Add the server:', code: `codex mcp add ravy --url ${mcpUrl.value}` },
      { text: 'Or put it into ~/.codex/config.toml by hand:', code: `[mcp_servers.ravy]\nurl = "${mcpUrl.value}"` },
      { text: 'Sign in (opens the browser):', code: 'codex mcp login ravy' },
    ],
  },
  {
    key: 'chatgpt',
    label: 'ChatGPT',
    note: 'Custom MCP connectors with write tools need Developer mode (Plus/Pro/Business plans).',
    steps: [
      { text: 'Settings → Apps & Connectors → Advanced settings → turn on Developer mode.' },
      { text: 'Back in Apps & Connectors → Create. Paste the URL, Authentication: OAuth.', code: mcpUrl.value },
      { text: 'Sign in here and press Allow, then pick the connector in a chat via + → Developer mode.' },
    ],
  },
  {
    key: 'cursor',
    label: 'Cursor',
    steps: [
      { text: 'Add to ~/.cursor/mcp.json (or .cursor/mcp.json in a project):', code: `{\n  "mcpServers": {\n    "ravy": { "url": "${mcpUrl.value}" }\n  }\n}` },
      { text: 'Settings → MCP shows "ravy" with a Login button — click it and sign in.' },
    ],
  },
  {
    key: 'vscode',
    label: 'VS Code',
    note: 'GitHub Copilot agent mode.',
    steps: [
      { text: 'Command palette → "MCP: Add Server" → HTTP, paste the URL. Or add to .vscode/mcp.json:', code: `{\n  "servers": {\n    "ravy": { "type": "http", "url": "${mcpUrl.value}" }\n  }\n}` },
      { text: 'Start the server from the file\'s code lens and accept the sign-in prompt.' },
    ],
  },
  {
    key: 'gemini',
    label: 'Gemini CLI',
    steps: [
      { text: 'Add to ~/.gemini/settings.json:', code: `{\n  "mcpServers": {\n    "ravy": { "httpUrl": "${mcpUrl.value}" }\n  }\n}` },
      { text: 'Start gemini and authenticate:', code: '/mcp auth ravy' },
    ],
  },
  {
    key: 'other',
    label: 'Other',
    note: 'Any client that speaks Streamable HTTP with OAuth just needs the URL. For a client that only runs local (stdio) servers, bridge it with mcp-remote — it handles the sign-in.',
    steps: [
      { text: 'Server URL:', code: mcpUrl.value },
      { text: 'stdio bridge, as a JSON server entry:', code: `{\n  "command": "npx",\n  "args": ["-y", "mcp-remote", "${mcpUrl.value}"]\n}` },
    ],
  },
])

const selected = ref('claude')
const guide = computed(() => guides.value.find(g => g.key === selected.value) ?? guides.value[0]!)

const copiedKey = ref('')
async function copy(text: string, key: string) {
  try {
    await navigator.clipboard.writeText(text)
    copiedKey.value = key
    setTimeout(() => {
      if (copiedKey.value === key)
        copiedKey.value = ''
    }, 1500)
  }
  catch {
    // Clipboard blocked — the text is selectable anyway.
  }
}

const clients = ref<ConnectedClient[]>([])
const loading = ref(true)
const message = ref('')
const revoking = ref(false)

async function refresh() {
  loading.value = true
  try {
    clients.value = (await authedFetch<{ clients: ConnectedClient[] }>('/api/oauth/connections')).clients
  }
  catch (e: unknown) {
    message.value = e instanceof Error ? e.message : 'Failed to load connections'
  }
  finally {
    loading.value = false
  }
}

async function disconnectAll() {
  // eslint-disable-next-line no-alert
  if (!window.confirm('Disconnect every connected client? Each will have to sign in again.'))
    return
  revoking.value = true
  try {
    const res = await authedFetch<{ revoked: number }>('/api/oauth/connections', { method: 'DELETE' })
    message.value = `Revoked ${res.revoked} token(s).`
    await refresh()
  }
  finally {
    revoking.value = false
  }
}

onMounted(() => {
  mcpUrl.value = `${window.location.origin}/mcp`
  refresh()
})
</script>

<template>
  <div class="space-y-6">
    <section class="border border-line p-6 bg-panel space-y-4">
      <div>
        <h2 class="text-lg font-semibold text-fg">
          Blog MCP server
        </h2>
        <p class="mt-1 text-sm text-fg-muted">
          Lets an AI assistant read, write and publish posts on this blog as you. It can list and read posts (drafts included),
          create and edit them, upload images, and publish or unpublish. It cannot delete — that stays in
          <NuxtLink to="/studio" class="underline hover:no-underline">
            Studio
          </NuxtLink>.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <code class="flex-1 min-w-0 truncate bg-panel-raised px-3 py-2 text-sm">{{ mcpUrl }}</code>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 border border-line-strong px-3 py-2 text-sm hover:cursor-pointer"
          @click="copy(mcpUrl, 'url')"
        >
          <Icon :name="copiedKey === 'url' ? 'mdi:check' : 'mdi:content-copy'" size="16" />
          {{ copiedKey === 'url' ? 'Copied' : 'Copy' }}
        </button>
      </div>
      <p class="text-xs text-slate-500">
        No API key to paste: every client signs in through this site with your Google account, and access follows your Studio grant.
      </p>
    </section>

    <section class="border border-line p-6 bg-panel">
      <h3 class="text-sm font-medium text-fg mb-3">
        Connect a client
      </h3>
      <div class="flex flex-wrap gap-2 mb-5" role="tablist">
        <button
          v-for="g in guides"
          :key="g.key"
          type="button"
          role="tab"
          :aria-selected="selected === g.key"
          class="border px-3 py-1 text-sm hover:cursor-pointer transition-colors"
          :class="selected === g.key
            ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
            : 'border-line-strong text-fg-muted hover:border-slate-500'"
          @click="selected = g.key"
        >
          {{ g.label }}
        </button>
      </div>

      <p v-if="guide.note" class="mb-4 text-sm text-fg-muted">
        {{ guide.note }}
      </p>

      <ol class="space-y-4">
        <li v-for="(step, i) in guide.steps" :key="`${guide.key}-${i}`" class="flex gap-3">
          <span class="flex-none w-6 h-6 bg-panel-raised text-xs font-mono flex items-center justify-center text-fg-muted">{{ i + 1 }}</span>
          <div class="min-w-0 flex-1 space-y-2">
            <p class="text-sm text-fg-muted">
              {{ step.text }}
            </p>
            <div v-if="step.code" class="relative">
              <pre class="overflow-x-auto bg-panel-raised p-3 pr-12 text-xs"><code>{{ step.code }}</code></pre>
              <button
                type="button"
                class="absolute top-2 right-2 p-1 text-slate-500 hover:text-fg hover:cursor-pointer"
                :aria-label="`Copy step ${i + 1}`"
                @click="copy(step.code, `${guide.key}-${i}`)"
              >
                <Icon :name="copiedKey === `${guide.key}-${i}` ? 'mdi:check' : 'mdi:content-copy'" size="16" />
              </button>
            </div>
          </div>
        </li>
      </ol>
    </section>

    <section class="border border-line p-6 bg-panel space-y-3">
      <h3 class="text-sm font-medium text-fg">
        Connected clients
      </h3>
      <p v-if="loading" class="text-sm text-slate-500">
        Loading…
      </p>
      <p v-else-if="!clients.length" class="text-sm text-slate-500">
        Nothing connected yet.
      </p>
      <ul v-else class="divide-y divide-line text-sm">
        <li v-for="c in clients" :key="c.clientId" class="flex justify-between gap-4 py-2">
          <span class="truncate">{{ c.clientName }}</span>
          <span class="flex-none font-mono text-xs text-slate-500">signed in {{ c.lastIssuedAt.slice(0, 16).replace('T', ' ') }} UTC</span>
        </li>
      </ul>
      <button
        v-if="clients.length"
        type="button"
        :disabled="revoking"
        class="border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 px-3 py-1.5 text-sm hover:cursor-pointer disabled:opacity-50"
        @click="disconnectAll"
      >
        Disconnect all
      </button>
      <p v-if="message" class="text-sm text-slate-500">
        {{ message }}
      </p>
    </section>
  </div>
</template>
