import { useEffect, useMemo, useState } from "react";
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
  objectFit?: "cover" | "contain";
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
  zIndex?: number;
};

type ShortNewsSlideInnerImage = {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  objectFit?: "cover" | "contain";
  opacity?: number;
  rotate?: number;
  borderRadius?: number;
  zIndex?: number;
};

type ShortNewsTimedSlide = {
  src: string;
  start: number;
  duration: number;
  x: number;
  y: number;
  width: number;
  height: number;
  objectFit?: "cover" | "contain";
  opacity?: number;
  borderRadius?: number;
  zIndex?: number;
};

type ShortNewsSlide = {
  text: string;
  caption: string;
  characterExpression: CharacterExpression;
  audio: string;
  startFrame?: number;
  durationFrames?: number;
  audioStartFrame?: number;
  slideImage?: string;
  slideImageStyle?: ShortNewsSlideImageStyle;
  textStyle?: ShortNewsTextStyle;
  captionStyle?: ShortNewsCaptionStyle;
  slideStyle?: ShortNewsSlideStyle;
  slideImages?: ShortNewsSlideInnerImage[];
  slides?: ShortNewsTimedSlide[];
  images?: ShortNewsSlideImage[];
};

type ShortNewsData = {
  title: string;
  topic: string;
  slides: ShortNewsSlide[];
};

type AssetStatus = {
  exists: boolean;
  src: string;
};

const shortNews = shortNewsData as ShortNewsData;
const fps = 30;
const characterBasePath = "/characters/short-ryunosuke";

const normalizePublicPath = (path: string) => path.replace(/^\/+/, "");
const getFileName = (path: string) => path.split("/").pop() ?? path;
const getCharacterImagePath = (expression: CharacterExpression) =>
  `${characterBasePath}/${expression}-1.png`;

