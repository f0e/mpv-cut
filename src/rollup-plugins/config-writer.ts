import fs from "fs-extra";
import { Plugin } from "rollup";
import defaultOptions from "../shared/default-options";

const configPath = "dist/script-opts/mpv-cut.conf";

export default {
	name: "config writer",
	buildStart: async () => {
		await fs.outputFile(
			configPath,
			Object.entries(defaultOptions)
				.map(([key, value]) => `${key}=${value}`)
				.join("\n"),
		);
	},
} as Plugin;
