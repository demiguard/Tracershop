import { resolve } from 'path';
import webpack from "webpack";

import { JAVASCRIPT_VERSION } from './src/lib/shared_constants.js';

export default {
  entry: "./src/index.js",
  output: {
    path: resolve("./static/frontend"),
    filename: `[name]_${JAVASCRIPT_VERSION}.js`,
  },
  resolve : {
    extensions : ['.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.js|.jsx$/,
        exclude: /node_modules/,
        use: "babel-loader",
        resolve : {
          fullySpecified : false,
        },
      },
      {
        test: /\.css$/i,
        exclude: /node_modules/,
        use: [ 'style-loader', 'css-loader']
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: 'file-loader',
          },
        ],
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: 'svg-url-loader',
            options: {
              limit: 10000,
            },
          }
        ],
      }
    ],
  },
  optimization: {
    minimize: true,
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV' : JSON.stringify('development')
    }),
  ],
};