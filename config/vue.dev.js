const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  css: {
    loaderOptions: {
      sass: {
        data: `@import "~@/styles/overrides.scss"`,
        implementation: require('sass'),
        fiber: require('fibers'),
      },
    },
  },

  chainWebpack: (config) => {
    ["vue-modules", "vue", "normal-modules", "normal"].forEach((match) => {
      config.module.rule('scss').oneOf(match).use('sass-loader')
        .tap(opt => Object.assign(opt, { data: `@import '~@/styles/overrides.scss';` }))
    })
  },

  devServer: {
    proxy: {
      '/.netlify': {
        target: 'http://localhost:9000',
        pathRewrite: {
          '^/.netlify/functions': ''
        }
      }
    },
  },

  configureWebpack: {
    module: {
      rules: [
        {
          test: /\.(js|ts|tsx)$/,
          loader: 'babel-loader',
        },
      ],
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, '../src/public/index.dev.html'),
        title: 'Playman',
        meta: {
          'viewport': 'width=device-width, initial-scale=1, shrink-to-fit=no',
          'charset': 'utf-8',
        },
      }),
    ],

    resolve: {
      alias: {
        '~': 'node_modules/',
      },
    },
  },

  parallel: true,
  publicPath: '/',
};
