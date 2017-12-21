const path = require('path');

module.exports = {
  entry: path.resolve(__dirname, 'widget.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'widget.bundle.js',
    library: 'widget',
    libraryTarget: 'umd',
  }
};
