const path = require('path');

module.exports = {
  entry: path.resolve(__dirname, 'src/widgetjs.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'widgetjs.bundle.js',
    library: 'widgetjs',
    libraryTarget: 'umd',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader'
      }
    ]
  },
};
