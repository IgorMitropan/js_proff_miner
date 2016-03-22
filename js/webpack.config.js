'use strict';
let path = require('path');
let webpack = require('webpack');
module.exports = {
    entry: "./Main.js",
    output: {
        path: '../public/',
        publicPath: '../public/',
        filename: "minesweeper.js"
    },
    devtool: "source-map",
    module: {
        loaders: [{
            test: /\.js?$/,
            exclude: /(node_modules|bower_components)/,

            loader: 'babel',
            query: {
                presets: ['es2015'],
                plugins: ['transform-es2015-modules-commonjs']
            }
        }]
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        })
    ]

};
