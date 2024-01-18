import path from "path";
import fs from "fs-extra";

// https://stackoverflow.com/a/45242825
export const isSubdirectory = (parent: string, child: string) => {
	const relative = path.relative(parent, child);
	return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
};

export const ffmpegEscapeFilepath = (path: string) =>
	path.replaceAll("\\", "\\\\").replaceAll("'", "'\\''");

export const isDir = (path: string) => fs.statSync(path).isDirectory();
