var webpack = require('webpack');

var commonsPlugin = new webpack.optimize.CommonsChunkPlugin('common.js');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
  // webpack options
  entry: {
    // the main angular module
    'rxvision': './run/rx.js',
    'viz': './run/viz.js',
    'kefirvision': './run/kefir.js',
    'playground': './run/playground.js',
    'tests': './run/tests.js',
  },

  node: {
    fs: 'empty',
    net: 'empty',
  },

  output: {
    path: "./build",
    // TODO(jared): think about using hashes to make caching a thing
    filename: "[name].js",
  },

  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader?optional=runtime' },
      { test: /\.json$/, loader: 'json' },

      {
          test: /\.css$/,
          loader: ExtractTextPlugin.extract("style-loader", "css-loader")
      },
      {
          test: /\.less$/,
          loader: ExtractTextPlugin.extract("style-loader", "css-loader!less-loader")
      }
    ],
  },

  plugins: [commonsPlugin],
  devtool: 'eval',
  colors: true,

  plugins: [
      new ExtractTextPlugin("[name].css")
  ],
}

