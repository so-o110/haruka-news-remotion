import { interpolate } from "remotion";

export type TimedCaption = {
  text: string;
  durationFrames: number;
};

export type ComputedTimedCaption = TimedCaption & {
  startFrame: number;
};

export const getComputedTimedCaptions = (
  captions: TimedCaption[] | undefined,
): ComputedTimedCaption[] => {
  let cursor = 0;

  return (captions ?? []).map((caption) => {
    const durationFrames = Math.max(1, caption.durationFrames);
    const computedCaption = {
      ...caption,
      durationFrames,
      startFrame: cursor,
    };

    cursor += durationFrames;

    return computedCaption;
  });
};

export const getActiveTimedCaption = (
  captions: TimedCaption[] | undefined,
  frame: number,
) =>
  getComputedTimedCaptions(captions).find(
    (caption) =>
      frame >= caption.startFrame &&
      frame < caption.startFrame + caption.durationFrames,
  );

export const getTimedCaptionOpacity = (
  caption: ComputedTimedCaption | undefined,
  frame: number,
  fadeFrames = 6,
) => {
  if (!caption) {
    return 1;
  }

  const localFrame = frame - caption.startFrame;
  const durationFrames = caption.durationFrames;
  const fadeDuration = Math.max(
    1,
    Math.min(fadeFrames, Math.floor(durationFrames / 2)),
  );

  return Math.min(
    interpolate(localFrame, [0, fadeDuration], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    interpolate(
      localFrame,
      [durationFrames - fadeDuration, durationFrames],
      [1, 0],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    ),
  );
};
