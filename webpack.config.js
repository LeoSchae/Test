const path = require("path");

const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = {
	mode: "production",
	entry: path.resolve(__dirname, "./src/index.ts"),
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: "ts-loader",
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: [".tsx", ".ts", ".js"],
	},
	output: {
		publicPath: "http://192.168.0.179:8080/",
		filename: "bundle.[hash].js",
		path: path.resolve(__dirname, "dist"),
	},
	plugins: [
		new CopyPlugin({ patterns: [{ from: "public", to: "dist" }] }),
		new CleanWebpackPlugin(),
		new HtmlWebpackPlugin({
			template: path.resolve(__dirname, "./src/templates/index.html"),
		}),
	],
	devServer: {
		inline: true,
		contentBase: "./public",
		port: 8080,
		host: "0.0.0.0",
	},
};
