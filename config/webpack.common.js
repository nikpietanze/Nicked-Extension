'use strict';

import CopyWebpackPlugin from 'copy-webpack-plugin';
import { Paths } from './paths.js';

const IMAGE_TYPES = /\.(png|jpe?g|gif|svg)$/i;

export const Common = {
    output: {
        path: Paths.dist,
        filename: '[name].js',
    },
    stats: {
        all: false,
        errors: true,
        builtAt: true,
        assets: true,
        excludeAssets: [IMAGE_TYPES],
    },
    module: {
        rules: [
            {
                test: IMAGE_TYPES,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            outputPath: 'images',
                            name: '[name].[ext]',
                        },
                    },
                ],
            },
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: '**/*',
                    context: 'public',
                },
            ],
        }),
    ],
};
