import { defineConfig } from "rollup";

import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import cleanup from "rollup-plugin-cleanup";
import configWriter from "./src/rollup-plugins/config-writer";

export default defineConfig([
	{
		input: "src/internal/main.ts",
		output: {
			file: "dist/scripts/mpv-cut/main.js",
			format: "cjs",
			banner: "/* mpv-cut - https://github.com/f0e/mpv-cut */",
		},
		plugins: [
			typescript(),
			cleanup({
				comments: "none",
				extensions: ["js", "ts"],
			}),
			configWriter,
		],
	},
	{
		input: "src/external/helper.ts",
		output: {
			file: "dist/scripts/mpv-cut/helper.js",
			format: "cjs",
			banner: "/* mpv-cut - https://github.com/f0e/mpv-cut */",
		},
		plugins: [
			commonjs(),
			typescript(),
			nodeResolve(),
			terser({
				format: {
					comments: (node, comment) => {
						const text = comment.value;
						const type = comment.type;
						if (type === "comment2") {
							// multiline comment
							return text === " mpv-cut - https://github.com/f0e/mpv-cut ";
						}
						return false;
					},
				},
			}),
		],
	},
]);
