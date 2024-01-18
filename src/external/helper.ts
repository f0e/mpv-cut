import path from "path";
import { execa } from "execa";
import fs from "fs-extra";
import { Cut, Options } from "../shared/types";
import { toHMS } from "../shared/utils";
import { ffmpegEscapeFilepath, isDir, isSubdirectory } from "./external-utils";

async function transferTimestamps(inPath: string, outPath: string, offset = 0) {
	try {
		const { atime, mtime } = fs.statSync(inPath);

		fs.utimesSync(
			outPath,
			atime.getTime() / 1000 + offset,
			mtime.getTime() / 1000 + offset,
		);
	} catch (err) {
		console.error("Failed to set output file modified time", err);
	}
}

async function ffmpeg(args: string[]) {
	const cmd = "ffmpeg";
	const baseArgs = [
		// hide output
		"-nostdin",
		"-loglevel",
		"error",
		// overwrite existing files
		"-y",
	];

	const fullArgs = baseArgs.concat(args);

	console.log(`${cmd} ${fullArgs.join(" ")}`);

	await execa(cmd, fullArgs, { stdio: "inherit" });
}

async function renderCut(
	inpath: string,
	outpath: string,
	start: number,
	duration: number,
) {
	const args = [
		// seek to start before loading file (faster) https://trac.ffmpeg.org/wiki/Seeking#Inputseeking
		"-ss",
		start.toString(),
		"-t",
		duration.toString(),
		"-i",
		inpath,
		// don't re-encode
		"-c",
		"copy",
		// shift timestamps so they start at 0
		"-avoid_negative_ts",
		"make_zero",
		outpath,
	];

	await ffmpeg(args);

	await transferTimestamps(inpath, outpath);
}

async function mergeCuts(
	tempPath: string,
	filepaths: string[],
	outpath: string,
) {
	// i hate that you have to do a separate command and render each cut separately first, i tried using
	// filter_complex for merging with multiple inputs but it wouldn't let me. todo: look into this further

	const mergeFile = path.join(tempPath, "merging.txt");
	await fs.promises.writeFile(
		mergeFile,
		filepaths.map((path) => `file '${ffmpegEscapeFilepath(path)}`).join("\n"),
	);

	await ffmpeg([
		"-f",
		"concat",
		"-safe",
		"0",
		"-i",
		mergeFile,
		"-c",
		"copy",
		outpath,
	]);

	await fs.promises.unlink(mergeFile);

	for (const path of filepaths) {
		await fs.promises.unlink(path);
	}
}

async function main() {
	const argv = process.argv.slice(2);
	const [indir, optionsStr, filename, cutsStr] = argv;

	if (!isDir(indir)) {
		console.log("Input directory is invalid");
		return false;
	}

	const options = JSON.parse(optionsStr);
	const outdir = path.resolve(indir, options.output_dir);

	if (!isDir(outdir)) {
		if (!isSubdirectory(indir, outdir)) {
			console.log("Output directory is invalid");
			return false;
		}

		// the output directory is a child of the input directory, can assume it's safe to create
		await fs.promises.mkdir(outdir, { recursive: true });
	}

	const cutsMap = JSON.parse(cutsStr);
	const cuts = cutsMap.sort((a: Cut, b: Cut) => a.start - b.start);

	const { name: filename_noext, ext } = path.parse(filename);

	const outpaths: string[] = [];

	for (const [i, cut] of cuts.entries()) {
		if (!cut.end) continue;

		const duration = cut.end - cut.start;

		const cutName = `(cut${
			cuts.length === 1 ? "" : i + 1
		}) ${filename_noext} (${toHMS(cut.start)} - ${toHMS(cut.end)})${ext}`;

		const inpath = path.join(indir, filename);
		const outpath = path.join(outdir, cutName);

		const progress = `(${i + 1}/${cuts.length})`;

		console.log(`${progress} ${inpath} -> ${outpath}`);

		await renderCut(inpath, outpath, cut.start, duration);
		outpaths.push(outpath);
	}

	if (outpaths.length > 1 && options.multi_cut_mode === "merge") {
		const cutName = `(${outpaths.length} merged cuts) ${filename}`;
		const outpath = path.join(outdir, cutName);

		await mergeCuts(indir, outpaths, outpath);
	}

	return console.log("Done.\n");
}

main();
