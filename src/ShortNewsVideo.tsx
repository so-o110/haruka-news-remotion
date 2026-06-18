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
  useVideoConfig,
} from "remotion";
import shortNewsData from "../public/data/short-news.json";

type ShortNewsObjectFit = "cover" | "contain" | "fill";
type ShortNewsObjectPosition = "center" | "top" | "bottom" | "left" | "right";
type ShortNewsOverflow = "hidden" | "visible";
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
  startFrame?: number;
  durationFrames?: number;
  text?: string;
  audio?: string;
  audioStartFrame?: number;
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
  characterExpression?: CharacterExpression;
  character?: string;
  characterImage?: string;
  audio: string;
  startFrame?: number;
  durationFrames?: number;
  characterDurationFrames?: number;
  characterDurationSeconds?: number;
  audioStartFrame?: number;
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

type ShortNewsData = {
  title: string;
  topic: string;
  ending?: ShortNewsEnding;
  slides: ShortNewsSlide[];
};

type AssetStatus = {
  exists: boolean;
  src: string;
};

const shortNews = shortNewsData as ShortNewsData;
const fps = 30;
const characterBasePath = "/characters/ryunosuke";
const defaultCharacterImage: CharacterImageName = "normal-1.png";
const newsTheme = {
  sky: "#dff5ff",
  skyLight: "#f8fdff",
  blue: "#123b63",
  blueAccent: "#145d99",
  brown: "#7a3f17",
};
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

  const fileName = getFileName(imageName).endsWith(".png")
    ? getFileName(imageName)
    : `${getFileName(imageName)}.png`;

  if (availableCharacterImages.has(fileName as CharacterImageName)) {
    return fileName as CharacterImageName;
  }

  return defaultCharacterImage;
};
const getCharacterImagePath = (slide: ShortNewsSlide) =>
  `${characterBasePath}/${normalizeCharacterImageName(
    slide.characterImage ?? slide.character,
  )}`;

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
  totalFrames: number,
) => {
  const fallbackStartFrame = 26 * fps;
  const startFrame = ending?.startFrame ?? fallbackStartFrame;
  const durationFrames =
    ending?.durationFrames ?? Math.max(1, totalFrames - startFrame);

  return {
    startFrame,
    durationFrames: Math.max(1, durationFrames),
  };
};

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

const EndingScreen = ({
  localFrame,
  durationFrames,
  ending,
}: {
  localFrame: number;
  durationFrames: number;
  ending?: ShortNewsEnding;
}) => {
  const style = ending?.style;
  const fadeFrames = Math.min(2 * fps, durationFrames);
  const opacity = interpolate(localFrame, [0, fadeFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: style?.backgroundColor ?? "rgba(248,253,255,0.94)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity,
        pointerEvents: "none",
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
          fontSize: style?.fontSize ?? 92,
          lineHeight: style?.lineHeight ?? 1.1,
          fontWeight: 950,
          color: newsTheme.blue,
          textAlign: style?.textAlign ?? "center",
          textShadow: "none",
        }}
      >
        {ending?.text ?? "ハルカニュース"}
      </div>
    </div>
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
}: {
  imagePath: string;
  localFrame: number;
}) => {
  const src = staticFile(normalizePublicPath(imagePath));
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
      <Img
        src={src}
        style={{
          maxWidth: 760,
          maxHeight: 650,
          objectFit: "contain",
          opacity: fadeIn,
          filter: "drop-shadow(0 20px 28px rgba(18,59,99,0.22))",
          translate: "-6.3px 118.7px",
        }}
        durationInFrames={358}
      />
    </div>
  );
};

