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
import shortNewsData from "../public/data/short-news.json";

type ShortNewsObjectFit = "cover" | "contain" | "fill";
type ShortNewsObjectPosition = "center" | "top" | "bottom" | "left" | "right";
type ShortNewsOverflow = "hidden" | "visible";
type CharacterExpression = "normal" | "happy" | "serious" | "thinking";

type ShortNewsSlideImage = {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity?: number;
  rotate?: number;
  zIndex?: number;
};

type ShortNewsSlideImageStyle = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  objectFit?: ShortNewsObjectFit;
  objectPosition?: ShortNewsObjectPosition;
  borderRadius?: number;
};

type ShortNewsTextStyle = {
  x?: number;
  y?: number;
  width?: number;
  fontSize?: number;
  lineHeight?: number;
  textAlign?: "left" | "center" | "right";
  color?: string;
  zIndex?: number;
};

type ShortNewsCaptionStyle = {
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

type ShortNewsSlideStyle = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  borderRadius?: number;
  overflow?: ShortNewsOverflow;
  zIndex?: number;
};

type ShortNewsSlideFrameStyle = ShortNewsSlideStyle;

type ShortNewsEndingStyle = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fontSize?: number;
  lineHeight?: number;
  textAlign?: "left" | "center" | "right";
  color?: string;
  backgroundColor?: string;
  zIndex?: number;
};

type ShortNewsEnding = {
  enabled?: boolean;
  text?: string;
  audio?: string;
  audioPath?: string;
  audioFile?: string;
  audioDurationFrames?: number;
  style?: ShortNewsEndingStyle;
};

type ShortNewsSlideInnerImage = {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  objectFit?: ShortNewsObjectFit;
  objectPosition?: ShortNewsObjectPosition;
  opacity?: number;
  rotate?: number;
  borderRadius?: number;
  zIndex?: number;
};

type ShortNewsTimedSlide = {
  src: string;
  start: number;
  duration: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  objectFit?: ShortNewsObjectFit;
  objectPosition?: ShortNewsObjectPosition;
  opacity?: number;
  borderRadius?: number;
  zIndex?: number;
};

type ShortNewsSlide = {
  text: string;
  caption: string;
  captions?: TimedCaption[];
  characterExpression?: CharacterExpression;
  character?: string;
  characterImage?: string;
  audio?: string;
  audioPath?: string;
  audioFile?: string;
  audioDurationFrames?: number;
  characterDurationFrames?: number;
  characterDurationSeconds?: number;
  slideImage?: string;
  slideImageStyle?: ShortNewsSlideImageStyle;
  textStyle?: ShortNewsTextStyle;
  captionStyle?: ShortNewsCaptionStyle;
  slideStyle?: ShortNewsSlideStyle;
  slideFrameStyle?: ShortNewsSlideFrameStyle;
  slideImages?: ShortNewsSlideInnerImage[];
  slides?: ShortNewsTimedSlide[];
  images?: ShortNewsSlideImage[];
};

type ComputedShortNewsSlide = ShortNewsSlide & {
  computedStartFrame: number;
  computedDurationFrames: number;
};

type ShortNewsData = {
  title: string;
  topic: string;
  ending?: ShortNewsEnding;
  slides: ShortNewsSlide[];
};

export type ShortNewsVideoProps = {
  news?: ShortNewsData;
};

type AssetStatus = {
  exists: boolean;
  src: string;
};

