const fs = require('fs');

module.exports = {
  devServer: {
    compress: true,
    // http2: true,
    // https: {
    //   key: fs.readFileSync('./ssl/localhost.key'),
    //   cert: fs.readFileSync('./ssl/localhost.crt'),
    //   ca: fs.readFileSync('./ssl/ca.pem'),
    // },
    proxy: {
      '/.netlify': {
        target: 'http://localhost:9000',
        pathRewrite: {
          '^/.netlify/functions': ''
        }
      }
    }
  },
};
