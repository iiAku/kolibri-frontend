const chokidar = require('chokidar')

module.exports = {
    devServer: {
        host: '0.0.0.0',
        hot: true,
        disableHostCheck: true,
        before(app, server) {
            chokidar.watch([
                '../documentation/**/*' // watch all my laravel view templates
            ]).on('all', function() {
                server.sockWrite(server.sockets, 'content-changed');
            })
        },
    },
    chainWebpack: config => {
        // GraphQL Loader
        config.module
            .rule('markdown')
            .test(/\.md$/)
            .use('file-loader')
                .loader('file-loader')
                .end()
    }
};