const shortNews = shortNewsData as ShortNewsData;
const fps = 30;
const shortSlideBasePath = "slides/shorts";
const endingLogoPath = "assets/haruka-news-logo.png";
const endingLightLines = [
  { top: 160, width: 760, delay: 0, rotate: -18, opacity: 0.42 },
  { top: 410, width: 620, delay: 0.18, rotate: -9, opacity: 0.34 },
  { top: 760, width: 820, delay: 0.32, rotate: -15, opacity: 0.3 },
  { top: 1130, width: 700, delay: 0.48, rotate: -7, opacity: 0.26 },
  { top: 1480, width: 560, delay: 0.62, rotate: -13, opacity: 0.22 },
];
const endingStars = [
  { left: 126, top: 210, size: 8, delay: 0.08 },
  { left: 834, top: 286, size: 6, delay: 0.22 },
  { left: 260, top: 610, size: 5, delay: 0.36 },
  { left: 914, top: 724, size: 9, delay: 0.5 },
  { left: 128, top: 1048, size: 5, delay: 0.64 },
  { left: 760, top: 1196, size: 7, delay: 0.78 },
  { left: 420, top: 1440, size: 6, delay: 0.92 },
];
const newsTheme = {
  sky: "#dff5ff",
  skyLight: "#f8fdff",
  blue: "#123b63",
  blueAccent: "#145d99",
  brown: "#7a3f17",
};
const getSlideAssetPath = (path: string) => {
  const normalized = normalizePublicPath(path);

  if (normalized.startsWith("slides/")) {
    return normalized;
  }

  if (normalized.startsWith("shorts/")) {
    return `slides/${normalized}`;
  }

  if (normalized.includes("/")) {
    return normalized;
  }

  return `${shortSlideBasePath}/${normalized}`;
};
const getCharacterImagePath = (slide: ShortNewsSlide) =>
  getCharacterAssetPath(
    slide.characterImage ?? slide.character ?? slide.characterExpression,
  );
const getShortAudioAssetPath = (path: string) => {
  const normalized = normalizePublicPath(path);

  if (normalized.startsWith("audio/shorts/")) {
    return normalized;
  }

  if (!normalized.includes("/")) {
    return `audio/shorts/${normalized}`;
  }

  if (normalized.startsWith("shorts/")) {
    return `audio/${normalized}`;
  }

  throw new Error(
    `ショート動画の音声は public/audio/shorts/ 配下を指定してください: ${path}`,
  );
};
const getAudioPath = (
  audioConfig:
    | { audio?: string; audioPath?: string; audioFile?: string }
    | undefined,
) => {
  const path =
    audioConfig?.audio ?? audioConfig?.audioPath ?? audioConfig?.audioFile;

  return path ? getShortAudioAssetPath(path) : undefined;
};
const getSlideDurationFrames = (slide: ShortNewsSlide) =>
  Math.max(1, slide.audioDurationFrames ?? 8 * fps);
const getComputedSlides = (
  slides: ShortNewsSlide[],
): ComputedShortNewsSlide[] => {
  let cursor = 0;

  return slides.map((slide) => {
    const computedDurationFrames = getSlideDurationFrames(slide);
    const computedSlide = {
      ...slide,
      computedStartFrame: cursor,
      computedDurationFrames,
    };

    cursor += computedDurationFrames;

    return computedSlide;
  });
};
const getSlidesEndFrame = (slides: ComputedShortNewsSlide[]) =>
  slides.length === 0
    ? 0
    : Math.max(
        ...slides.map(
          (slide) => slide.computedStartFrame + slide.computedDurationFrames,
        ),
      );

const HighlightedNewsText = ({ text }: { text: string }) => {
  const parts = text.split(/(\d+億人|\d+万人|\d+人|\d+億|\d+万)/g);

  return (
    <>
      {parts.map((part, index) => {
        const isHighlight = /\d+(億人|万人|人|億|万)/.test(part);

        return (
          <span
            key={`${part}-${index}`}
            style={{
              color: isHighlight ? newsTheme.brown : "inherit",
            }}
          >
            {part}
          </span>
        );
      })}
    </>
  );
};

// fps=30: 3秒=90フレーム、5秒=150フレーム、10秒=300フレーム。
const getEndingTiming = (
  ending: ShortNewsEnding | undefined,
  slidesEndFrame: number,
) => {
  const startFrame = slidesEndFrame;
  const durationFrames = ending?.audioDurationFrames ?? 3 * fps;

  return {
    startFrame,
    durationFrames: Math.max(1, durationFrames),
  };
};

