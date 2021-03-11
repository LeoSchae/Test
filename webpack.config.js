const path = require("path");

const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = {
	mode: "production",
	entry: { index: path.resolve(__dirname, "./src/index.ts") },
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
		publicPath: "",
		filename: "[name].js",
		path: path.resolve(__dirname, "dist"),
		environment: {
			arrowFunction: false,
		},
	},
	plugins: [new CopyPlugin({ patterns: [{ from: "public", to: "" }] }), new CleanWebpackPlugin()],
	devServer: {
		inline: true,
		contentBase: "./public",
		port: 8080,
		host: "0.0.0.0",
	},
};
