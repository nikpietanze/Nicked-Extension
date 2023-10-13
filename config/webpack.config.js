'use strict';

import { merge } from "webpack-merge";
import Dotenv from "dotenv-webpack";

import { Common } from "./webpack.common.js";
import { Paths } from "./paths.js";

export default (_env, argv) =>
    merge(Common, {
        entry: {
            popup: Paths.src + "/views/popup.ts",
            amazon: Paths.src + "/amazon.ts",
            background: Paths.src + "/background.ts",
        },
        devtool: argv.mode === "production" ? false : "source-map",
        plugins: [
            new Dotenv()
        ]
    });
