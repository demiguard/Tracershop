import { resolve } from 'path';
import webpack from "webpack";

import { JAVASCRIPT_VERSION } from './src/lib/shared_constants.js';

import { WebpackManifestPlugin } from 'webpack-manifest-plugin'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
import MiniCssExtractPlugin from 'mini-css-extract-plugin';


export default (env, argv) => {
  const isProd = argv.mode === 'production'

  return {
    mode: argv.mode || 'development',
    devtool : isProd ? 'source-map' : 'eval-source-map',
    entry: "./src/index.js",
    output: {
      path: resolve("./static/frontend/js/"),
      publicPath : '/static/frontend/js/',
      filename: `[name]_${JAVASCRIPT_VERSION}.js`,
      chunkFilename: `chunk_${JAVASCRIPT_VERSION}_[name]_[contenthash].chunk.js`,
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
          use: [ MiniCssExtractPlugin.loader, 'css-loader']
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
      new MiniCssExtractPlugin({
        filename: `../../css/[name]_${JAVASCRIPT_VERSION}.css`,
        chunkFilename: `../../css/[id]_${JAVASCRIPT_VERSION}_[contenthash].css`,
      }),

      new webpack.DefinePlugin({
        'process.env.NODE_ENV' : JSON.stringify( isProd ? 'production' : 'development')
      }),
      //new BundleAnalyzerPlugin(),
      new WebpackManifestPlugin({
        fileName : 'chunk-manifest.json',
        publicPath : '/static/frontend/js/',
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
}