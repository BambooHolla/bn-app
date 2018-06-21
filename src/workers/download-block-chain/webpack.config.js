var path = require('path');

module.exports = {
  mode: 'development',
  entry: './worker-setup.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'foo.bundle.js'
  }
};