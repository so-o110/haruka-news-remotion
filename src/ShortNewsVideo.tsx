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

type ShortNewsSlide = {
  text: string;
  caption: string;
  characterExpression: CharacterExpression;
  audio: string;
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
  const { exists, src } = usePublicAsset(imagePath);
  const fadeIn = interpolate(localFrame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const enter = interpolate(localFrame, [0, 24], [90, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const float = Math.sin(localFrame / 22) * 10;

  if (!exists) {
    return <CharacterPlaceholder />;
  }

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
      />
    </div>
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

  return (
    <>
      <section
        style={{
          position: "absolute",
          top: 470,
          left: 58,
          right: 58,
          minHeight: 300,
          padding: "44px 46px",
          borderRadius: 8,
          backgroundColor: "rgba(255,255,255,0.94)",
          color: "#14213d",
          boxShadow: "0 28px 80px rgba(0,0,0,0.2)",
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
          }}
        >
          {slide.text}
        </div>
      </section>
      <section
        style={{
          position: "absolute",
          left: 58,
          right: 58,
          top: 820,
          minHeight: 210,
          padding: "36px 42px",
          borderRadius: 8,
          backgroundColor: "#071727",
          borderTop: "8px solid #f5b84b",
          boxShadow: "0 18px 54px rgba(0,0,0,0.22)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: enter,
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: 72,
            lineHeight: 1.18,
            fontWeight: 950,
            textAlign: "center",
            textShadow: "0 5px 20px rgba(0,0,0,0.3)",
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
        background:
          "linear-gradient(180deg, #08263d 0%, #0f5d8f 46%, #eaf6fb 100%)",
        color: "white",
        overflow: "hidden",
        fontFamily:
          "'Yu Gothic', 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          transform: `translateY(${-frame * 0.28}px)`,
        }}
      />
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
            color: "#f8d66d",
            fontSize: 38,
            fontWeight: 950,
          }}
        >
          ハルカニュース SHORTS
        </div>
        <h1
          style={{
            margin: "20px 0 0",
            fontSize: 76,
            lineHeight: 1.12,
            fontWeight: 950,
            textShadow: "0 10px 34px rgba(0,0,0,0.3)",
          }}
        >
          {shortNews.title}
        </h1>
        <div
          style={{
            marginTop: 18,
            color: "rgba(255,255,255,0.86)",
            fontSize: 36,
            fontWeight: 850,
          }}
        >
          {shortNews.topic}
        </div>
        <div
          style={{
            marginTop: 28,
            width: 240,
            height: 9,
            backgroundColor: "#f5b84b",
          }}
        />
      </header>
      <CharacterShadow />
      {slides.map((slide, index) => {
        const from = index * slideDuration;
        const duration =
          index === slides.length - 1 ? durationInFrames - from : slideDuration;
        const characterImagePath = getCharacterImagePath(
          slide.characterExpression,
        );

        return (
          <Sequence
            key={`${slide.caption}-${from}`}
            from={from}
            durationInFrames={duration}
            name={`slide-${index + 1}`}
          >
            <Sequence name={getFileName(slide.audio)} layout="none">
              <SafeAudio path={slide.audio} />
            </Sequence>
            <SlideText localFrame={frame - from} slide={slide} />
            <Sequence name={getFileName(characterImagePath)} layout="none">
              <CharacterImage
                imagePath={characterImagePath}
                localFrame={frame - from}
              />
            </Sequence>
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
