const chokidar = require('chokidar')

module.exports = {
    devServer: {
        host: '0.0.0.0',
        hot: true,
        disableHostCheck: true,
        before(app, server) {
            chokidar.watch([
                'kolibri-docs/**/*'
            ]).on('all', function() {
                server.sockWrite(server.sockets, 'content-changed');
            })
        },
    },
    chainWebpack: config => {
        // Markdown Loader
        config.module
            .rule('markdown')
            .test(/\.md$/)
            .use('file-loader')
                .loader('file-loader?name=docs/[name]-[hash:6].[ext]')
                .end()

        config.output.filename('js/[name].[hash:8].js')
        config.output.chunkFilename('js/[name].[hash:8].js')
    },
    publicPath: process.env['IPFS_BUILD'] ? './' : '/',
    css: {
        loaderOptions: {
            css: {
                url: !process.env['IPFS_BUILD'],
            }
        }
    }
};
