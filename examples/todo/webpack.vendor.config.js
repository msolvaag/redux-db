var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
var CleanWebpackPlugin = require('clean-webpack-plugin');

const environment = (process.env.NODE_ENV || "development").trim();

console.log(`******** WEBPACK VENDOR ${environment} ********`);

const config = {
    entry: {
        "vendor": [
            "react",
            "react-dom",
            "redux",
            "redux-observable",
            "react-redux",
            "react-router-dom",
            //"redux-db",
            "reselect",

            "rxjs/add/operator/switchMap",
            "rxjs/add/operator/map",
            "rxjs/add/operator/takeUntil",
            "rxjs/add/operator/catch",
            "rxjs/add/observable/of",
            "rxjs/add/observable/merge",
            "rxjs/add/observable/concat",
            "rxjs/observable/dom/ajax",
            "rxjs/BehaviorSubject",

            "tslib"
        ],
        "vendor_style": [
            "bootstrap/dist/css/bootstrap.css",
            "font-awesome/css/font-awesome.css"
        ]
    },

    output: {
        path: path.join(__dirname, 'wwwroot', 'dist'),
        filename: '[name].js',
        chunkFilename: '[id].chunk.js',
        library: '[name]_lib'
    },
    module: {
        rules: [{
                test: /\.(png|jpg|gif|woff|woff2|ttf|svg|eot)$/,
                loader: 'file-loader?name=assets/[name]-[hash:6].[ext]'
            },
            {
                test: /\.css$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: 'css-loader'
                })
            }
        ]
    },

    resolve: {
        extensions: ['.ts', '.js', '.json', '.css', '.scss', '.html']
    },

    devtool: 'simple-source-map',

    plugins: [
        // Extract css to seperate bundles
        new ExtractTextPlugin('[name].css'),

        new webpack.DllPlugin({
            // The path to the manifest file which maps between
            // modules included in a bundle and the internal IDs
            // within that bundle
            path: 'wwwroot/dist/[name]-manifest.json',
            // The name of the global variable which the library's
            // require function has been assigned to. This must match the
            // output.library option above
            name: '[name]_lib'
        })
    ]
};

if (environment === "production") {
    config.mode = "production";
    config.plugins.unshift(
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('production')
            }
        }),

        // Prepare for production build
        new CleanWebpackPlugin(['./wwwroot/dist', './wwwroot/assets'])
    );

    config.plugins = config.plugins.concat([
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            },
            output: {
                comments: false
            },
            sourceMap: true
        }),
        new OptimizeCssAssetsPlugin()
    ]);
} else {
    config.mode = "development";
    config.devtool = 'simple-source-map';
    config.module.rules.push({
        enforce: "pre",
        test: /\.js$/,
        loader: "source-map-loader"
    });
}

module.exports = config;