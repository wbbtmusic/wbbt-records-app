module.exports = {
    apps: [
        {
            name: 'wbbt-server',
            script: 'server/index-sqlite.ts',
            interpreter: 'node',
            interpreter_args: '--import tsx', // Use tsx loader for TS files
            env: {
                NODE_ENV: 'production',
                PORT: 3001
            }
        }
    ]
};
