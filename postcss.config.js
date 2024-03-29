const path = require('path');
const glob = require('glob-all');

module.exports = (ctx) => ({
  plugins: {
    'autoprefixer': true,
    '@fullhuman/postcss-purgecss': ctx.env === 'production' ? {
      content: glob.sync([
        path.join(__dirname, './src/**/*.vue'),
        path.join(__dirname, './node_modules/vuetify/src/**/*.ts'),
        path.join(__dirname, './node_modules/vue-virtual-scroller/src/**/*.vue'),
      ]),
      whitelist: [
        'body', 'html',
      ],
      whitelistPatterns: [
        /transition$/,
        /^vue-recycle-scroller/,
        /-(leave|enter|appear)(|-(to|from|active))$/,
        /^router-link(|-exact)-active$/,
      ],
    } : false,
    'cssnano': ctx.env === 'production' ? {
      preset: [
        'default',
        {
          discardComments: {
            removeAll: true,
          },
        }
      ],
    } : false,
  }
});
