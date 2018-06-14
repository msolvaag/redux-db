const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');

const environment = (process.env.NODE_ENV || "development").trim();

console.log(`******** WEBPACK ${environment} ********`);

const config = {
    entry: {
        client: [
            './src/index.tsx'
        ],
        client_style: [
            './style/index.scss'
        ]
    },
    output: {
        filename: '[name].js',
        path: path.join(__dirname, 'wwwroot', 'dist'),
        publicPath: '/dist/'
    },
    devServer: {
        contentBase: './wwwroot',
        historyApiFallback: true
    },
    module: {
        rules: [{
                test: /\.tsx?$/,
                loader: 'ts-loader'
            },
            {
                test: /\.scss$/,
                exclude: /node_modules/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: 'css-loader!sass-loader'
                })
            }
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js", ".scss", ".jsx"],
        modules: [path.resolve(__dirname, 'client'), 'node_modules']
    },
    watch: false,
    plugins: [
        // Extract css to seperate bundles
        new ExtractTextPlugin('[name].css'),

        // Reference vendor libraries
        new webpack.DllReferencePlugin({
            context: '.',
            manifest: require('./wwwroot/dist/vendor-manifest.json')
        }),
    ]
};

if (environment === "production") {
    config.mode = "production";
    config.plugins = config.plugins.concat([
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('production')
            }
        }),
        new webpack.optimize.UglifyJsPlugin(),
        new OptimizeCssAssetsPlugin()
    ])
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