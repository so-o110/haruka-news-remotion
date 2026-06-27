import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import {
  AbsoluteFill,
  Audio,
  CalculateMetadataFunction,
  continueRender,
  delayRender,
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import {
  defaultCharacterFallbackPath,
  defaultCharacterPath,
  getCharacterImagePath as getCharacterAssetPath,
  getFileName,
  normalizePublicPath,
} from "./characterAssets";
import {
  getActiveTimedCaption,
  getTimedCaptionOpacity,
  type TimedCaption,
} from "./timedCaptions";
import newsData from "./data/news.json";

type ObjectFit = "cover" | "contain" | "fill";
type ObjectPosition = "center" | "top" | "bottom" | "left" | "right";
type Overflow = "hidden" | "visible";
type CharacterExpression = "normal" | "happy" | "serious" | "thinking";
type LayoutStyle = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  borderRadius?: number;
  overflow?: Overflow;
  zIndex?: number;
};

type ImageStyle = LayoutStyle & {
  objectFit?: ObjectFit;
  objectPosition?: ObjectPosition;
};

type TextStyle = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  padding?: number;
  fontSize?: number;
  lineHeight?: number;
  textAlign?: "left" | "center" | "right";
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  zIndex?: number;
};

type SlideInnerImage = ImageStyle & {
  src: string;
  opacity?: number;
  rotate?: number;
};

type TimedSlide = ImageStyle & {
  src: string;
  start: number;
  duration: number;
  opacity?: number;
};

type NewsSlide = {
  id?: string;
  title?: string;
  text?: string;
  caption?: string;
  captions?: TimedCaption[];
  subtitle?: string;
  characterExpression?: CharacterExpression;
  expression?: CharacterExpression;
  character?: string;
  characterImage?: string;
  audio?: string;
  audioPath?: string;
  audioFile?: string;
  audioDurationFrames?: number;
  characterDurationFrames?: number;
  characterDurationSeconds?: number;
  slideImage?: string;
  slideImageStyle?: ImageStyle;
  textStyle?: TextStyle;
  captionStyle?: TextStyle;
  slideStyle?: LayoutStyle;
  slideFrameStyle?: LayoutStyle;
  slideImages?: SlideInnerImage[];
  images?: SlideInnerImage[];
  slides?: TimedSlide[];
};

type ComputedNewsSlide = NewsSlide & {
  computedStartFrame: number;
  computedDurationFrames: number;
};

type CutInConfig = {
  id?: string;
  after: "before-ending" | string;
  label?: string;
  title?: string;
  durationFrames?: number;
  durationSeconds?: number;
};

type ComputedCutIn = CutInConfig & {
  computedStartFrame: number;
  computedDurationFrames: number;
};

type Ending = {
  enabled?: boolean;
  title?: string;
  text?: string;
  audio?: string;
  audioPath?: string;
  audioFile?: string;
  audioDurationFrames?: number;
  style?: TextStyle;
};

type OpeningConfig = {
  enabled?: boolean;
  duration?: number;
  durationFrames?: number;
  title?: string;
  subtitle?: string;
  label?: string;
  showCharacter?: boolean;
  characterImage?: string;
  audio?: string;
  audioPath?: string;
  audioFile?: string;
  audioDurationFrames?: number;
};

type LegacyTopic = {
  title?: string;
  category?: string;
  durationSeconds?: number;
  expression?: CharacterExpression;
  summary?: string;
  bullets?: string[];
  telop?: string;
  scenes?: NewsSlide[];
};

export type NewsData = {
  video?: {
    duration?: number;
    fps?: number;
  };
  title?: string;
  programTitle?: string;
  dateLabel?: string;
  anchorName?: string;
  audio?: string;
  opening?: OpeningConfig & {
    headline?: string;
  };
  ending?: Ending;
  cutIns?: CutInConfig[];
  scenes?: NewsSlide[];
  slides?: NewsSlide[];
  topics?: LegacyTopic[];
};

export type HarukaNewsVideoProps = {
  news?: NewsData;
};

type AssetStatus = {
  exists: boolean;
  src: string;
};

const defaultNews = newsData as NewsData;
export const HARUKA_NEWS_FPS = defaultNews.video?.fps ?? 30;
const fps = HARUKA_NEWS_FPS;
const defaultDurationSeconds = 540;
const theme = {
  sky: "#dff5ff",
  skyLight: "#f8fdff",
  blue: "#123b63",
  blueAccent: "#145d99",
  brown: "#7a3f17",
};
const getSlideAssetPath = (path: string) => {
  const normalized = normalizePublicPath(path);

  if (normalized.includes("/")) {
    return normalized;
  }

  return `slides/${normalized}`;
};
const getCharacterImagePath = (slide: NewsSlide) =>
  getCharacterAssetPath(
    slide.characterImage ?? slide.character ?? slide.characterExpression,
  );
const getOpeningCharacterImagePath = (imagePath: string | undefined) =>
  getCharacterAssetPath(imagePath);
