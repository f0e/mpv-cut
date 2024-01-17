const fs = require('fs');
const child_process = require('child_process');
const path = require('path');

const red = '\x1b[31m';
const plain = '\x1b[0m';
const green = '\x1b[32m';
const purple = '\x1b[34m';

// https://stackoverflow.com/a/45242825
const isSubdirectory = (parent, child) => {
  const relative = path.relative(parent, child);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
};

function quit(s) {
  console.log('' + red + s + ', quitting.' + plain + '\n');
  return process.exit(1);
}

function isDir(s) {
  try {
    return fs.statSync(s).isDirectory();
  } catch (e) {
    return false;
  }
}

function toHMS(secs) {
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const remainingSeconds = ((secs % 3600) % 60).toFixed(1);

  const str = [];
  if (hours > 0) str.push(`${hours}h`);
  if (minutes > 0) str.push(`${minutes}m`);
  if (remainingSeconds > 0) str.push(`${remainingSeconds}s`);

  return str.length == 0 ? '0' : str.join('');
}

async function transferTimestamps(inPath, outPath, offset = 0) {
  try {
    const { atime, mtime } = fs.statSync(inPath);

    fs.utimesSync(
      outPath,
      atime.getTime() / 1000 + offset,
      mtime.getTime() / 1000 + offset
    );
  } catch (err) {
    console.error('Failed to set output file modified time', err);
  }
}

async function main() {
  const argv = process.argv.slice(2);

  const [indir, outdir_raw, filename, cutsStr] = argv;

  if (!isDir(indir)) quit('Input directory is invalid');

  const outdir = path.resolve(indir, outdir_raw);

  if (!isDir(outdir)) {
    if (!isSubdirectory(indir, outdir)) quit('Output directory is invalid');

    // the output directory is a child of the input directory, can assume it's safe to create
    await fs.promises.mkdir(outdir, { recursive: true });
  }

  const cutsMap = JSON.parse(cutsStr);
  const cuts = Object.values(cutsMap).sort((a, b) => a.start - b.start);

  for (const [i, cut] of cuts.entries()) {
    if (!('end' in cut)) continue;

    const { name: filename_noext, ext: ext } = path.parse(filename);
    const duration = parseFloat(cut.end) - parseFloat(cut.start);

    const cutName =
      `(cut${cuts.length == 1 ? '' : i + 1}) ` +
      filename_noext +
      ' (' +
      toHMS(cut.start) +
      ' - ' +
      toHMS(cut.end) +
      ')' +
      ext;

    const inpath = path.join(indir, filename);
    const outpath = path.join(outdir, cutName);

    const cmd = 'ffmpeg';
    const args = [
      '-nostdin',
      '-y',
      '-loglevel',
      'error',
      '-ss',
      cut.start,
      '-t',
      duration,
      '-i',
      inpath,
      '-c',
      'copy',
      '-map',
      '0',
      '-avoid_negative_ts',
      'make_zero',
      outpath,
    ];

    const progress = '(' + (i + 1) + '/' + cuts.length + ')';
    const cmdStr = '' + cmd + ' ' + args.join(' ');

    console.log(
      '' + green + progress + plain + ' ' + inpath + ' ' + green + '->' + plain
    );
    console.log('' + outpath + '\n');
    console.log('' + purple + cmdStr + plain + '\n');

    child_process.spawnSync(cmd, args, { stdio: 'inherit' });

    await transferTimestamps(inpath, outpath);
  }

  return console.log('Done.\n');
}

main();
