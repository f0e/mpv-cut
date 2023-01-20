mp.msg = require 'mp.msg'
mp.utils = require "mp.utils"

MAKE_CUTS_SCRIPT_PATH = mp.utils.join_path(mp.get_script_directory(), "make_cuts")

cuts = {}
cut_index = 0

function log(...)
	mp.msg.info(...)
	mp.osd_message(...)
end

function cut_render()
	local cuts_json = mp.utils.format_json(cuts)

	local inpath = mp.get_property("path")
	local indir = mp.utils.split_path(inpath)

	local filename = mp.get_property("filename")

	local args = { "node", MAKE_CUTS_SCRIPT_PATH, indir, filename, cuts_json }

	print("making cut")

	mp.command_native_async({
		name = "subprocess",
		playback_only = false,
		args = args,
	}, print_async_result)

	log("rendered cuts")
end

function cut_key()
	return tostring(cut_index)  -- dumb, mp.utils.format_json only accepts string keys
end

function cut_set_start(start_time)
	if cuts[cut_key()] ~= nil and cuts[cut_key()]['end'] then
		cut_index = cut_index + 1
	end

	if cuts[cut_key()] == nil then
		cuts[cut_key()] = {}
	end

	cuts[cut_key()]['start'] = start_time
	log(string.format("[cut %d] set start time: %s", cut_index + 1, start_time))
end

function cut_set_end(end_time)
	if cuts[cut_key()] == nil then
		log('no start point found')
		return
	end

	cuts[cut_key()]['end'] = end_time
	log(string.format("[cut %d] set end time: %s", cut_index + 1, end_time))
end

mp.add_key_binding('g', "cut_set_start", function() cut_set_start(mp.get_property_number("time-pos")) end)
mp.add_key_binding('h', "cut_set_end", function() cut_set_end(mp.get_property_number("time-pos")) end)

mp.add_key_binding('G', "cut_set_start_sof", function() cut_set_start(0) end)
mp.add_key_binding('H', "cut_set_end_eof", function() cut_set_end(mp.get_property('duration')) end)

mp.add_key_binding('r', "cut_render", cut_render)