const getLongAudioAssetPath = (path: string) => {
  const normalized = normalizePublicPath(path);

  if (normalized.includes("/")) {
    return normalized;
  }

  return `audio/long/${normalized}`;
};
const getAudioPath = (
  audioConfig:
    | { audio?: string; audioPath?: string; audioFile?: string }
    | undefined,
) => {
  const path =
    audioConfig?.audio ?? audioConfig?.audioPath ?? audioConfig?.audioFile;

  return path ? getLongAudioAssetPath(path) : undefined;
};

const legacyTopicsToSlides = (topics: LegacyTopic[] | undefined): NewsSlide[] =>
  (topics ?? []).map((topic, index) => ({
    text: [
      topic.summary,
      ...(topic.bullets ?? []).map((bullet) => `・${bullet}`),
    ]
      .filter(Boolean)
      .join("\n"),
    caption: topic.telop ?? topic.title ?? "",
    characterExpression: topic.expression ?? "normal",
    character: topic.expression ?? "normal-1",
    slideStyle: {
      x: 760,
      y: 260,
      width: 1040,
      height: 510,
      borderRadius: 0,
      overflow: "hidden",
      zIndex: 10,
    },
    textStyle: {
      x: 650,
      y: 820,
      width: 1120,
      height: 150,
      fontSize: index === 0 ? 38 : 34,
      lineHeight: 1.22,
      textAlign: "center",
      color: theme.blue,
      zIndex: 30,
    },
  }));

const getSlideDuration = (slide: NewsSlide) =>
  Math.max(1, slide.audioDurationFrames ?? 8 * fps);

const getTopicSlides = (topics: LegacyTopic[] | undefined) =>
  (topics ?? []).flatMap((topic) => topic.scenes ?? []);
const getSourceSlides = (currentNews: NewsData) => {
  const topicSlides = getTopicSlides(currentNews.topics);

  if (currentNews.scenes && currentNews.scenes.length > 0) {
    return currentNews.scenes;
  }

  if (currentNews.slides && currentNews.slides.length > 0) {
    return currentNews.slides;
  }

  if (topicSlides.length > 0) {
    return topicSlides;
  }

  return legacyTopicsToSlides(currentNews.topics);
};
const getComputedSlides = (sourceSlides: NewsSlide[]): ComputedNewsSlide[] => {
  let cursor = 0;

  return sourceSlides.map((slide) => {
    const computedDurationFrames = getSlideDuration(slide);
    const computedSlide = {
      ...slide,
      computedStartFrame: cursor,
      computedDurationFrames,
    };

    cursor += computedDurationFrames;

    return computedSlide;
  });
};

const getSlideStartFrame = (slide: ComputedNewsSlide) =>
  slide.computedStartFrame;
const getCutInDurationFrames = (cutIn: CutInConfig) =>
  Math.max(
    1,
    cutIn.durationFrames ??
      (cutIn.durationSeconds !== undefined
        ? Math.round(cutIn.durationSeconds * fps)
        : Math.round(1.4 * fps)),
  );
const getCutInBaseStartFrame = (
  cutIn: CutInConfig,
  computedSlides: ComputedNewsSlide[],
  endingStartFrame: number,
) => {
  if (cutIn.after === "before-ending") {
    return endingStartFrame;
  }

  const slide = computedSlides.find((candidate) => candidate.id === cutIn.after);

  if (!slide) {
    throw new Error(
      `横長動画のカットイン挿入先が見つかりません: ${cutIn.after}. news.json の cutIns[].after には "before-ending" または scenes[].id を指定してください。`,
    );
  }

  return slide.computedStartFrame + slide.computedDurationFrames;
};
const getComputedCutIns = (
  cutIns: CutInConfig[] | undefined,
  computedSlides: ComputedNewsSlide[],
  endingStartFrame: number,
): ComputedCutIn[] =>
  (cutIns ?? [])
    .map((cutIn) => ({
      ...cutIn,
      computedStartFrame: getCutInBaseStartFrame(
        cutIn,
        computedSlides,
        endingStartFrame,
      ),
      computedDurationFrames: getCutInDurationFrames(cutIn),
    }))
    .sort(
      (first, second) =>
        first.computedStartFrame - second.computedStartFrame,
    );
const getCutInOffsetBeforeFrame = (
  cutIns: ComputedCutIn[],
  frame: number,
  includeSameFrame: boolean,
) =>
  cutIns
    .filter((cutIn) =>
      includeSameFrame
        ? cutIn.computedStartFrame <= frame
        : cutIn.computedStartFrame < frame,
    )
    .reduce((total, cutIn) => total + cutIn.computedDurationFrames, 0);
const getTimelineFrameWithCutIns = (
  frame: number,
  cutIns: ComputedCutIn[],
  includeSameFrame = true,
) => frame + getCutInOffsetBeforeFrame(cutIns, frame, includeSameFrame);
const getCutInTimelineStartFrame = (
  cutIn: ComputedCutIn,
  index: number,
  cutIns: ComputedCutIn[],
) =>
  cutIn.computedStartFrame +
  cutIns
    .slice(0, index)
    .filter(
      (previousCutIn) =>
        previousCutIn.computedStartFrame <= cutIn.computedStartFrame,
    )
    .reduce((total, previousCutIn) => {
      return total + previousCutIn.computedDurationFrames;
    }, 0);
