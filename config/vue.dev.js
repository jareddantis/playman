const fs = require('fs');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  devServer: {
    compress: true,
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
        template: path.resolve(__dirname, '../src/index.dev.html'),
        title: 'Setlist',
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