const getTotalFrames = (currentNews: ShortNewsData) => {
  const computedSlides = getComputedSlides(currentNews.slides ?? []);
  const slidesEnd = getSlidesEndFrame(computedSlides);
  const ending = currentNews.ending;

  if (ending?.enabled === false) {
    return Math.max(1, slidesEnd);
  }

  const endingTiming = getEndingTiming(ending, slidesEnd);
  const endingEnd = ending
    ? endingTiming.startFrame + endingTiming.durationFrames
    : slidesEnd;

  return Math.max(1, slidesEnd, endingEnd);
};

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
      `ショート動画の音声ファイルが読み込めません: public/${audioPath}. ` +
        `short-news.json の audio / audioPath / audioFile と public/audio/shorts/ のwavファイル名を確認してください。` +
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

export const resolveShortNewsAudioDurations = async (
  currentNews: ShortNewsData,
): Promise<ShortNewsData> => ({
  ...currentNews,
  ending: currentNews.ending
    ? await resolveAudioTiming(currentNews.ending)
    : currentNews.ending,
  slides: currentNews.slides
    ? await Promise.all(currentNews.slides.map(resolveAudioTiming))
    : currentNews.slides,
});

const ShortsBackground = () => {
  return (
    <AbsoluteFill style={{ zIndex: 0 }}>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, #fafdff 0%, #eaf8ff 42%, #dff5ff 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 35%, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0) 52%)",
        }}
      />
    </AbsoluteFill>
  );
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

const SafeSlideImage = ({
  path,
  style,
  durationInFrames,
}: {
  path: string;
  style: CSSProperties;
  durationInFrames?: number;
}) => {
  const { exists, src } = usePublicAsset(path);

  if (!exists) {
    return null;
  }

  return <Img src={src} style={style} durationInFrames={durationInFrames} />;
};

