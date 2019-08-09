const path = require('path');
const { DefinePlugin, HashedModuleIdsPlugin } = require('webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCSSExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const StyleExtHtmlWebpackPlugin = require('style-ext-html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  configureWebpack: {
    devtool: '#cheap-source-map',

    output: {
      path: path.resolve(__dirname, '../dist'),
      filename: '[name].[contenthash:8].js',
    },

    optimization: {
      minimizer: [
        new OptimizeCSSPlugin(),
        new TerserPlugin({ parallel: true }),
      ],
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: Infinity,
        minSize: 0,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            chunks: 'all',
            enforce: true,
            name(module) {
              // from https://hackernoon.com/the-100-correct-way-to-split-your-chunks-with-webpack-f8a9df5b7758
              const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
              return `npm.${packageName.replace('@', '')}`;
            },
          },
          styles: {
            name: 'styles',
            test: /\.(css|s[a|c]ss)$/,
            chunks: 'all',
            enforce: true,
          },
        },
      },
    },

    module: {
      rules: [
        {
          test: /\.(js|ts|tsx)$/,
          loader: 'babel-loader',
        },
        {
          test: /\.css$/,
          exclude: /vue-virtual-scroller/,
          use: [
            MiniCSSExtractPlugin.loader,
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                plugins: [
                  require('autoprefixer')(),
                  require('cssnano')({
                    preset: ['default', {
                      discardComments: {
                        removeAll: true,
                      },
                    }],
                  }),
                ]
              }
            }
          ]
        }
      ],
    },

    plugins: [
      // Build date in app
      new DefinePlugin({
        'process.env': {
          BUILD_DATE: (() => {
            const now = new Date();
            const year = now.getFullYear();
            let month = now.getMonth() + 1;
            let day = now.getDate();
            if (month < 10) { month = '0' + month }
            if (day < 10) { day = '0' + day }
            return year.toString() + month + day
          })(),
        },
      }),

      // Generate index.html
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: path.resolve(__dirname, '../src/public/index.prd.html'),
        title: 'Playman',
        meta: {
          'viewport': 'width=device-width, initial-scale=1, shrink-to-fit=no',
          'charset': 'utf-8',

          // SEO
          'author': 'Jared Dantis',
          'description': 'Manage your Spotify playlists in a jiffy!',
          'application-name': 'Playman',

          // Twitter card
          'twitter:card': 'summary',
          'twitter:site': '@jareddantis',
          'twitter:title': 'Playman',
          'twitter:description': 'Manage your Spotify playlists in a jiffy!',
          'twitter:image': '/favicon/android-chrome-512x512.png',

          // PWA
          'msapplication-TileColor': '#121738',
          'msapplication-config': '/favicon/browserconfig.xml',
          'theme-color': '#101322',
          'apple-mobile-web-app-title': 'Playman',
          'apple-mobile-web-app-capable': 'yes',
          'apple-mobile-web-app-status-bar-style': 'default',
        },
      }),

      // JavaScript loading
      new ScriptExtHtmlWebpackPlugin({
        sync: [ /vue/ ],
        async: [
          /home/,
        ],
        defaultAttribute: 'defer',
      }),

      // Internalized CSS
      new StyleExtHtmlWebpackPlugin(),

      new BundleAnalyzerPlugin({
        analyzerMode: 'disabled',
        openAnalyzer: false,
        generateStatsFile: true
      }),
      new HashedModuleIdsPlugin(),
    ],

    resolve: {
      alias: {
        '~': 'node_modules/',
      },
    },
  },

  parallel: true,
  productionSourceMap: true,
  publicPath: '/',

  pwa: {
    workboxPluginMode: 'InjectManifest',
    workboxOptions: {
      swSrc: 'src/public/sw.js',
      exclude: [
        /\.map$/,
        /manifest\.json$/,
        /stats\.json$/
      ],
    },
  },
};
