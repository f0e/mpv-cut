export interface SubprocessRes {
	error_string: string;
	killed_by_us: boolean;
	status: number;
}

export interface Options {
	output_dir: string;
	multi_cut_mode: "separate" | "merge";
}

export interface Cut {
	start: number;
	end?: number;
}
