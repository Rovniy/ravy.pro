<script setup lang="ts">
// Pointer from the studio to the full connection guide, which lives on
// /account → MCP alongside the connected-client list.
</script>

<template>
  <NuxtLink
    to="/account?tab=mcp"
    class="mb-8 flex items-center gap-2 border border-line px-4 py-3 text-sm hover:border-slate-400 dark:hover:border-slate-600"
  >
    <Icon name="mdi:connection" size="16" />
    <span><strong>Write with Claude, Codex or ChatGPT</strong> — connect the blog MCP server</span>
    <Icon name="mdi:arrow-right" size="16" class="ml-auto" />
  </NuxtLink>
</template>
