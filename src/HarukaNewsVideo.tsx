import { type CSSProperties, useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  Audio,
  continueRender,
  delayRender,
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import newsData from "./data/news.json";

type ObjectFit = "cover" | "contain" | "fill";
type ObjectPosition = "center" | "top" | "bottom" | "left" | "right";
type Overflow = "hidden" | "visible";
type CharacterExpression = "normal" | "happy" | "serious" | "thinking";
type CharacterImageName =
  | "normal-1.png"
  | "normal-2.png"
  | "happy-1.png"
  | "happy-2.png"
  | "serious-1.png"
  | "serious-2.png"
  | "thinking-1.png"
  | "thinking-2.png";

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
  text?: string;
  caption?: string;
  subtitle?: string;
  characterExpression?: CharacterExpression;
  expression?: CharacterExpression;
  character?: string;
  characterImage?: string;
  audio?: string;
  startFrame?: number;
  durationFrames?: number;
  durationSeconds?: number;
  characterDurationFrames?: number;
  characterDurationSeconds?: number;
  audioStartFrame?: number;
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

type Ending = {
  enabled?: boolean;
  startFrame?: number;
  durationFrames?: number;
  text?: string;
  audio?: string;
  audioStartFrame?: number;
  style?: TextStyle;
};

type LegacyTopic = {
  title: string;
  category?: string;
  durationSeconds: number;
  expression?: CharacterExpression;
  summary?: string;
  bullets?: string[];
  telop?: string;
};

type NewsData = {
  title?: string;
  programTitle?: string;
  dateLabel?: string;
  anchorName?: string;
  audio?: string;
  opening?: {
    headline?: string;
    subtitle?: string;
  };
  ending?: Ending;
  slides?: NewsSlide[];
  topics?: LegacyTopic[];
};

type AssetStatus = {
  exists: boolean;
  src: string;
};

const news = newsData as NewsData;
const fps = 30;
const theme = {
  sky: "#dff5ff",
  skyLight: "#f8fdff",
  blue: "#123b63",
  blueAccent: "#145d99",
  brown: "#7a3f17",
};
const characterBasePath = "/characters/ryunosuke";
const defaultCharacterImage: CharacterImageName = "normal-1.png";
const availableCharacterImages = new Set<CharacterImageName>([
  "normal-1.png",
  "normal-2.png",
  "happy-1.png",
  "happy-2.png",
  "serious-1.png",
  "serious-2.png",
  "thinking-1.png",
  "thinking-2.png",
]);

const normalizePublicPath = (path: string) => path.replace(/^\/+/, "");
const getSlideAssetPath = (path: string) => {
  const normalized = normalizePublicPath(path);

  if (normalized.includes("/")) {
    return normalized;
  }

  return `slides/${normalized}`;
};
const getFileName = (path: string) => path.split("/").pop() ?? path;
const normalizeCharacterImageName = (imageName: string | undefined) => {
  if (!imageName) {
    return defaultCharacterImage;
  }

  const rawFileName = getFileName(imageName);
  const baseName = rawFileName.endsWith(".png")
    ? rawFileName.replace(/\.png$/, "")
    : rawFileName;
  const normalizedBaseName = baseName.includes("-")
    ? baseName
    : `${baseName}-1`;
  const fileName = `${normalizedBaseName}.png`;

  if (availableCharacterImages.has(fileName as CharacterImageName)) {
    return fileName as CharacterImageName;
  }

  return defaultCharacterImage;
};
const getCharacterImagePath = (slide: NewsSlide) =>
  `${characterBasePath}/${normalizeCharacterImageName(
    slide.characterImage ?? slide.character ?? slide.characterExpression,
  )}`;

const legacyTopicsToSlides = (topics: LegacyTopic[] | undefined): NewsSlide[] =>
  (topics ?? []).map((topic, index) => ({
    text: [
      topic.summary,
      ...(topic.bullets ?? []).map((bullet) => `・${bullet}`),
    ]
      .filter(Boolean)
      .join("\n"),
    caption: topic.telop ?? topic.title,
    characterExpression: topic.expression ?? "normal",
    character: topic.expression ?? "normal-1",
    startFrame: undefined,
    durationFrames: Math.round(topic.durationSeconds * fps),
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

const slides =
  news.slides && news.slides.length > 0
    ? news.slides
    : legacyTopicsToSlides(news.topics);

const getSlideDuration = (slide: NewsSlide) =>
  Math.max(
    1,
    slide.durationFrames ??
      (slide.durationSeconds !== undefined
        ? Math.round(slide.durationSeconds * fps)
        : 8 * fps),
  );

const getTotalFrames = () => {
  const slideEnd =
    slides.length === 0
      ? 12 * fps
      : Math.max(
          ...slides.map((slide, index) => {
            const from =
              slide.startFrame ??
              slides
                .slice(0, index)
                .reduce((total, current) => total + getSlideDuration(current), 0);
            return from + getSlideDuration(slide);
          }),
        );
  const ending = news.ending;
  const endingEnd =
    ending?.enabled === false
      ? 0
      : (ending?.startFrame ?? slideEnd) + (ending?.durationFrames ?? 0);

  return Math.max(slideEnd, endingEnd, 1);
};

export const HARUKA_NEWS_DURATION_IN_FRAMES = getTotalFrames();

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
      <SafeImage
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
      {!slide.slideImage && bodyText ? (
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
          {bodyText}
        </div>
      ) : null}
    </section>
  );
};

const Caption = ({ slide, enter }: { slide: NewsSlide; enter: number }) => {
  const textStyle = slide.textStyle;
  const captionStyle = slide.captionStyle;
  const width = textStyle?.width ?? captionStyle?.width ?? 1120;
  const x = textStyle?.x ?? captionStyle?.x ?? 650;
  const y = textStyle?.y ?? captionStyle?.y ?? 820;
  const height = textStyle?.height ?? captionStyle?.height ?? 150;
  const borderWidth = captionStyle?.borderWidth ?? 5;
  const borderColor = captionStyle?.borderColor ?? theme.brown;

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
        }}
      >
        {slide.caption ?? slide.subtitle ?? ""}
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
      <Caption slide={slide} enter={enter} />
      <Character slide={slide} localFrame={frame} />
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
        {ending?.text ?? "ハルカニュース"}
      </div>
    </AbsoluteFill>
  );
};