const SlideImages = ({ images }: { images?: ShortNewsSlideImage[] }) => {
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <>
      {images.map((image, index) => (
        <SafeSlideImage
          key={`${image.src}-${index}`}
          path={getSlideAssetPath(image.src)}
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
}: {
  images?: ShortNewsSlideInnerImage[];
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
}: {
  slides: ShortNewsTimedSlide[];
  frameStyle?: ShortNewsSlideFrameStyle;
}) => {
  return (
    <>
      {slides.map((slide, index) => {
        const from = Math.round(slide.start * fps);
        const durationInFrames = Math.max(1, Math.round(slide.duration * fps));
        const x = frameStyle?.x ?? slide.x ?? 58;
        const y = frameStyle?.y ?? slide.y ?? 470;
        const width = frameStyle?.width ?? slide.width ?? 964;
        const height = frameStyle?.height ?? slide.height ?? 300;
        const borderRadius = 0;
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
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: slide.objectFit ?? "contain",
                  objectPosition: slide.objectPosition ?? "center",
                  translate: "17.4px -19px",
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
}: {
  enter: number;
  slide: ShortNewsSlide;
}) => {
  if (slide.slides && slide.slides.length > 0) {
    return (
      <TimedSlideImages
        slides={slide.slides}
        frameStyle={slide.slideFrameStyle}
      />
    );
  }

  const style = slide.slideStyle;
  const imageStyle = slide.slideImageStyle;
  const x = style?.x ?? imageStyle?.x ?? 58;
  const y = style?.y ?? imageStyle?.y ?? 470;
  const width = style?.width ?? imageStyle?.width ?? 964;
  const height = style?.height ?? imageStyle?.height ?? 300;
  const borderRadius = 0;
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
            style={{
              width: "100%",
              height: "100%",
              objectFit: imageStyle?.objectFit ?? "contain",
              objectPosition: imageStyle?.objectPosition ?? "center",
            }}
          />
        ) : null}
        <SlideInnerImages images={slide.slideImages} />
      </section>
    );
  }

  return (
    <section
      style={{
        position: "absolute",
        top: 470,
        left: 58,
        right: 58,
        minHeight: 300,
        zIndex,
        padding: "42px 46px",
        borderRadius: 0,
        backgroundColor: "rgba(255,255,255,0.84)",
        color: newsTheme.blue,
        border: `5px solid ${newsTheme.brown}`,
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
}: {
  localFrame: number;
  slide: ShortNewsSlide;
}) => {
  const enter = interpolate(localFrame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const textStyle = slide.textStyle;
  const captionStyle = slide.captionStyle;
  const captionWidth = captionStyle?.width ?? textStyle?.width;
  const captionBorderWidth = captionStyle?.borderWidth ?? 5;
  const captionBorderColor = newsTheme.brown;

  return (
    <>
      <SlideCard enter={enter} slide={slide} />
      <section
        style={{
          position: "absolute",
          left: captionStyle?.x ?? textStyle?.x ?? 58,
          top: captionStyle?.y ?? textStyle?.y ?? 820,
          width: captionWidth,
          right: captionWidth === undefined ? 58 : undefined,
          height: captionStyle?.height,
          minHeight: captionStyle?.height === undefined ? 210 : undefined,
          zIndex: captionStyle?.zIndex ?? textStyle?.zIndex ?? 20,
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
            color: newsTheme.blue,
            fontSize: captionStyle?.fontSize ?? textStyle?.fontSize ?? 72,
            lineHeight:
              captionStyle?.lineHeight ?? textStyle?.lineHeight ?? 1.18,
            fontWeight: 950,
            textAlign:
              captionStyle?.textAlign ?? textStyle?.textAlign ?? "center",
            textShadow: "none",
          }}
        >
          {slide.caption}
        </div>
      </section>
    </>
  );
};

export const SHORT_NEWS_DURATION_IN_FRAMES = 30 * fps;

export const ShortNewsVideo = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const slides = shortNews.slides.length > 0 ? shortNews.slides : [];
  const slideDuration =
    slides.length > 0
      ? Math.max(1, Math.floor(durationInFrames / slides.length))
      : durationInFrames;
  const titleProgress = interpolate(frame, [0, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const ending = shortNews.ending;
  const shouldShowEnding = ending?.enabled ?? true;
  const endingTiming = getEndingTiming(ending, durationInFrames);

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
            border: "4px solid rgba(255,255,255,0.92)",
            borderRadius: 26,
            boxShadow:
              "0 12px 26px rgba(20,93,153,0.16), inset 0 0 0 2px rgba(20,93,153,0.12)",
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
              width: 54,
              height: 54,
              borderRadius: "50%",
              background:
                "linear-gradient(145deg, #ffffff 0%, #d8f2ff 45%, #87cfff 100%)",
              border: "3px solid rgba(255,255,255,0.95)",
              boxShadow: "0 8px 16px rgba(20,93,153,0.18)",
              flexShrink: 0,
              position: "relative",
              zIndex: 1,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 21,
                top: 14,
                width: 0,
                height: 0,
                borderTop: "13px solid transparent",
                borderBottom: "13px solid transparent",
                borderLeft: `21px solid ${newsTheme.blueAccent}`,
                filter: "drop-shadow(0 2px 3px rgba(18,59,99,0.18))",
              }}
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
              left: 76,
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
          <HighlightedNewsText text={shortNews.title} />
        </h1>
        <div
          style={{
            marginTop: 24,
            display: "inline-flex",
            maxWidth: "100%",
            padding: "18px 28px",
            backgroundColor: "rgba(255,255,255,0.72)",
            border: `4px solid ${newsTheme.brown}`,
            borderLeft: `12px solid ${newsTheme.blueAccent}`,
            color: newsTheme.blue,
            fontSize: 36,
            lineHeight: 1.22,
            fontWeight: 900,
            boxShadow: "0 8px 18px rgba(18,59,99,0.09)",
            textShadow: "none",
          }}
        >
          {shortNews.topic}
        </div>
        <div
          style={{
            marginTop: 28,
            width: 320,
            height: 11,
            background: `linear-gradient(90deg, ${newsTheme.brown} 0%, ${newsTheme.brown} 76%, ${newsTheme.blueAccent} 76%, ${newsTheme.blueAccent} 100%)`,
          }}
        />
      </header>
      <CharacterShadow />
      {slides.map((slide, index) => {
        const from = slide.startFrame ?? index * slideDuration;
        const duration =
          slide.durationFrames ??
          (index === slides.length - 1
            ? durationInFrames - from
            : slideDuration);
        const characterDuration = Math.max(
          1,
          slide.characterDurationFrames ??
            (slide.characterDurationSeconds !== undefined
              ? Math.round(slide.characterDurationSeconds * fps)
              : duration),
        );
        const characterImagePath = getCharacterImagePath(slide);
        const characterFileName = getFileName(characterImagePath);

        return (
          <Sequence
            key={`visual-${index}-${slide.caption}`}
            from={from}
            durationInFrames={duration}
            name={`visual-slide-${index + 1}`}
          >
            <SlideText localFrame={frame - from} slide={slide} />
            <SlideImages images={slide.images} />
            <Sequence
              key={`character-${index}-${characterFileName}`}
              name={`character-${index + 1}-${characterFileName}`}
              layout="none"
              durationInFrames={characterDuration}
            >
              <CharacterImage
                imagePath={characterImagePath}
                localFrame={frame - from}
              />
            </Sequence>
          </Sequence>
        );
      })}
      {slides.map((slide, index) => {
        const visualFrom = slide.startFrame ?? index * slideDuration;
        const audioFrom = slide.audioStartFrame ?? visualFrom;
        const audioFileName = getFileName(slide.audio);

        return (
          <Sequence
            key={`audio-${index}-${slide.audio}`}
            from={audioFrom}
            name={`audio-${index + 1}-${audioFileName}`}
            layout="none"
            durationInFrames={351}
          >
            <SafeAudio path={slide.audio} />
          </Sequence>
        );
      })}
      {slides.length === 0 ? <CharacterPlaceholder /> : null}
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
      {shouldShowEnding && ending?.audio ? (
        <Sequence
          from={ending.audioStartFrame ?? endingTiming.startFrame}
          durationInFrames={endingTiming.durationFrames}
          name={`ending-audio-${getFileName(ending.audio)}`}
          layout="none"
        >
          <SafeAudio path={ending.audio} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
