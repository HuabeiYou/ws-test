module.exports = {
  apps: [
    {
      name: 'wss',
      script: 'npm',
      args: 'run dev',
      max_memory_restart: '2048M',
    },
  ],
}
