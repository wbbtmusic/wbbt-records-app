module.exports = {
    apps: [
        {
            name: 'wbbt-records',
            script: 'npm',
            args: 'run serve',
            env: {
                NODE_ENV: 'production',
                PORT: 3030
            },
        },
    ],
};