const ShortsBackground = ({ frame }: { frame: number }) => {
  const sweep = (frame % 120) * 5;

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 18% 8%, rgba(255, 45, 85, 0.36) 0%, transparent 32%), radial-gradient(circle at 88% 18%, rgba(255, 202, 40, 0.28) 0%, transparent 28%), radial-gradient(circle at 58% 82%, rgba(255, 0, 128, 0.22) 0%, transparent 30%), linear-gradient(180deg, #020204 0%, #07060b 50%, #020204 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(115deg, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(25deg, rgba(255,45,85,0.16) 1px, transparent 1px)",
          backgroundSize: "84px 84px, 132px 132px",
          transform: `translate3d(${-sweep * 0.18}px, ${sweep * 0.1}px, 0)`,
          opacity: 0.9,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 210,
          left: -210,
          width: 820,
          height: 58,
          background: "linear-gradient(90deg, #ff1744 0%, #ff4fb8 100%)",
          transform: "rotate(-18deg)",
          boxShadow: "0 0 44px rgba(255, 23, 68, 0.45)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 330,
          right: -280,
          width: 920,
          height: 46,
          background: "linear-gradient(90deg, #ffd22e 0%, #ff1744 100%)",
          transform: "rotate(-18deg)",
          boxShadow: "0 0 42px rgba(255, 210, 46, 0.35)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -260,
          bottom: 310,
          width: 760,
          height: 38,
          background: "rgba(255,255,255,0.86)",
          transform: "rotate(-18deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 52,
          top: 520,
          width: 210,
          height: 210,
          border: "12px solid rgba(255, 210, 46, 0.86)",
          transform: `rotate(${frame * 0.18}deg)`,
          opacity: 0.58,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 42,
          top: 1020,
          width: 170,
          height: 170,
          border: "10px solid rgba(255, 45, 160, 0.72)",
          borderRadius: "50%",
          boxShadow: "0 0 38px rgba(255, 45, 160, 0.34)",
        }}
      />
      {Array.from({ length: 7 }, (_, index) => (
        <div
          key={`speed-line-${index}`}
          style={{
            position: "absolute",
            right: -48,
            top: 730 + index * 58,
            width: 300 - index * 18,
            height: 12,
            backgroundColor:
              index % 3 === 0
                ? "#ff1744"
                : index % 3 === 1
                  ? "#ff4fb8"
                  : "#ffd22e",
            transform: "skewX(-24deg)",
            opacity: 0.72,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: 128,
          right: 128,
          bottom: 60,
          height: 760,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(5,5,8,0.72) 0%, rgba(5,5,8,0.46) 45%, transparent 72%)",
        }}
      />
    </>
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
        backgroundColor: "rgba(0,0,0,0.28)",
        filter: "blur(10px)",
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
      }}
    >
      <div
        style={{
          width: 420,
          height: 420,
          borderRadius: "50%",
          background:
            "linear-gradient(145deg, #ffffff 0%, #d8f2ff 48%, #ffd7df 100%)",
          border: "12px solid rgba(255,255,255,0.86)",
          boxShadow: "0 22px 60px rgba(0, 0, 0, 0.26)",
          color: "#19324d",
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
          filter: "drop-shadow(0 24px 42px rgba(0,0,0,0.32))",
        }}
        durationInFrames={311}
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
        <Img
          key={`${image.src}-${index}`}
          src={staticFile(normalizePublicPath(image.src))}
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
            filter: "drop-shadow(0 14px 24px rgba(0,0,0,0.38))",
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
        <Img
          key={`${image.src}-${index}`}
          src={staticFile(normalizePublicPath(image.src))}
          style={{
            position: "absolute",
            left: image.x,
            top: image.y,
            width: image.width,
            height: image.height,
            objectFit: image.objectFit ?? "cover",
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

const TimedSlideImages = ({ slides }: { slides: ShortNewsTimedSlide[] }) => {
  return (
    <>
      {slides.map((slide, index) => {
        const from = Math.round(slide.start * fps);
        const durationInFrames = Math.max(1, Math.round(slide.duration * fps));

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
                left: slide.x,
                top: slide.y,
                width: slide.width,
                height: slide.height,
                borderRadius: slide.borderRadius ?? 0,
                overflow: "hidden",
                opacity: slide.opacity ?? 1,
                zIndex: slide.zIndex ?? 10,
                boxShadow: "0 20px 54px rgba(0,0,0,0.42)",
              }}
            >
              <Img
                src={staticFile(normalizePublicPath(slide.src))}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: slide.objectFit ?? "cover",
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
    return <TimedSlideImages slides={slide.slides} />;
  }

  const style = slide.slideStyle;
  const imageStyle = slide.slideImageStyle;
  const x = style?.x ?? imageStyle?.x ?? 58;
  const y = style?.y ?? imageStyle?.y ?? 470;
  const width = style?.width ?? imageStyle?.width ?? 964;
  const height = style?.height ?? imageStyle?.height ?? 300;
  const borderRadius = style?.borderRadius ?? imageStyle?.borderRadius ?? 8;
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
          overflow: "hidden",
          zIndex,
          border: "6px solid #ffd22e",
          backgroundColor: "rgba(5,5,8,0.88)",
          boxShadow: "12px 12px 0 #ff1744, 0 28px 80px rgba(0,0,0,0.46)",
          opacity: enter,
          transform: `translateY(${interpolate(enter, [0, 1], [34, 0])}px)`,
        }}
      >
        {slide.slideImage ? (
          <Img
            src={staticFile(normalizePublicPath(slide.slideImage))}
            style={{
              width: "100%",
              height: "100%",
              objectFit: imageStyle?.objectFit ?? "cover",
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
        borderRadius: 8,
        backgroundColor: "rgba(255,255,255,0.96)",
        color: "#08080d",
        border: "6px solid #ffd22e",
        boxShadow: "12px 12px 0 #ff1744, 0 28px 80px rgba(0,0,0,0.46)",
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
          textShadow: "0 2px 0 rgba(255, 210, 46, 0.22)",
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
  const captionBorderColor = captionStyle?.borderColor ?? "#ff4fb8";

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
          borderRadius: captionStyle?.borderRadius ?? 8,
          background:
            captionStyle?.backgroundColor ??
            "linear-gradient(135deg, rgba(6,6,10,0.96) 0%, rgba(36,0,22,0.96) 100%)",
          border: `${captionBorderWidth}px solid ${captionBorderColor}`,
          borderTop:
            captionStyle === undefined
              ? "12px solid #ff1744"
              : `${captionBorderWidth}px solid ${captionBorderColor}`,
          boxShadow:
            "10px 10px 0 #ffd22e, 0 18px 54px rgba(0,0,0,0.45), 0 0 36px rgba(255,79,184,0.32)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: enter,
        }}
      >
        <div
          style={{
            width: "100%",
            color: captionStyle?.color ?? textStyle?.color ?? "white",
            fontSize: captionStyle?.fontSize ?? textStyle?.fontSize ?? 72,
            lineHeight: captionStyle?.lineHeight ?? textStyle?.lineHeight ?? 1.18,
            fontWeight: 950,
            textAlign: captionStyle?.textAlign ?? textStyle?.textAlign ?? "center",
            textShadow:
              "4px 4px 0 #ff1744, -3px -3px 0 rgba(255, 210, 46, 0.72), 0 5px 20px rgba(0,0,0,0.52)",
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
  const endingOpacity = interpolate(frame, [26 * fps, 28 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#020204",
        color: "white",
        overflow: "hidden",
        fontFamily:
          "'Yu Gothic', 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif",
      }}
    >
      <ShortsBackground frame={frame} />
      <header
        style={{
          position: "absolute",
          top: 86,
          left: 64,
          right: 64,
          opacity: titleProgress,
          transform: `translateY(${interpolate(titleProgress, [0, 1], [-34, 0])}px)`,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 18,
            padding: "18px 32px 20px",
            background:
              "linear-gradient(110deg, rgba(8,8,12,0.98) 0%, rgba(34,34,40,0.96) 54%, rgba(10,10,14,0.98) 100%)",
            border: "4px solid #ff1744",
            borderRightColor: "#ffd22e",
            borderBottomColor: "#ff4fb8",
            boxShadow:
              "8px 8px 0 rgba(0,0,0,0.92), 0 0 28px rgba(255, 23, 68, 0.72), 0 0 46px rgba(255, 79, 184, 0.38)",
            transform: "skewX(-12deg)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: -80,
              top: 0,
              bottom: 0,
              width: 150,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
              transform: "skewX(-18deg)",
            }}
          />
          <div
            style={{
              width: 0,
              height: 0,
              borderTop: "21px solid transparent",
              borderBottom: "21px solid transparent",
              borderLeft: "35px solid #ff1744",
              filter:
                "drop-shadow(0 0 10px rgba(255,23,68,0.88)) drop-shadow(0 0 18px rgba(255,210,46,0.38))",
              transform: "skewX(12deg)",
              flexShrink: 0,
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 20,
              transform: "skewX(12deg)",
              position: "relative",
              zIndex: 1,
            }}
          >
            <span
              style={{
                color: "#ffffff",
                fontSize: 56,
                lineHeight: 1,
                fontWeight: 950,
                textShadow:
                  "3px 3px 0 #ff1744, -2px -2px 0 rgba(255,210,46,0.82), 0 0 18px rgba(255,255,255,0.42), 0 0 32px rgba(0,174,255,0.34)",
                whiteSpace: "nowrap",
              }}
            >
              ハルカニュース
            </span>
            <span
              style={{
                background:
                  "linear-gradient(90deg, #ff1744 0%, #ff4fb8 58%, #ffd22e 100%)",
                WebkitBackgroundClip: "text",
                color: "transparent",
                fontSize: 36,
                lineHeight: 1,
                fontWeight: 950,
                letterSpacing: 0,
                textShadow: "0 0 18px rgba(255,79,184,0.62)",
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
              right: 28,
              bottom: 8,
              height: 5,
              background:
                "linear-gradient(90deg, #ffd22e 0%, #ff1744 42%, #ff4fb8 76%, #2ed4ff 100%)",
              boxShadow:
                "0 0 12px rgba(255,210,46,0.78), 0 0 22px rgba(255,79,184,0.52)",
            }}
          />
        </div>
        <h1
          style={{
            margin: "28px 0 0",
            fontSize: 76,
            lineHeight: 1.12,
            fontWeight: 950,
            color: "#ffffff",
            textShadow:
              "5px 5px 0 #ff1744, -3px -3px 0 rgba(255,210,46,0.72), 0 12px 34px rgba(0,0,0,0.76)",
          }}
        >
          {shortNews.title}
        </h1>
        <div
          style={{
            marginTop: 24,
            display: "inline-flex",
            maxWidth: "100%",
            padding: "18px 28px",
            background:
              "linear-gradient(90deg, rgba(255,23,68,0.96) 0%, rgba(123,0,38,0.96) 100%)",
            borderLeft: "12px solid #ffd22e",
            borderRight: "6px solid #ff4fb8",
            color: "#ffffff",
            fontSize: 36,
            lineHeight: 1.22,
            fontWeight: 900,
            boxShadow: "8px 8px 0 rgba(0,0,0,0.72)",
            textShadow: "2px 2px 0 rgba(0,0,0,0.58)",
          }}
        >
          {shortNews.topic}
        </div>
        <div
          style={{
            marginTop: 28,
            width: 320,
            height: 11,
            background:
              "linear-gradient(90deg, #ffd22e 0%, #ff1744 46%, #ff4fb8 100%)",
            boxShadow: "0 0 28px rgba(255, 210, 46, 0.44)",
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
        const characterImagePath = getCharacterImagePath(
          slide.characterExpression,
        );
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
              from={-8}
              durationInFrames={311}
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
            durationInFrames={317}
          >
            <SafeAudio path={slide.audio} />
          </Sequence>
        );
      })}
      {slides.length === 0 ? <CharacterPlaceholder /> : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(7,23,39,0.9)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: endingOpacity,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontSize: 92,
            fontWeight: 950,
            color: "white",
            textShadow: "0 18px 60px rgba(0,0,0,0.38)",
          }}
        >
          ハルカニュース
        </div>
      </div>
    </AbsoluteFill>
  );
};
