import defaultOptions from "../shared/default-options";
import { Cut, Options, SubprocessRes } from "../shared/types";
import { toHMS } from "../shared/utils";
import { log } from "./internal-utils";

const MAKE_CUTS_SCRIPT_PATH = mp.utils.join_path(
	// @ts-ignore (it exists)
	mp.get_script_directory(),
	"helper",
);

const options = defaultOptions;

// biome-ignore lint/suspicious/noExplicitAny: mpv needs it Bro
mp.options.read_options(options as any, "mpv-cut");

let cuts: Cut[] = [];
let cutIndex = 0;

function getCurrentCut() {
	if (cutIndex >= cuts.length) return null;
	return cuts[cutIndex];
}

function addNewCut(start: number) {
	const cut: Cut = {
		start,
	};

	cuts.push(cut);
	cutIndex = cuts.length - 1;

	return cut;
}

function renderCuts() {
	const validCuts = cuts.filter((cut) => cut.end);

	if (validCuts.length === 0) {
		log("No cuts to render");
		return;
	}

	const inpath = mp.get_property("path");
	const filename = mp.get_property("filename");
	if (!inpath || !filename) return;

	const inpathSplit = mp.utils.split_path(inpath);
	const indir = inpathSplit[0]; // i'd just do const [indir] = ... but that adds polyfill bloat to the bundled js and i cba fixing that

	log("Rendering...");

	const args = [
		"node",
		MAKE_CUTS_SCRIPT_PATH,
		indir,
		JSON.stringify(options),
		filename,
		JSON.stringify(validCuts),
	];

	const res = mp.command_native({
		name: "subprocess",
		playback_only: false,
		args,
	}) as SubprocessRes;

	if (res && res.status === 0)
		log(`Rendered ${validCuts.length} cut${validCuts.length === 1 ? "" : "s"}`);
	else log("Failed to render cuts");
}

function setCutStart(startTime: number) {
	let cut = getCurrentCut();

	if (!cut || cut?.end) cut = addNewCut(startTime);
	else cut.start = startTime;

	log(`[cut ${cutIndex + 1}] Set start time: ${toHMS(startTime)}`);
}

function setCutEnd(endTime: number) {
	const cut = getCurrentCut();

	if (!cut) {
		log("No start point found");
		return;
	}

	cut.end = endTime;
	log(`[cut ${cutIndex + 1}] Set end time: ${toHMS(endTime)}`);
}

function onFileChange() {
	cuts = [];
	cutIndex = 0;
}

function setCutTime(pos: "start" | "end") {
	const time = mp.get_property_number("time-pos");
	if (!time) return;

	switch (pos) {
		case "start":
			return setCutStart(time);
		case "end":
			return setCutEnd(time);
	}
}

mp.add_key_binding("g", "cut_set_start", () => setCutTime("start"));
mp.add_key_binding("h", "cut_set_end", () => setCutTime("end"));
mp.add_key_binding("G", "cut_set_start_sof", () => setCutStart(0));
mp.add_key_binding("H", "cut_set_end_eof", () => {
	const duration = mp.get_property("duration");
	if (duration) setCutEnd(parseFloat(duration));
});

mp.add_key_binding("r", "cut_render", renderCuts);

mp.register_event("end-file", onFileChange);

print("mpv-cut loaded");
