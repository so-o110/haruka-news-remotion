export type VideoKind = "news" | "study" | "discussion";

export type CharacterImage = string;

export type TimedCaption = {
  text: string;
  durationFrames: number;
};

export type BuiltCaption = TimedCaption & {
  startFrame: number;
};

export type TimedSlide = {
  image: string;
  durationFrames: number;
  alt?: string;
};

export type BuiltSlide = TimedSlide & {
  startFrame: number;
  resolvedImage: string;
};

export type Scene = {
  title?: string;
  category?: string;
  audio?: string;
  characterImage?: CharacterImage;
  durationFrames?: number;
  captions?: TimedCaption[];
  slides?: TimedSlide[];
  metadata?: Record<string, unknown>;
};

export type BuiltScene = Omit<
  Scene,
  "durationFrames" | "captions" | "slides"
> & {
  durationFrames: number;
  startFrame: number;
  audioStartFrame: number;
  characterDurationFrames: number;
  slideDurationFrames: number;
  captions: BuiltCaption[];
  slides: BuiltSlide[];
  resolvedAudio?: string;
  resolvedCharacterImage?: string;
};

export type VideoData = {
  kind: VideoKind;
  title?: string;
  scenes: Scene[];
  metadata?: Record<string, unknown>;
};

export type BuiltTimeline = {
  scenes: BuiltScene[];
  totalDurationFrames: number;
};

export type BuildTimelineOptions = {
  fps: number;
  defaultDurationFrames: number;
  audioBasePath?: string;
  slideBasePath?: string;
};