const getContentFrameFromTimelineFrame = (
  timelineFrame: number,
  cutIns: ComputedCutIn[],
) => {
  let contentFrame = timelineFrame;

  for (const cutIn of cutIns) {
    const cutInStart = getTimelineFrameWithCutIns(
      cutIn.computedStartFrame,
      cutIns,
      false,
    );
    const cutInEnd = cutInStart + cutIn.computedDurationFrames;

    if (timelineFrame >= cutInEnd) {
      contentFrame -= cutIn.computedDurationFrames;
    }
  }

  return Math.max(0, contentFrame);
};
const getCurrentHeaderTitle = ({
  currentTimelineFrame,
  slides,
  cutIns,
  fallbackTitle,
}: {
  currentTimelineFrame: number;
  slides: ComputedNewsSlide[];
  cutIns: ComputedCutIn[];
  fallbackTitle: string;
}) => {
  const activeCutIn = cutIns.find((cutIn) => {
    const cutInStart = getTimelineFrameWithCutIns(
      cutIn.computedStartFrame,
      cutIns,
      false,
    );

    return (
      currentTimelineFrame >= cutInStart &&
      currentTimelineFrame < cutInStart + cutIn.computedDurationFrames
    );
  });

  if (activeCutIn?.title) {
    return activeCutIn.title;
  }

  const contentFrame = getContentFrameFromTimelineFrame(
    currentTimelineFrame,
    cutIns,
  );
  const activeSlide = slides.find(
    (slide) =>
      contentFrame >= slide.computedStartFrame &&
      contentFrame <
        slide.computedStartFrame + slide.computedDurationFrames,
  );

  return activeSlide?.title ?? fallbackTitle;
};

const getTimelineOffsetFrames = (currentNews: NewsData) =>
  getOpeningDurationFrames(currentNews);

const getEndingDurationFrames = (ending: Ending | undefined) =>
  Math.max(1, ending?.audioDurationFrames ?? 90);

const getEndingStartFrame = (
  ending: Ending | undefined,
  computedSlides: ComputedNewsSlide[],
) => {
  const slideEnd =
    computedSlides.length === 0
      ? 0
      : Math.max(
          ...computedSlides.map(
            (slide) => getSlideStartFrame(slide) + slide.computedDurationFrames,
          ),
        );

  return slideEnd;
};

const getOpeningConfig = (currentNews: NewsData) => currentNews.opening;
const getOpeningDurationFrames = (currentNews: NewsData) => {
  const opening = getOpeningConfig(currentNews);

  if (opening?.enabled === false) {
    return 0;
  }

  return Math.max(
    1,
    opening?.audioDurationFrames ??
      opening?.durationFrames ??
      Math.round((opening?.duration ?? 4) * fps),
  );
};

const getTotalFrames = (currentNews: NewsData) => {
  const computedSlides = getComputedSlides(getSourceSlides(currentNews));
  const openingFrames = getOpeningDurationFrames(currentNews);
  const slideEnd =
    computedSlides.length === 0
      ? 0
      : Math.max(
          ...computedSlides.map((slide) => {
            const from = getSlideStartFrame(slide);
            return from + slide.computedDurationFrames;
          }),
        );
  const ending = currentNews.ending;
  const endingStart = getEndingStartFrame(ending, computedSlides);
  const cutIns = getComputedCutIns(
    currentNews.cutIns,
    computedSlides,
    endingStart,
  );
  const endingEnd =
    ending?.enabled === false
      ? 0
      : endingStart + getEndingDurationFrames(ending);
  const hasTimelineContent = computedSlides.length > 0 || Boolean(ending);

  if (hasTimelineContent) {
    const baseContentEnd = Math.max(slideEnd, endingEnd);
    const cutInOffset = getCutInOffsetBeforeFrame(
      cutIns,
      baseContentEnd,
      true,
    );

    return Math.max(openingFrames + baseContentEnd + cutInOffset, 1);
  }

  if (currentNews.video?.duration !== undefined) {
    return Math.max(1, Math.round(currentNews.video.duration * fps));
  }

  return Math.max(Math.round(defaultDurationSeconds * fps), 1);
};

export const HARUKA_NEWS_DURATION_IN_FRAMES = getTotalFrames(defaultNews);

type AudioTimedConfig = {
  audio?: string;
  audioPath?: string;
  audioFile?: string;
  audioDurationFrames?: number;
};

