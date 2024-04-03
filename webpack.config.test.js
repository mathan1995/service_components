const webpack = require('./webpack.config');

module.exports = {
  ...webpack,
  devtool: 'eval-source-map', // in order to run nyc with webpack
};
