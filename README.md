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