const getAudioDurationFrames = async (
  audioConfig: AudioTimedConfig | undefined,
) => {
  const audioPath = getAudioPath(audioConfig);

  if (!audioPath) {
    return undefined;
  }

  try {
    const audioDurationSeconds = await getAudioDurationInSeconds(
      staticFile(audioPath),
    );

    return {
      audio: audioPath,
      audioDurationFrames: Math.max(1, Math.ceil(audioDurationSeconds * fps)),
    };
  } catch (error) {
    throw new Error(
      `横長動画の音声ファイルが読み込めません: public/${audioPath}. ` +
        `news.json の audio / audioPath / audioFile と public/audio/long/ のwavファイル名を確認してください。` +
        `\n原因: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

const resolveAudioTiming = async <T extends AudioTimedConfig>(
  audioConfig: T,
): Promise<T> => {
  const audioTiming = await getAudioDurationFrames(audioConfig);

  if (!audioTiming) {
    return audioConfig;
  }

  return {
    ...audioConfig,
    audio: audioTiming.audio,
    audioDurationFrames: audioTiming.audioDurationFrames,
  };
};

export const resolveLandscapeNewsAudioDurations = async (
  currentNews: NewsData,
): Promise<NewsData> => ({
  ...currentNews,
  opening: currentNews.opening
    ? await resolveAudioTiming(currentNews.opening)
    : currentNews.opening,
  ending: currentNews.ending
    ? await resolveAudioTiming(currentNews.ending)
    : currentNews.ending,
  scenes: currentNews.scenes
    ? await Promise.all(currentNews.scenes.map(resolveAudioTiming))
    : currentNews.scenes,
  slides: currentNews.slides
    ? await Promise.all(currentNews.slides.map(resolveAudioTiming))
    : currentNews.slides,
  topics: currentNews.topics
    ? await Promise.all(
        currentNews.topics.map(async (topic) => ({
          ...topic,
          scenes: topic.scenes
            ? await Promise.all(topic.scenes.map(resolveAudioTiming))
            : topic.scenes,
        })),
      )
    : currentNews.topics,
});

export const calculateHarukaNewsMetadata: CalculateMetadataFunction<
  HarukaNewsVideoProps
> = async () => {
  const resolvedNews = await resolveLandscapeNewsAudioDurations(defaultNews);

  return {
    durationInFrames: getTotalFrames(resolvedNews),
    props: {
      news: resolvedNews,
    },
  };
};

const usePublicAsset = (path: string): AssetStatus => {
  const src = useMemo(() => staticFile(normalizePublicPath(path)), [path]);
  const [exists, setExists] = useState(false);
  const [handle] = useState(() => delayRender(`Checking ${path}`));

  useEffect(() => {
    let isMounted = true;

    fetch(src, { method: "HEAD" })
      .then((response) => {
        if (isMounted) {
          setExists(response.ok);
        }
      })
      .catch(() => {
        if (isMounted) {
          setExists(false);
        }
      })
      .finally(() => {
        if (isMounted) {
          continueRender(handle);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [handle, src]);

  return { exists, src };
};

const SafeAudio = ({ path }: { path: string }) => {
  const { exists, src } = usePublicAsset(path);

  if (!exists) {
    return null;
  }

  return <Audio src={src} volume={1} />;
};

const SafeImage = ({
  path,
  style,
}: {
  path: string;
  style: CSSProperties;
}) => {
  const { exists, src } = usePublicAsset(path);

  if (!exists) {
    return null;
  }

  return <Img src={src} style={style} />;
};

const SafeCharacterImage = ({
  path,
  style,
}: {
  path: string;
  style: CSSProperties;
}) => {
  const primary = usePublicAsset(path);
  const defaultAsset = usePublicAsset(defaultCharacterPath);
  const fallbackAsset = usePublicAsset(defaultCharacterFallbackPath);
  const src = primary.exists
    ? primary.src
    : defaultAsset.exists
      ? defaultAsset.src
      : fallbackAsset.exists
        ? fallbackAsset.src
        : null;

  if (!src) {
    return null;
  }

  return <Img src={src} style={style} />;
};

const Background = () => (
  <AbsoluteFill
    style={{
      background:
        "linear-gradient(180deg, #fafdff 0%, #eaf8ff 46%, #dff5ff 100%)",
      overflow: "hidden",
    }}
  >
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 58% 28%, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0) 44%)",
      }}
    />
    <AbsoluteFill
      style={{
        border: `5px solid ${theme.brown}`,
        boxSizing: "border-box",
      }}
    />
  </AbsoluteFill>
);

const HeaderLogo = () => (
  <div
    style={{
      position: "absolute",
      left: 96,
      top: 54,
      display: "inline-flex",
      alignItems: "center",
      gap: 14,
      maxWidth: 660,
      padding: "12px 24px 14px 18px",
      background:
        "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(231,248,255,0.94) 54%, rgba(190,230,255,0.88) 100%)",
      border: `3px solid ${theme.brown}`,
      borderRadius: 20,
      boxShadow:
        "0 12px 26px rgba(20,93,153,0.15), inset 0 0 0 2px rgba(255,255,255,0.82)",
      overflow: "hidden",
      zIndex: 40,
    }}
  >
    <div
      style={{
        width: 58,
        height: 46,
        flexShrink: 0,
        position: "relative",
        overflow: "hidden",
        borderRadius: 10,
      }}
    >
      <Img
        src={staticFile("branding/haruka-star-arrow.png")}
        style={{
          position: "absolute",
          left: 0,
          top: 1,
          width: 58,
          height: 44,
          objectFit: "contain",
          filter: "drop-shadow(0 4px 6px rgba(18,59,99,0.14))",
        }}
      />
    </div>
    <span
      style={{
        color: theme.blueAccent,
        fontSize: 38,
        lineHeight: 1,
        fontWeight: 950,
        whiteSpace: "nowrap",
        textShadow: "0 3px 0 rgba(255,255,255,0.96)",
      }}
    >
      ハルカニュース
    </span>
    <span
      style={{
        color: theme.blueAccent,
        fontSize: 23,
        lineHeight: 1,
        fontWeight: 950,
        whiteSpace: "nowrap",
        textShadow: "0 2px 0 rgba(255,255,255,0.96)",
      }}
    >
      SHORTS
    </span>
  </div>
);

const HighlightedTitle = ({ text }: { text: string }) => {
  const parts = text.split(/(\d+億人|\d+万人|\d+人|\d+億|\d+万)/g);

  return (
    <>
      {parts.map((part, index) => {
        const isHighlight = /\d+(億人|万人|人|億|万)/.test(part);

        return (
          <span
            key={`${part}-${index}`}
            style={{ color: isHighlight ? theme.brown : "inherit" }}
          >
            {part}
          </span>
        );
      })}
    </>
  );
};

const Character = ({ slide, localFrame }: { slide: NewsSlide; localFrame: number }) => {
  const imagePath = getCharacterImagePath(slide);
  const enter = interpolate(localFrame, [0, 24], [58, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const float = Math.sin(localFrame / 24) * 7;

  return (
    <div
      style={{
        position: "absolute",
        left: 76,
        bottom: 0,
        width: 520,
        height: 690,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        transform: `translateY(${enter + float}px)`,
        zIndex: 24,
      }}
    >
      <SafeCharacterImage
        path={imagePath}
        style={{
          maxWidth: 520,
          maxHeight: 680,
          objectFit: "contain",
          filter: "drop-shadow(0 20px 28px rgba(18,59,99,0.22))",
        }}
      />
    </div>
  );
};

const TimedImages = ({
  timedSlides,
  frameStyle,
}: {
  timedSlides: TimedSlide[];
  frameStyle?: LayoutStyle;
}) => (
  <>
    {timedSlides.map((timedSlide, index) => {
      const from = Math.round(timedSlide.start * fps);
      const durationInFrames = Math.max(
        1,
        Math.round(timedSlide.duration * fps),
      );
      const x = frameStyle?.x ?? timedSlide.x ?? 760;
      const y = frameStyle?.y ?? timedSlide.y ?? 260;
      const width = frameStyle?.width ?? timedSlide.width ?? 1040;
      const height = frameStyle?.height ?? timedSlide.height ?? 510;
      const borderRadius =
        frameStyle?.borderRadius ?? timedSlide.borderRadius ?? 0;
      const overflow = frameStyle?.overflow ?? "hidden";
      const zIndex = frameStyle?.zIndex ?? timedSlide.zIndex ?? 10;

      return (
        <Sequence
          key={`${timedSlide.src}-${index}`}
          from={from}
          durationInFrames={durationInFrames}
          layout="none"
          name={`landscape-slide-image-${index + 1}`}
        >
          <section
            style={{
              position: "absolute",
              left: x,
              top: y,
              width,
              height,
              borderRadius,
              overflow,
              zIndex,
              opacity: timedSlide.opacity ?? 1,
              border: `5px solid ${theme.brown}`,
              boxSizing: "border-box",
              backgroundColor: "rgba(255,255,255,0.72)",
              boxShadow: "0 14px 28px rgba(18,59,99,0.13)",
            }}
          >
            <SafeImage
              path={getSlideAssetPath(timedSlide.src)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: timedSlide.objectFit ?? "contain",
                objectPosition: timedSlide.objectPosition ?? "center",
              }}
            />
          </section>
        </Sequence>
      );
    })}
  </>
);

const SlideFrame = ({ slide, enter }: { slide: NewsSlide; enter: number }) => {
  if (slide.slides && slide.slides.length > 0) {
    return (
      <TimedImages
        timedSlides={slide.slides}
        frameStyle={slide.slideFrameStyle ?? slide.slideStyle}
      />
    );
  }

  const style = slide.slideStyle;
  const imageStyle = slide.slideImageStyle;
  const x = style?.x ?? imageStyle?.x ?? 760;
  const y = style?.y ?? imageStyle?.y ?? 260;
  const width = style?.width ?? imageStyle?.width ?? 1040;
  const height = style?.height ?? imageStyle?.height ?? 510;
  const borderRadius = style?.borderRadius ?? imageStyle?.borderRadius ?? 0;
  const overflow = style?.overflow ?? "hidden";
  const zIndex = style?.zIndex ?? 10;
  const bodyText = slide.text ?? "";
  const bodyTitle = slide.title;

  return (
    <section
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        borderRadius,
        overflow,
        zIndex,
        border: `5px solid ${theme.brown}`,
        boxSizing: "border-box",
        backgroundColor: "rgba(255,255,255,0.78)",
        boxShadow: "0 14px 28px rgba(18,59,99,0.13)",
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [24, 0])}px)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 48,
        whiteSpace: "pre-line",
      }}
    >
      {slide.slideImage ? (
        <SafeImage
          path={getSlideAssetPath(slide.slideImage)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: imageStyle?.objectFit ?? "contain",
            objectPosition: imageStyle?.objectPosition ?? "center",
          }}
        />
      ) : null}
      {slide.slideImages?.map((image, index) => (
        <SafeImage
          key={`${image.src}-${index}`}
          path={getSlideAssetPath(image.src)}
          style={{
            position: "absolute",
            left: image.x,
            top: image.y,
            width: image.width,
            height: image.height,
            objectFit: image.objectFit ?? "contain",
            objectPosition: image.objectPosition ?? "center",
            opacity: image.opacity ?? 1,
            transform: `rotate(${image.rotate ?? 0}deg)`,
            borderRadius: image.borderRadius ?? 0,
            zIndex: image.zIndex ?? 1,
          }}
        />
      ))}
      {!slide.slideImage && (bodyTitle || bodyText) ? (
        <div
          style={{
            color: theme.blue,
            fontSize: 36,
            lineHeight: 1.45,
            fontWeight: 850,
            textAlign: "left",
            position: "relative",
            zIndex: 2,
          }}
        >
          {bodyTitle ? (
            <div
              style={{
                marginBottom: bodyText ? 24 : 0,
                fontSize: 42,
                lineHeight: 1.2,
                fontWeight: 950,
                textAlign: "center",
              }}
            >
              {bodyTitle}
            </div>
          ) : null}
          {bodyText ? <div>{bodyText}</div> : null}
        </div>
      ) : null}
    </section>
  );
};

const Caption = ({
  slide,
  enter,
  localFrame,
}: {
  slide: NewsSlide;
  enter: number;
  localFrame: number;
}) => {
  const textStyle = slide.textStyle;
  const captionStyle = slide.captionStyle;
  const width = textStyle?.width ?? captionStyle?.width ?? 1120;
  const x = textStyle?.x ?? captionStyle?.x ?? 650;
  const y = textStyle?.y ?? captionStyle?.y ?? 820;
  const height = textStyle?.height ?? captionStyle?.height ?? 150;
  const borderWidth = captionStyle?.borderWidth ?? 5;
  const borderColor = captionStyle?.borderColor ?? theme.brown;
  const timedCaption = getActiveTimedCaption(slide.captions, localFrame);
  const captionText = timedCaption?.text ?? slide.caption ?? slide.subtitle ?? "";
  const captionOpacity = getTimedCaptionOpacity(timedCaption, localFrame);

  return (
    <section
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        zIndex: textStyle?.zIndex ?? captionStyle?.zIndex ?? 30,
        boxSizing: "border-box",
        padding: captionStyle?.padding ?? textStyle?.padding ?? 28,
        borderRadius: captionStyle?.borderRadius ?? textStyle?.borderRadius ?? 0,
        background: captionStyle?.backgroundColor ?? "rgba(255,255,255,0.9)",
        border: `${borderWidth}px solid ${borderColor}`,
        boxShadow: "0 14px 28px rgba(18,59,99,0.13)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: enter,
      }}
    >
      <div
        style={{
          width: "100%",
          color: textStyle?.color ?? captionStyle?.color ?? theme.blue,
          fontSize: textStyle?.fontSize ?? captionStyle?.fontSize ?? 42,
          lineHeight: textStyle?.lineHeight ?? captionStyle?.lineHeight ?? 1.2,
          fontWeight: 950,
          textAlign: textStyle?.textAlign ?? captionStyle?.textAlign ?? "center",
          textShadow: "none",
          opacity: captionOpacity,
          whiteSpace: "pre-wrap",
          overflowWrap: "break-word",
        }}
      >
        {captionText}
      </div>
    </section>
  );
};

const Scene = ({ slide }: { slide: NewsSlide }) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill>
      <SlideFrame slide={slide} enter={enter} />
      <Caption slide={slide} enter={enter} localFrame={frame} />
      <Character slide={slide} localFrame={frame} />
    </AbsoluteFill>
  );
};

const CutIn = ({ cutIn }: { cutIn: ComputedCutIn }) => {
  const frame = useCurrentFrame();
  const durationFrames = cutIn.computedDurationFrames;
  const wipe = interpolate(frame, [0, 14], [-1920, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const exit = interpolate(
    frame,
    [durationFrames - 12, durationFrames],
    [0, 1920],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.7, 0, 0.84, 0),
    },
  );
  const textOpacity = interpolate(
    frame,
    [6, 16, durationFrames - 12, durationFrames - 4],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const accentWidth = interpolate(frame, [8, 24], [0, 640], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.blue,
        overflow: "hidden",
        zIndex: 120,
        transform: `translateX(${wipe + exit}px)`,
      }}
    >
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(135deg, rgba(223,245,255,0.16) 0%, rgba(223,245,255,0.04) 46%, rgba(122,63,23,0.24) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -160,
          top: 0,
          width: 520,
          height: 1080,
          backgroundColor: theme.brown,
          transform: "skewX(-14deg)",
          boxShadow: "28px 0 0 rgba(255,255,255,0.16)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -240,
          top: 0,
          width: 620,
          height: 1080,
          borderLeft: `18px solid ${theme.brown}`,
          transform: "skewX(-14deg)",
          backgroundColor: "rgba(255,255,255,0.08)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 32,
          border: `5px solid ${theme.brown}`,
          boxSizing: "border-box",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 360,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          color: theme.skyLight,
          opacity: textOpacity,
          textShadow: "0 8px 18px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            fontSize: 46,
            lineHeight: 1,
            fontWeight: 950,
            letterSpacing: 0,
            color: "#ffffff",
          }}
        >
          {cutIn.label ?? "NEXT TOPIC"}
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 104,
            lineHeight: 1,
            fontWeight: 950,
            color: theme.skyLight,
          }}
        >
          {cutIn.title ?? ""}
        </div>
        <div
          style={{
            marginTop: 36,
            width: accentWidth,
            height: 10,
            background: `linear-gradient(90deg, ${theme.brown} 0%, ${theme.brown} 54%, #ffffff 54%, #ffffff 100%)`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const EndingScreen = ({
  localFrame,
  durationFrames,
  ending,
}: {
  localFrame: number;
  durationFrames: number;
  ending?: Ending;
}) => {
  const fadeFrames = Math.min(2 * fps, durationFrames);
  const opacity = interpolate(localFrame, [0, fadeFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const style = ending?.style;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: style?.backgroundColor ?? "rgba(248,253,255,0.94)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity,
        zIndex: style?.zIndex ?? 100,
      }}
    >
      <div
        style={{
          position:
            style?.x !== undefined || style?.y !== undefined
              ? "absolute"
              : "relative",
          left: style?.x,
          top: style?.y,
          width: style?.width,
          height: style?.height,
          fontSize: style?.fontSize ?? 96,
          lineHeight: style?.lineHeight ?? 1.1,
          fontWeight: 950,
          color: style?.color ?? theme.blue,
          textAlign: style?.textAlign ?? "center",
        }}
      >
        {ending?.text ?? ending?.title ?? "ハルカニュース"}
      </div>
    </AbsoluteFill>
  );
};

const OpeningScreen = ({
  opening,
  durationFrames,
  news,
}: {
  opening?: OpeningConfig;
  durationFrames: number;
  news: NewsData;
}) => {
  const frame = useCurrentFrame();
  const title = opening?.title ?? news.programTitle ?? "ハルカニュース";
  const subtitle = opening?.subtitle ?? "AI NEWS REPORT";
  const label = opening?.label ?? news.dateLabel ?? "今日のニュース";
  const showCharacter = opening?.showCharacter ?? true;
  const fade = interpolate(frame, [0, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const titleScale = interpolate(frame, [8, 48], [0.92, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const lineWidth = interpolate(frame, [18, 58], [0, 560], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const cardSlide = interpolate(frame, [16, 52], [52, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const characterEnter = interpolate(frame, [22, 68], [90, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const exitOpacity = interpolate(
    frame,
    [durationFrames - 18, durationFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(180deg, #fafdff 0%, #eaf8ff 46%, #dff5ff 100%)",
        opacity: exitOpacity,
        overflow: "hidden",
        color: theme.blue,
        zIndex: 80,
      }}
    >
      <AbsoluteFill
        style={{
          border: `5px solid ${theme.brown}`,
          boxSizing: "border-box",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: fade,
          background:
            "radial-gradient(circle at 50% 34%, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0) 42%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 92,
          top: 62,
          padding: "12px 26px",
          border: `3px solid ${theme.brown}`,
          borderRadius: 18,
          backgroundColor: "rgba(255,255,255,0.72)",
          color: theme.blueAccent,
          fontSize: 28,
          fontWeight: 900,
          opacity: fade,
          transform: `translateX(${cardSlide}px)`,
          boxShadow: "0 10px 24px rgba(18,59,99,0.12)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          position: "absolute",
          left: 248,
          right: 248,
          top: 260,
          height: 420,
          border: `4px solid ${theme.brown}`,
          backgroundColor: "rgba(255,255,255,0.62)",
          boxShadow: "0 20px 42px rgba(18,59,99,0.12)",
          opacity: fade,
          transform: `translateY(${cardSlide}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 370,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: fade,
          transform: `scale(${titleScale})`,
          zIndex: 5,
        }}
      >
        <div
          style={{
            fontSize: 112,
            lineHeight: 1,
            fontWeight: 950,
            color: theme.blue,
            textShadow: "0 5px 0 rgba(255,255,255,0.96)",
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 34,
            letterSpacing: 0,
            fontWeight: 900,
            color: theme.blueAccent,
          }}
        >
          {subtitle}
        </div>
        <div
          style={{
            marginTop: 34,
            width: lineWidth,
            height: 8,
            borderRadius: 999,
            background: `linear-gradient(90deg, ${theme.brown} 0%, ${theme.brown} 60%, ${theme.blueAccent} 60%, ${theme.blueAccent} 100%)`,
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 178,
          right: 178,
          bottom: 118,
          height: 4,
          backgroundColor: "rgba(122,63,23,0.5)",
          transform: `scaleX(${interpolate(frame, [24, 64], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })})`,
        }}
      />
      {showCharacter ? (
        <div
          style={{
            position: "absolute",
            left: 96,
            bottom: -8,
            width: 390,
            height: 520,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            opacity: fade,
            transform: `translateY(${characterEnter}px)`,
            zIndex: 6,
          }}
        >
          <SafeCharacterImage
            path={getOpeningCharacterImagePath(opening?.characterImage)}
            style={{
              maxWidth: 390,
              maxHeight: 520,
              objectFit: "contain",
              filter: "drop-shadow(0 18px 26px rgba(18,59,99,0.2))",
            }}
          />
        </div>
      ) : null}
      {opening?.audio ? (
        <SafeAudio path={getLongAudioAssetPath(opening.audio)} />
      ) : null}
    </AbsoluteFill>
  );
};

export const HarukaNewsVideo = ({ news = defaultNews }: HarukaNewsVideoProps) => {
  const frame = useCurrentFrame();
  const slides = getComputedSlides(getSourceSlides(news));
  const opening = getOpeningConfig(news);
  const openingFrames = getOpeningDurationFrames(news);
  const timelineOffset = getTimelineOffsetFrames(news);
  const ending = news.ending;
  const shouldShowEnding = ending?.enabled ?? Boolean(ending);
  const endingStart = getEndingStartFrame(ending, slides);
  const endingDuration = getEndingDurationFrames(ending);
  const cutIns = getComputedCutIns(news.cutIns, slides, endingStart);
  const shiftedEndingStart = getTimelineFrameWithCutIns(endingStart, cutIns);
  const fallbackTitle = news.title ?? news.programTitle ?? "ハルカニュース";
  const headerTitle =
    frame < openingFrames
      ? fallbackTitle
      : getCurrentHeaderTitle({
          currentTimelineFrame: frame - timelineOffset,
          slides,
          cutIns,
          fallbackTitle,
        });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.sky,
        color: theme.blue,
        overflow: "hidden",
        fontFamily:
          "'Yu Gothic', 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif",
      }}
    >
      <Background />
      <HeaderLogo />
      <h1
        style={{
          position: "absolute",
          left: 96,
          top: 150,
          margin: 0,
          width: 1680,
          color: theme.blue,
          fontSize: 64,
          lineHeight: 1.12,
          fontWeight: 950,
          zIndex: 35,
        }}
      >
        <HighlightedTitle text={headerTitle} />
      </h1>
      {openingFrames > 0 ? (
        <Sequence
          durationInFrames={openingFrames}
          name="landscape-opening"
        >
          <OpeningScreen
            opening={opening}
            durationFrames={openingFrames}
            news={news}
          />
        </Sequence>
      ) : null}
      {news.audio ? (
        <Sequence
          from={openingFrames}
          durationInFrames={getTotalFrames(news) - openingFrames}
          layout="none"
          name={`landscape-main-audio-${getFileName(news.audio)}`}
        >
          <SafeAudio path={getLongAudioAssetPath(news.audio)} />
        </Sequence>
      ) : null}
      {slides.map((slide, index) => {
        const from = getTimelineFrameWithCutIns(
          getSlideStartFrame(slide),
          cutIns,
        );
        const duration = slide.computedDurationFrames;

        return (
          <Sequence
            key={`landscape-visual-${index}-${slide.id ?? slide.caption ?? slide.text ?? ""}`}
            from={timelineOffset + from}
            durationInFrames={duration}
            name={`landscape-slide-${slide.id ?? index + 1}`}
          >
            <Scene slide={slide} />
          </Sequence>
        );
      })}
      {slides.map((slide, index) => {
        if (!slide.audio) {
          return null;
        }

        const audioFrom = slide.computedStartFrame;

        return (
          <Sequence
            key={`landscape-audio-${index}-${slide.audio}`}
            from={timelineOffset + getTimelineFrameWithCutIns(audioFrom, cutIns)}
            durationInFrames={slide.computedDurationFrames}
            layout="none"
            name={`landscape-audio-${index + 1}-${getFileName(slide.audio)}`}
          >
            <SafeAudio path={getLongAudioAssetPath(slide.audio)} />
          </Sequence>
        );
      })}
      {cutIns.map((cutIn, index) => (
        <Sequence
          key={`landscape-cutin-${cutIn.id ?? index}`}
          from={
            timelineOffset +
            getCutInTimelineStartFrame(cutIn, index, cutIns)
          }
          durationInFrames={cutIn.computedDurationFrames}
          name={`landscape-cutin-${cutIn.id ?? index + 1}`}
        >
          <CutIn cutIn={cutIn} />
        </Sequence>
      ))}
      {shouldShowEnding ? (
        <Sequence
          from={timelineOffset + shiftedEndingStart}
          durationInFrames={endingDuration}
          name="landscape-ending-screen"
        >
          <EndingScreen
            localFrame={frame - timelineOffset - shiftedEndingStart}
            durationFrames={endingDuration}
            ending={ending}
          />
        </Sequence>
      ) : null}
      {shouldShowEnding && ending?.audio ? (
        <Sequence
          from={
            timelineOffset +
            getTimelineFrameWithCutIns(endingStart, cutIns)
          }
          durationInFrames={endingDuration}
          layout="none"
          name={`landscape-ending-audio-${getFileName(ending.audio)}`}
        >
          <SafeAudio path={getLongAudioAssetPath(ending.audio)} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