const SafeCharacterImage = ({
  path,
  style,
  durationInFrames,
}: {
  path: string;
  style: CSSProperties;
  durationInFrames: number;
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

  return <Img src={src} style={style} durationInFrames={durationInFrames} />;
};

const EndingScreen = ({
  localFrame,
  durationFrames,
  ending,
}: {
  localFrame: number;
  durationFrames: number;
  ending?: ShortNewsEnding;
}) => {
  const safeDuration = Math.max(1, durationFrames);
  const introEnd = Math.max(1, Math.floor(safeDuration * 0.2));
  const ctaStart = Math.max(1, Math.floor(safeDuration * 0.36));
  const ctaEnd = Math.max(ctaStart + 1, Math.floor(safeDuration * 0.52));
  const exitStart = Math.max(1, Math.floor(safeDuration * 0.86));
  const introOpacity = interpolate(localFrame, [0, introEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitOpacity = interpolate(
    localFrame,
    [exitStart, safeDuration],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const opacity = Math.min(introOpacity, exitOpacity);
  const logoScale = interpolate(localFrame, [0, introEnd], [1.2, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const logoLift = interpolate(localFrame, [0, introEnd], [58, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const logoGlow = 0.72 + Math.sin(localFrame / 12) * 0.14;
  const ctaOpacity = interpolate(localFrame, [ctaStart, ctaEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctaY = interpolate(localFrame, [ctaStart, ctaEnd], [28, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const motionProgress = localFrame / safeDuration;

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(180deg, #fafdff 0%, #dff5ff 38%, #bfdff5 100%)",
        opacity,
        overflow: "hidden",
        color: newsTheme.blue,
        zIndex: ending?.style?.zIndex ?? 100,
      }}
    >
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 34%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.36) 34%, rgba(255,255,255,0) 68%)",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(135deg, rgba(20,93,153,0.16) 0%, rgba(255,255,255,0) 44%, rgba(122,63,23,0.18) 100%)",
        }}
      />
      {endingLightLines.map((line, index) => {
        const travel = ((motionProgress + line.delay) % 1) * 1560 - 300;

        return (
          <div
            key={`ending-light-${index}`}
            style={{
              position: "absolute",
              left: travel,
              top: line.top,
              width: line.width,
              height: 5,
              borderRadius: 999,
              background:
                "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.92) 28%, rgba(20,93,153,0.64) 58%, rgba(122,63,23,0.48) 76%, rgba(255,255,255,0) 100%)",
              opacity: line.opacity,
              transform: `rotate(${line.rotate}deg)`,
              filter: "blur(0.4px)",
            }}
          />
        );
      })}
      {endingStars.map((star, index) => {
        const twinkle = 0.46 + Math.sin(localFrame / 10 + index * 0.9) * 0.28;

        return (
          <div
            key={`ending-star-${index}`}
            style={{
              position: "absolute",
              left:
                star.left +
                Math.sin(motionProgress * Math.PI * 2 + star.delay) * 18,
              top:
                star.top +
                Math.cos(motionProgress * Math.PI * 2 + star.delay) * 14,
              width: star.size,
              height: star.size,
              backgroundColor: index % 3 === 0 ? "#c28a5a" : "#ffffff",
              opacity: twinkle,
              transform: "rotate(45deg)",
              boxShadow: "0 0 14px rgba(255,255,255,0.72)",
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          left: 120,
          right: 120,
          top: 304,
          height: 640,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `translateY(${logoLift}px) scale(${logoScale})`,
          filter: `drop-shadow(0 0 22px rgba(255,255,255,${logoGlow})) drop-shadow(0 20px 38px rgba(18,59,99,0.26))`,
        }}
      >
        <div
          style={{
            width: "min(920px, 100%)",
            maxHeight: 520,
            padding: 14,
            borderRadius: 28,
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.82) 0%, rgba(223,245,255,0.58) 58%, rgba(255,255,255,0.72) 100%)",
            border: `4px solid rgba(122,63,23,0.38)`,
            boxShadow:
              "inset 0 0 0 2px rgba(255,255,255,0.78), 0 26px 58px rgba(18,59,99,0.18)",
          }}
        >
          <Img
            src={staticFile(endingLogoPath)}
            style={{
              width: "100%",
              height: "100%",
              maxHeight: 492,
              objectFit: "contain",
              borderRadius: 20,
            }}
          />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 120,
          right: 120,
          bottom: 292,
          textAlign: "center",
          opacity: ctaOpacity,
          transform: `translateY(${ctaY}px)`,
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "20px 34px 24px",
            borderTop: `4px solid ${newsTheme.brown}`,
            borderBottom: `4px solid ${newsTheme.brown}`,
            color: newsTheme.blue,
            fontSize: 54,
            lineHeight: 1.24,
            fontWeight: 950,
            letterSpacing: 0,
            textShadow: "0 3px 0 rgba(255,255,255,0.92)",
          }}
        >
          ご視聴ありがとうございました
        </div>
        <div
          style={{
            marginTop: 24,
            color: newsTheme.blueAccent,
            fontSize: 34,
            lineHeight: 1.2,
            fontWeight: 900,
            textShadow: "0 2px 0 rgba(255,255,255,0.9)",
          }}
        >
          チャンネル登録・高評価お願いします
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 118,
          right: 118,
          bottom: 190,
          height: 6,
          background: `linear-gradient(90deg, rgba(255,255,255,0) 0%, ${newsTheme.brown} 20%, ${newsTheme.blueAccent} 50%, ${newsTheme.brown} 80%, rgba(255,255,255,0) 100%)`,
          opacity: 0.7,
        }}
      />
    </AbsoluteFill>
  );
};

const CharacterShadow = () => {
  return (
    <div
      style={{
        position: "absolute",
        left: 305,
        right: 305,
        bottom: 86,
        height: 54,
        borderRadius: "50%",
        backgroundColor: "rgba(18,59,99,0.12)",
        filter: "blur(8px)",
        zIndex: 35,
      }}
    />
  );
};

const CharacterPlaceholder = () => {
  return (
    <div
      style={{
        position: "absolute",
        left: 140,
        right: 140,
        bottom: 76,
        height: 650,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 40,
      }}
    >
      <div
        style={{
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: newsTheme.skyLight,
          border: `8px solid ${newsTheme.brown}`,
          boxShadow: "0 18px 34px rgba(18,59,99,0.16)",
          color: newsTheme.blue,
          fontSize: 58,
          fontWeight: 900,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        AIキャラ
      </div>
    </div>
  );
};

const CharacterImage = ({
  imagePath,
  localFrame,
  durationFrames,
}: {
  imagePath: string;
  localFrame: number;
  durationFrames: number;
}) => {
  const fadeIn = 1;
  const enter = interpolate(localFrame, [0, 24], [90, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const float = Math.sin(localFrame / 22) * 10;

  return (
    <div
      style={{
        position: "absolute",
        left: 140,
        right: 140,
        bottom: 76,
        height: 650,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        transform: `translateY(${enter + float}px)`,
      }}
    >
      <SafeCharacterImage
        path={imagePath}
        durationInFrames={durationFrames}
        style={{
          maxWidth: 760,
          maxHeight: 650,
          objectFit: "contain",
          opacity: fadeIn,
          filter: "drop-shadow(0 20px 28px rgba(18,59,99,0.22))",
          translate: "-6.3px 118.7px",
        }}
      />
    </div>
  );
};

const SlideImages = ({
  images,
  durationFrames,
}: {
  images?: ShortNewsSlideImage[];
  durationFrames: number;
}) => {
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <>
      {images.map((image, index) => (
        <SafeSlideImage
          key={`${image.src}-${index}`}
          path={getSlideAssetPath(image.src)}
          durationInFrames={durationFrames}
          style={{
            position: "absolute",
            left: image.x,
            top: image.y,
            width: image.width,
            height: image.height,
            objectFit: "contain",
            opacity: image.opacity ?? 1,
            transform: `rotate(${image.rotate ?? 0}deg)`,
            zIndex: image.zIndex ?? 1,
            filter: "drop-shadow(0 12px 18px rgba(18,59,99,0.16))",
          }}
        />
      ))}
    </>
  );
};

const SlideInnerImages = ({
  images,
  durationFrames,
}: {
  images?: ShortNewsSlideInnerImage[];
  durationFrames: number;
}) => {
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <>
      {images.map((image, index) => (
        <SafeSlideImage
          key={`${image.src}-${index}`}
          path={getSlideAssetPath(image.src)}
          durationInFrames={durationFrames}
          style={{
            position: "absolute",
            left: image.x,
            top: image.y,
            width: image.width,
            height: image.height,
            objectFit: image.objectFit ?? "contain",
            objectPosition: image.objectPosition ?? "center",
            opacity: image.opacity ?? 1,
            borderRadius: image.borderRadius ?? 0,
            transform: `rotate(${image.rotate ?? 0}deg)`,
            zIndex: image.zIndex ?? 1,
          }}
        />
      ))}
    </>
  );
};

const TimedSlideImages = ({
  slides,
  frameStyle,
  durationFrames,
}: {
  slides: ShortNewsTimedSlide[];
  frameStyle?: ShortNewsSlideFrameStyle;
  durationFrames: number;
}) => {
  return (
    <>
      {slides.map((slide, index) => {
        const shouldFillScene = slides.length === 1;
        const from = shouldFillScene ? 0 : Math.round(slide.start * fps);
        const durationInFrames = shouldFillScene
          ? durationFrames
          : Math.max(1, Math.round(slide.duration * fps));
        const x = frameStyle?.x ?? slide.x ?? 58;
        const y = frameStyle?.y ?? slide.y ?? 470;
        const width = frameStyle?.width ?? slide.width ?? 964;
        const height = frameStyle?.height ?? slide.height ?? 300;
        const borderRadius =
          frameStyle?.borderRadius ?? slide.borderRadius ?? 0;
        const overflow = frameStyle?.overflow ?? "hidden";
        const zIndex = frameStyle?.zIndex ?? slide.zIndex ?? 10;

        return (
          <Sequence
            key={`timed-slide-${index}-${slide.src}`}
            from={from}
            durationInFrames={durationInFrames}
            name={`timed-slide-${index + 1}-${getFileName(slide.src)}`}
            layout="none"
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
                opacity: slide.opacity ?? 1,
                zIndex,
                border: `5px solid ${newsTheme.brown}`,
                boxSizing: "border-box",
                backgroundColor: "rgba(255,255,255,0.68)",
                boxShadow: "0 14px 28px rgba(18,59,99,0.13)",
              }}
            >
              <SafeSlideImage
                path={getSlideAssetPath(slide.src)}
                durationInFrames={durationInFrames}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: slide.objectFit ?? "contain",
                  objectPosition: slide.objectPosition ?? "center",
                }}
              />
            </section>
          </Sequence>
        );
      })}
    </>
  );
};

const SlideCard = ({
  enter,
  slide,
  durationFrames,
}: {
  enter: number;
  slide: ShortNewsSlide;
  durationFrames: number;
}) => {
  if (slide.slides && slide.slides.length > 0) {
    return (
      <TimedSlideImages
        slides={slide.slides}
        frameStyle={slide.slideFrameStyle ?? slide.slideStyle}
        durationFrames={durationFrames}
      />
    );
  }

  const style = slide.slideStyle;
  const imageStyle = slide.slideImageStyle;
  const x = style?.x ?? imageStyle?.x ?? 58;
  const y = style?.y ?? imageStyle?.y ?? 470;
  const width = style?.width ?? imageStyle?.width ?? 964;
  const height = style?.height ?? imageStyle?.height ?? 300;
  const borderRadius = style?.borderRadius ?? imageStyle?.borderRadius ?? 0;
  const overflow = style?.overflow ?? "hidden";
  const zIndex = style?.zIndex ?? 2;
  const hasCustomSlideContent =
    Boolean(slide.slideImage) ||
    Boolean(slide.slideImages && slide.slideImages.length > 0);

  if (hasCustomSlideContent) {
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
          border: `5px solid ${newsTheme.brown}`,
          boxSizing: "border-box",
          backgroundColor: "rgba(255,255,255,0.72)",
          boxShadow: "0 14px 28px rgba(18,59,99,0.13)",
          opacity: enter,
          transform: `translateY(${interpolate(enter, [0, 1], [34, 0])}px)`,
        }}
      >
        {slide.slideImage ? (
          <SafeSlideImage
            path={getSlideAssetPath(slide.slideImage)}
            durationInFrames={durationFrames}
            style={{
              width: "100%",
              height: "100%",
              objectFit: imageStyle?.objectFit ?? "contain",
              objectPosition: imageStyle?.objectPosition ?? "center",
            }}
          />
        ) : null}
        <SlideInnerImages
          images={slide.slideImages}
          durationFrames={durationFrames}
        />
      </section>
    );
  }

  return (
    <section
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        zIndex,
        padding: "42px 46px",
        borderRadius,
        overflow,
        backgroundColor: "rgba(255,255,255,0.84)",
        color: newsTheme.blue,
        border: `5px solid ${newsTheme.brown}`,
        boxSizing: "border-box",
        boxShadow: "0 14px 28px rgba(18,59,99,0.13)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [34, 0])}px)`,
      }}
    >
      <div
        style={{
          fontSize: 54,
          lineHeight: 1.34,
          fontWeight: 900,
          textAlign: "center",
          textShadow: "none",
        }}
      >
        {slide.text}
      </div>
    </section>
  );
};

