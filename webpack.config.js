const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');
const slsw = require('serverless-webpack');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  mode: slsw.lib.webpack.isLocal ? 'development' : 'production',
  entry: slsw.lib.entries,
  devtool: slsw.lib.webpack.isLocal ? 'eval-cheap-module-source-map' : 'source-map',
  externalsPresets: { node: true }, // in order to ignore built-in modules like path, fs, etc.
  externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
  resolve: {
    extensions: ['.js', '.vue', '.json', '.less'],
    alias: {
      Config: path.resolve(__dirname, './config'),
      Database: path.resolve(__dirname, './src/database'),
      Errors: path.resolve(__dirname, './src/errors'),
      Graphql: path.resolve(__dirname, './src/graphql'),
      Handler: path.resolve(__dirname, './src/handler'),
      Repositories: path.resolve(__dirname, './src/repositories'),
      Services: path.resolve(__dirname, './src/services'),
      Utils: path.resolve(__dirname, './src/utils'),
    },
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        'src/database/migrations/**', // copy database migrations files
      ],
    }),
  ],
};
