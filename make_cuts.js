const fs = require('fs');
const child_process = require('child_process');
const path = require('path');

const red = '\x1b[31m';
const plain = '\x1b[0m';
const green = '\x1b[32m';
const purple = '\x1b[34m';

function quit(s) {
  console.log('' + red + s + ', quitting.' + plain + '\n');
  return process.exit();
}

function isDir(s) {
  try {
    return fs.statSync(s).isDirectory();
  } catch (e) {
    return false;
  }
}

function toHMS(secs) {
  return [
    Math.floor(secs / 3600),
    Math.floor((secs % 3600) / 60),
    Math.round(((secs % 3600) % 60) * 1000) / 1000,
  ]
    .filter(Boolean)
    .join('-');
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

  const [dir, filename, cutsStr] = argv;
  const cuts = JSON.parse(cutsStr);

  if (!isDir(dir)) {
    quit('Directory is invalid');
  }

  const numCuts = Object.keys(cuts).length;

  for (const [i, cut] of Object.values(cuts).entries()) {
    if (!('end' in cut)) continue;

    const { name: filename_noext, ext: ext } = path.parse(filename);
    const duration = parseFloat(cut.end) - parseFloat(cut.start);

    const cutName =
      '(cut) ' +
      filename_noext +
      ' (' +
      toHMS(cut.start) +
      ' - ' +
      toHMS(cut.end) +
      ')' +
      ext;

    const inpath = path.join(dir, filename);
    const outpath = path.join(dir, cutName);

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

    const progress = '(' + (i + 1) + '/' + numCuts + ')';
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
