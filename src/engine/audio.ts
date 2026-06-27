import {getAudioDurationInSeconds} from "@remotion/media-utils";
import {staticFile} from "remotion";
import {toStaticFilePath} from "./path";

type GetAudioDurationFramesOptions = {
  audioPath?: string;
  fps: number;
  fallbackDurationFrames: number;
};

export const getAudioDurationFrames = async ({
  audioPath,
  fps,
  fallbackDurationFrames,
}: GetAudioDurationFramesOptions) => {
  const fallback = Math.max(1, fallbackDurationFrames);

  if (!audioPath) {
    return fallback;
  }

  try {
    const source = /^https?:\/\//i.test(audioPath)
      ? audioPath
      : staticFile(toStaticFilePath(audioPath));
    const seconds = await getAudioDurationInSeconds(source);
    return Math.max(1, Math.ceil(seconds * fps));
  } catch {
    return fallback;
  }
};
