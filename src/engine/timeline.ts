import {getAudioDurationFrames} from "./audio";
import {buildCaptions} from "./captions";
import {resolveAudioPath, resolveCharacterPath} from "./path";
import {buildSlides} from "./slides";
import type {
  BuildTimelineOptions,
  BuiltScene,
  BuiltTimeline,
  Scene,
} from "./types";

const getItemsDuration = (items: Array<{durationFrames: number}> = []) =>
  items.reduce((total, item) => total + Math.max(1, item.durationFrames), 0);

const getFallbackDuration = (
  scene: Scene,
  defaultDurationFrames: number,
) =>
  Math.max(
    1,
    scene.durationFrames ??
      Math.max(
        getItemsDuration(scene.captions),
        getItemsDuration(scene.slides),
        defaultDurationFrames,
      ),
  );

const buildScene = (
  scene: Scene,
  durationFrames: number,
  startFrame: number,
  options: BuildTimelineOptions,
): BuiltScene => {
  const resolvedAudio = scene.audio
    ? resolveAudioPath(scene.audio, options.audioBasePath)
    : undefined;

  return {
    ...scene,
    durationFrames,
    startFrame,
    audioStartFrame: startFrame,
    characterDurationFrames: durationFrames,
    slideDurationFrames: durationFrames,
    captions: buildCaptions(scene.captions),
    slides: buildSlides(scene.slides, options.slideBasePath),
    resolvedAudio,
    resolvedCharacterImage: scene.characterImage
      ? resolveCharacterPath(scene.characterImage)
      : undefined,
  };
};

const finalizeTimeline = (
  scenes: Scene[],
  durations: number[],
  options: BuildTimelineOptions,
): BuiltTimeline => {
  let cursor = 0;
  const builtScenes = scenes.map((scene, index) => {
    const builtScene = buildScene(scene, durations[index], cursor, options);
    cursor += builtScene.durationFrames;
    return builtScene;
  });

  return {scenes: builtScenes, totalDurationFrames: Math.max(1, cursor)};
};

export const buildTimelineFromDurations = (
  scenes: Scene[],
  options: BuildTimelineOptions,
) =>
  finalizeTimeline(
    scenes,
    scenes.map((scene) =>
      getFallbackDuration(scene, options.defaultDurationFrames),
    ),
    options,
  );

export const buildTimeline = async (
  scenes: Scene[],
  options: BuildTimelineOptions,
): Promise<BuiltTimeline> => {
  const durations = await Promise.all(
    scenes.map(async (scene) => {
      const fallbackDurationFrames = getFallbackDuration(
        scene,
        options.defaultDurationFrames,
      );
      const resolvedAudio = scene.audio
        ? resolveAudioPath(scene.audio, options.audioBasePath)
        : undefined;

      return getAudioDurationFrames({
        audioPath: resolvedAudio,
        fps: options.fps,
        fallbackDurationFrames,
      });
    }),
  );

  return finalizeTimeline(scenes, durations, options);
};

export const isBuiltScene = (scene: Scene | BuiltScene): scene is BuiltScene =>
  "startFrame" in scene &&
  "audioStartFrame" in scene &&
  "characterDurationFrames" in scene;

export const getBuiltTimeline = (
  scenes: Array<Scene | BuiltScene>,
  options: BuildTimelineOptions,
): BuiltTimeline => {
  if (scenes.every(isBuiltScene)) {
    return {
      scenes,
      totalDurationFrames: Math.max(
        1,
        scenes.reduce(
          (total, scene) => total + scene.durationFrames,
          0,
        ),
      ),
    };
  }

  return buildTimelineFromDurations(scenes as Scene[], options);
};
