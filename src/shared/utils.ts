export function toHMS(secs: number) {
	const hours = Math.floor(secs / 3600);
	const minutes = Math.floor((secs % 3600) / 60);
	const remainingSeconds = (secs % 3600) % 60;

	const str: string[] = [];
	if (hours > 0) str.push(`${hours}h`);
	if (minutes > 0) str.push(`${minutes}m`);
	if (remainingSeconds > 0) str.push(`${remainingSeconds.toFixed(1)}s`);

	return str.length === 0 ? "0" : str.join("");
}
