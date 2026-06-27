import type {BuiltCaption, TimedCaption} from "./types";

export const buildCaptions = (
  captions: TimedCaption[] = [],
): BuiltCaption[] => {
  let cursor = 0;

  return captions.map((caption) => {
    const durationFrames = Math.max(1, caption.durationFrames);
    const result = {...caption, durationFrames, startFrame: cursor};
    cursor += durationFrames;
    return result;
  });
};

export const getActiveCaption = (
  captions: BuiltCaption[],
  localFrame: number,
  sceneDurationFrames?: number,
) => {
  if (
    captions.length === 0 ||
    localFrame < 0 ||
    (sceneDurationFrames !== undefined && localFrame >= sceneDurationFrames)
  ) {
    return undefined;
  }

  return (
    captions.find(
      (caption) =>
        localFrame >= caption.startFrame &&
        localFrame < caption.startFrame + caption.durationFrames,
    ) ??
    captions
      .slice()
      .reverse()
      .find((caption) => localFrame >= caption.startFrame) ??
    captions[0]
  );
};