const SlideText = ({
  localFrame,
  slide,
  durationFrames,
}: {
  localFrame: number;
  slide: ShortNewsSlide;
  durationFrames: number;
}) => {
  const enter = interpolate(localFrame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const textStyle = slide.textStyle;
  const captionStyle = slide.captionStyle;
  const captionWidth = textStyle?.width ?? captionStyle?.width;
  const captionBorderWidth = captionStyle?.borderWidth ?? 5;
  const captionBorderColor = newsTheme.brown;
  const timedCaption = getActiveTimedCaption(slide.captions, localFrame);
  const captionText = timedCaption?.text ?? slide.caption;
  const captionOpacity = getTimedCaptionOpacity(timedCaption, localFrame);

  return (
    <>
      <SlideCard enter={enter} slide={slide} durationFrames={durationFrames} />
      <section
        style={{
          position: "absolute",
          left: textStyle?.x ?? captionStyle?.x ?? 58,
          top: textStyle?.y ?? captionStyle?.y ?? 820,
          width: captionWidth,
          right: captionWidth === undefined ? 58 : undefined,
          height: captionStyle?.height,
          minHeight: captionStyle?.height === undefined ? 210 : undefined,
          zIndex: textStyle?.zIndex ?? captionStyle?.zIndex ?? 20,
          boxSizing: "border-box",
          padding: captionStyle?.padding ?? "36px 42px",
          borderRadius: 0,
          background: "rgba(255,255,255,0.9)",
          border: `${captionBorderWidth}px solid ${captionBorderColor}`,
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
            color: textStyle?.color ?? captionStyle?.color ?? newsTheme.blue,
            fontSize: textStyle?.fontSize ?? captionStyle?.fontSize ?? 72,
            lineHeight:
              textStyle?.lineHeight ?? captionStyle?.lineHeight ?? 1.18,
            fontWeight: 950,
            textAlign:
              textStyle?.textAlign ?? captionStyle?.textAlign ?? "center",
            textShadow: "none",
            opacity: captionOpacity,
            whiteSpace: "pre-wrap",
            overflowWrap: "break-word",
          }}
        >
          {captionText}
        </div>
      </section>
    </>
  );
};

export const SHORT_NEWS_DURATION_IN_FRAMES = getTotalFrames(shortNews);

export const calculateShortNewsMetadata: CalculateMetadataFunction<
  ShortNewsVideoProps
> = async () => {
  const resolvedNews = await resolveShortNewsAudioDurations(shortNews);

  return {
    durationInFrames: getTotalFrames(resolvedNews),
    props: {
      news: resolvedNews,
    },
  };
};

export const ShortNewsVideo = ({ news = shortNews }: ShortNewsVideoProps) => {
  const frame = useCurrentFrame();
  const slides = getComputedSlides(news.slides.length > 0 ? news.slides : []);
  const slidesEnd = getSlidesEndFrame(slides);
  const titleProgress = interpolate(frame, [0, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const ending = news.ending;
  const shouldShowEnding = ending?.enabled ?? true;
  const endingTiming = getEndingTiming(ending, slidesEnd);
  const endingLocalFrame = frame - endingTiming.startFrame;
  const mainContentOpacity = shouldShowEnding
    ? interpolate(endingLocalFrame, [0, endingTiming.durationFrames], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: newsTheme.sky,
        color: newsTheme.blue,
        overflow: "hidden",
        fontFamily:
          "'Yu Gothic', 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif",
      }}
    >
      <AbsoluteFill style={{ opacity: mainContentOpacity }}>
        <ShortsBackground />
        <AbsoluteFill
          style={{
            border: `5px solid ${newsTheme.brown}`,
            boxSizing: "border-box",
            zIndex: 25,
            pointerEvents: "none",
          }}
        />
        <header
          style={{
            position: "absolute",
            top: 86,
            left: 64,
            right: 64,
            zIndex: 30,
            opacity: titleProgress,
            transform: `translateY(${interpolate(titleProgress, [0, 1], [-34, 0])}px)`,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 16,
              maxWidth: "100%",
              padding: "16px 30px 18px 24px",
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(231,248,255,0.94) 54%, rgba(190,230,255,0.88) 100%)",
              border: `3px solid ${newsTheme.brown}`,
              borderRadius: 26,
              boxShadow:
                "0 12px 26px rgba(20,93,153,0.15), inset 0 0 0 2px rgba(255,255,255,0.82)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at 18% 18%, rgba(255,255,255,0.86) 0%, rgba(255,255,255,0) 34%), radial-gradient(circle at 92% 12%, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0) 28%)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 64,
                top: 12,
                width: 12,
                height: 12,
                backgroundColor: "rgba(255,255,255,0.92)",
                transform: "rotate(45deg)",
                boxShadow:
                  "172px 12px 0 rgba(255,255,255,0.72), 242px -2px 0 rgba(20,93,153,0.18)",
              }}
            />
            <div
              style={{
                width: 72,
                height: 58,
                flexShrink: 0,
                position: "relative",
                zIndex: 1,
                overflow: "hidden",
                borderRadius: 14,
              }}
            >
              <Img
                src={staticFile("branding/haruka-star-arrow.png")}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 1,
                  width: 72,
                  height: 56,
                  objectFit: "contain",
                  filter: "drop-shadow(0 4px 6px rgba(18,59,99,0.16))",
                }}
                durationInFrames={1275}
              />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 18,
                minWidth: 0,
                position: "relative",
                zIndex: 1,
              }}
            >
              <span
                style={{
                  color: newsTheme.blueAccent,
                  fontSize: 52,
                  lineHeight: 1,
                  fontWeight: 950,
                  textShadow: "0 3px 0 rgba(255,255,255,0.96)",
                  whiteSpace: "nowrap",
                }}
              >
                ハルカニュース
              </span>
              <span
                style={{
                  color: newsTheme.blueAccent,
                  fontSize: 32,
                  lineHeight: 1,
                  fontWeight: 950,
                  letterSpacing: 0,
                  textShadow: "0 2px 0 rgba(255,255,255,0.96)",
                  whiteSpace: "nowrap",
                }}
              >
                SHORTS
              </span>
            </div>
            <div
              style={{
                position: "absolute",
                left: 104,
                right: 30,
                bottom: 9,
                height: 6,
                borderRadius: 999,
                background:
                  "linear-gradient(90deg, rgba(20,93,153,0.24) 0%, rgba(20,93,153,0.84) 58%, rgba(126,202,248,0.2) 100%)",
                zIndex: 1,
              }}
            />
          </div>
          <h1
            style={{
              margin: "28px 0 0",
              fontSize: 76,
              lineHeight: 1.12,
              fontWeight: 950,
              color: newsTheme.blue,
              textShadow: "none",
            }}
          >
            <HighlightedNewsText text={news.title} />
          </h1>
        </header>
        <CharacterShadow />
        {slides.map((slide, index) => {
          const from = slide.computedStartFrame;
          const duration = slide.computedDurationFrames;
          const characterImagePath = getCharacterImagePath(slide);
          const characterFileName = getFileName(characterImagePath);

          return (
            <Sequence
              key={`visual-${index}-${slide.caption}`}
              from={from}
              durationInFrames={duration}
              name={`visual-slide-${index + 1}`}
            >
              <SlideText
                localFrame={frame - from}
                slide={slide}
                durationFrames={duration}
              />
              <SlideImages images={slide.images} durationFrames={duration} />
              <Sequence
                key={`character-${index}-${characterFileName}`}
                name={`character-${index + 1}-${characterFileName}`}
                layout="none"
                durationInFrames={duration}
              >
                <CharacterImage
                  imagePath={characterImagePath}
                  localFrame={frame - from}
                  durationFrames={duration}
                />
              </Sequence>
            </Sequence>
          );
        })}
        {slides.length === 0 ? <CharacterPlaceholder /> : null}
      </AbsoluteFill>
      {slides.map((slide, index) => {
        const audioPath = getAudioPath(slide);

        if (!audioPath) {
          return null;
        }

        const audioFrom = slide.computedStartFrame;
        const audioFileName = getFileName(audioPath);

        return (
          <Sequence
            key={`audio-${index}-${audioPath}`}
            from={audioFrom}
            name={`audio-${index + 1}-${audioFileName}`}
            layout="none"
            durationInFrames={slide.computedDurationFrames}
          >
            <SafeAudio path={audioPath} />
          </Sequence>
        );
      })}
      {shouldShowEnding ? (
        <Sequence
          from={endingTiming.startFrame}
          durationInFrames={endingTiming.durationFrames}
          name="ending-screen"
        >
          <EndingScreen
            localFrame={frame - endingTiming.startFrame}
            durationFrames={endingTiming.durationFrames}
            ending={ending}
          />
        </Sequence>
      ) : null}
      {shouldShowEnding && ending
        ? (() => {
            const endingAudioPath = getAudioPath(ending);

            return endingAudioPath ? (
              <Sequence
                from={endingTiming.startFrame}
                durationInFrames={endingTiming.durationFrames}
                name={`ending-audio-${getFileName(endingAudioPath)}`}
                layout="none"
              >
                <SafeAudio path={endingAudioPath} />
              </Sequence>
            ) : null;
          })()
        : null}
    </AbsoluteFill>
  );
};