export const HarukaNewsVideo = () => {
  const frame = useCurrentFrame();
  let cursor = 0;
  const title = news.title ?? news.programTitle ?? "ハルカニュース";
  const ending = news.ending;
  const shouldShowEnding = ending?.enabled ?? Boolean(ending);
  const endingStart =
    ending?.startFrame ??
    slides.reduce((total, slide) => total + getSlideDuration(slide), 0);
  const endingDuration = ending?.durationFrames ?? 90;

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
        <HighlightedTitle text={title} />
      </h1>
      {news.audio ? <SafeAudio path={news.audio} /> : null}
      {slides.map((slide, index) => {
        const from = slide.startFrame ?? cursor;
        const duration = getSlideDuration(slide);
        cursor = from + duration;

        return (
          <Sequence
            key={`landscape-visual-${index}-${slide.caption ?? slide.text ?? ""}`}
            from={from}
            durationInFrames={duration}
            name={`landscape-slide-${index + 1}`}
          >
            <Scene slide={slide} />
          </Sequence>
        );
      })}
      {slides.map((slide, index) => {
        if (!slide.audio) {
          return null;
        }

        const visualFrom =
          slide.startFrame ??
          slides
            .slice(0, index)
            .reduce((total, current) => total + getSlideDuration(current), 0);
        const audioFrom = slide.audioStartFrame ?? visualFrom;

        return (
          <Sequence
            key={`landscape-audio-${index}-${slide.audio}`}
            from={audioFrom}
            durationInFrames={getSlideDuration(slide)}
            layout="none"
            name={`landscape-audio-${index + 1}-${getFileName(slide.audio)}`}
          >
            <SafeAudio path={slide.audio} />
          </Sequence>
        );
      })}
      {shouldShowEnding ? (
        <Sequence
          from={endingStart}
          durationInFrames={endingDuration}
          name="landscape-ending-screen"
        >
          <EndingScreen
            localFrame={frame - endingStart}
            durationFrames={endingDuration}
            ending={ending}
          />
        </Sequence>
      ) : null}
      {shouldShowEnding && ending?.audio ? (
        <Sequence
          from={ending.audioStartFrame ?? endingStart}
          durationInFrames={endingDuration}
          layout="none"
          name={`landscape-ending-audio-${getFileName(ending.audio)}`}
        >
          <SafeAudio path={ending.audio} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
