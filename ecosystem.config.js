module.exports = {
  apps: [
    {
      name: 'wss',
      script: 'npm',
      args: 'run dev',
      max_memory_restart: '3072M',
    },
  ],
}
