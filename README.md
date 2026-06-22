# Remotion video

<p align="center">
  <a href="https://github.com/remotion-dev/logo">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-dark.apng">
      <img alt="Animated Remotion Logo" src="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-light.gif">
    </picture>
  </a>
</p>

Welcome to your Remotion project!

## Commands

**Install Dependencies**

```console
npm i
```

**Start Preview**

```console
npm run dev
```

**Render video**

```console
npx remotion render
```

## Short News Data

The short vertical video composition `ShortNewsVideo` reads its data from:

```text
public/data/short-news.json
```

Edit this JSON file when changing the short video title, captions, slide timing, or slide layout.

For slide position and size:

- `slideFrameStyle` controls the visible image frame when a slide uses the timed `slides` array, for example `{ "slides": [{ "src": "A.png", ... }] }`.
- `slideStyle` controls the single slide card/image frame when `slideImage` or text-only slide content is used.
- If `slideFrameStyle` is omitted for timed `slides`, `slideStyle` is used as a fallback.
- `x` maps to CSS `left`, `y` maps to CSS `top`, and `width`, `height`, `borderRadius`, `overflow`, and `zIndex` are applied directly to the frame.
- `textStyle` controls the lower body caption text box position (`x`, `y`, `width`, `zIndex`) and text appearance (`fontSize`, `lineHeight`, `textAlign`, `color`). When both `captionStyle` and `textStyle` set the same field, `textStyle` wins for these values.

## Landscape News Data

The landscape composition `HarukaNews` reads its data from:

```text
src/data/news.json
```

`HarukaNews` defaults to a 9-minute video. Set `video.duration` in seconds to override the fallback duration, for example `{ "video": { "duration": 540, "fps": 30 } }`. If `scenes` or `ending` exist, the composition duration is resolved from the last scene / ending end time first, then `video.duration`, then the 540-second default.

For long landscape videos, prefer `scenes`. Scene `startFrame` values are ignored and calculated automatically from the previous scene duration. If a scene, opening, or ending has `audio`, `audioPath`, or `audioFile`, a bare filename such as `"aa.wav"` is loaded from `public/audio/long/aa.wav`, and its wav length is converted to `durationFrames` with `Math.ceil(seconds * fps)`. Audio-derived duration wins over manual `durationFrames`; scenes without audio still fall back to `durationFrames`, then `duration` seconds. Scene fields mirror the short template where possible: `id`, `title`, `caption`, `text`, `character`, `characterImage`, `characterExpression`, `audio`, `slideImage`, `slideImageStyle`, `slideImages`, `slides` for timed images, `slideStyle`, `slideFrameStyle`, `captionStyle`, and `textStyle`.

Older `topics` JSON is still accepted as a fallback, but new landscape videos should use the `slides` array so timing, captions, character images, audio, and slide frames can be adjusted the same way as `ShortNewsVideo`.

`opening` controls the landscape intro. Use `enabled: false` to skip it. `duration` is in seconds and defaults to `4`. `title`, `subtitle`, `label`, `showCharacter`, `characterImage`, and optional `audio` can be set per video. With `scenes`, scene `start` values are absolute video times. With older `slides`, `startFrame` and `audioStartFrame` remain relative to the main story and the renderer automatically offsets them by the opening duration.

**Upgrade Remotion**

```console
npx remotion upgrade
```

## Docs

Get started with Remotion by reading the [fundamentals page](https://www.remotion.dev/docs/the-fundamentals).

## Help

We provide help on our [Discord server](https://discord.gg/6VzzNDwUwV).

## Issues

Found an issue with Remotion? [File an issue here](https://github.com/remotion-dev/remotion/issues/new).

## License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
