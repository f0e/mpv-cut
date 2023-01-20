# mpv-cut

<p align="center">
  <img alt="preview" src="./assets/demo.gif">
</p>

## about

The core functionality of this script is to very quickly cut videos losslessly in [mpv](https://mpv.io/installation/) as an alternative to [LosslessCut](https://github.com/mifi/lossless-cut).

I decided to modify [mpv-cut](https://github.com/familyfriendlymikey/mpv-cut) since I was looking for slightly different functionality to what the original script provided. Mainly I wanted to be able to adjust the start and end points of cuts.

Also credits to [suckless-cut](https://github.com/couleur-tweak-tips/suckless-cut) for inspiration & keybinds.

## requirements

Besides mpv, you must have the following in your PATH:

- ffmpeg
- node

(I recommend using [scoop](https://scoop.sh) to install both on Windows)

## installation

### Windows

In
`%AppData%\Roaming\mpv\scripts` or `Users\user\scoop\persist\mpv\scripts` run:

```
git clone "https://github.com/f0e/mpv-cut.git"
```

### Linux/MacOS

```
git clone "https://github.com/f0e/mpv-cut.git" ~/.config/mpv/scripts/mpv-cut
```

## usage

### keybinds

- <kbd>g</kbd> and <kbd>h</kbd> to set the start and end points of a cut (will use your current position).
- <kbd>G</kbd> and <kbd>H</kbd> will do the same, but will place the points at the very start or end of the video.
- <kbd>r</kbd> to render cuts.

If you want to change the start or end position of a cut you can press the keybind again. You can also create multiple cuts from a single video.

Rendered cuts will be placed in the same directory as the source file.
