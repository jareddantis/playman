const path = require('path');
const { DefinePlugin, HashedModuleIdsPlugin } = require('webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCSSExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  css: {
    loaderOptions: {
      sass: {
        prependData: `@import "~@/styles/overrides.sass"`,
      },
    },
  },

  chainWebpack: (config) => {
    ["vue-modules", "vue", "normal-modules", "normal"].forEach((match) => {
      config.module.rule('scss').oneOf(match).use('sass-loader')
        .tap((opt) => Object.assign(opt, { prependData: `@import '~@/styles/overrides.sass';` }))
    })
  },

  configureWebpack: {
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
            test: /(c|s[ac])ss/,
            chunks: 'all',
            enforce: true,
          },
        },
      },
    },

    module: {
      rules: [
        {
          test: /\.(js|ts[x]?)$/,
          exclude: /\.worker\.ts$/,
          loader: 'babel-loader',
        },
        {
          test: /\.css$/,
          exclude: /vue-virtual-scroller/,
          use: [
            MiniCSSExtractPlugin.loader,
            'css-loader',
            'postcss-loader',
          ],
        },
      ],
    },

    plugins: [
      new HashedModuleIdsPlugin(),

      // Build date
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
          CALLBACK_URI: '"https://playman.dantis.me/callback"',
          SPID: '"a2d37a37164c48e48d3693491c20e7ae"',
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
          /playlist/,
        ],
        defaultAttribute: 'defer',
      }),

      // Webpack bundle stats
      new BundleAnalyzerPlugin({
        analyzerMode: 'disabled',
        openAnalyzer: false,
        generateStatsFile: true
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
  pwa: {
    workboxPluginMode: 'InjectManifest',
    workboxOptions: {
      swSrc: 'src/public/service-worker.js',
      exclude: [
        /\.map$/,
        /manifest\.json$/,
        /stats\.json$/
      ],
    },
  },
};
