import {resolveSlidePath} from "./path";
import type {BuiltSlide, TimedSlide} from "./types";

export const buildSlides = (
  slides: TimedSlide[] = [],
  basePath = "slides",
): BuiltSlide[] => {
  let cursor = 0;

  return slides.map((slide) => {
    const durationFrames = Math.max(1, slide.durationFrames);
    const result = {
      ...slide,
      durationFrames,
      startFrame: cursor,
      resolvedImage: resolveSlidePath(slide.image, basePath),
    };
    cursor += durationFrames;
    return result;
  });
};

export const getActiveSlide = (
  slides: BuiltSlide[],
  localFrame: number,
  sceneDurationFrames?: number,
) => {
  if (
    slides.length === 0 ||
    localFrame < 0 ||
    (sceneDurationFrames !== undefined && localFrame >= sceneDurationFrames)
  ) {
    return undefined;
  }

  return (
    slides.find(
      (slide) =>
        localFrame >= slide.startFrame &&
        localFrame < slide.startFrame + slide.durationFrames,
    ) ??
    slides
      .slice()
      .reverse()
      .find((slide) => localFrame >= slide.startFrame) ??
    slides[0]
  );
};
