import { resolve } from 'path';
import webpack from "webpack";

import { JAVASCRIPT_VERSION } from './src/lib/shared_constants.js';

import { WebpackManifestPlugin } from 'webpack-manifest-plugin'
import {BundleAnalyzerPlugin} from 'webpack-bundle-analyzer'


export default {
  mode: 'development',
  devtool : 'eval-source-map',
  entry: "./src/index.js",
  output: {
    path: resolve("./static/frontend"),
    publicPath : '/static/',
    filename: `[name]_${JAVASCRIPT_VERSION}.js`,
    chunkFilename: `[name]_${JAVASCRIPT_VERSION}_[contenthash].chunk.js`,
  },
  resolve : {
    extensions : ['.js', '.jsx', '.tsx', '.ts']
  },
  module: {
    rules: [
      {
        test: /\.js|\.jsx|\.ts|\.tsx$/,
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
        type: 'asset/resource',
        generator: {
          filename : 'images/[name].[contenthash][ext]'
        }
      },
      {
        test: /\.svg$/,
        type: 'asset/inline',
        parser:{
          parser: {
            dataUrlCondition: {
              maxSize: 10000,
            }
          }
        }
      }
    ],
  },
  optimization: {
    minimize: true,
    chunkIds : 'natural',
    splitChunks : {
      cacheGroups : {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        }
      }
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV' : JSON.stringify( process.env.NODE_ENV || 'development')
    }),
    //new BundleAnalyzerPlugin(),
    new WebpackManifestPlugin({
      fileName : 'chunk-manifest.json',
      publicPath : '/static/frontend/',
      generate: (seed, files) => {
        const manifest = {};
        files.forEach(file => {
          manifest[file.name] = file.path
        });

        return manifest;
      }
    })
  ],
};