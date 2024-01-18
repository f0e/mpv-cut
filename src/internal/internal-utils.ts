export function log(message: string) {
	print(message);
	mp.osd_message(message);
}
