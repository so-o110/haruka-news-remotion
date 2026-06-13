import { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import shortNewsData from "../public/data/short-news.json";

type ShortNewsData = {
  title: string;
  summary: string;
  points: string[];
  characterComment: string;
  source: string;
  audioFile: string;
  characterImages: string[];
};

const shortNews = shortNewsData as ShortNewsData;
const normalizePublicPath = (path: string) => path.replace(/^\/+/, "");

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

const CharacterImage = ({ src, localFrame }: { src: string; localFrame: number }) => {
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

const ShortCharacterSequences = ({ images }: { images: string[] }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const imageSrcs = useMemo(
    () => images.map((image) => staticFile(normalizePublicPath(image))),
    [images],
  );
  const characterSwitchFrames = fps * 4;

  if (imageSrcs.length === 0) {
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
  }

  return (
    <>
      <CharacterShadow />
      {imageSrcs.map((src, index) => {
        const startFrame = index * characterSwitchFrames;
        const duration = Math.min(
          characterSwitchFrames,
          Math.max(1, durationInFrames - startFrame),
        );

        if (startFrame >= durationInFrames) {
          return null;
        }

        return (
          <Sequence
            key={src}
            from={startFrame}
            durationInFrames={duration}
            name={images[index]?.split("/").at(-1) ?? `character-${index + 1}`}
          >
            <CharacterImage src={src} localFrame={frame - startFrame} />
          </Sequence>
        );
      })}
    </>
  );
};

const getCurrentTelop = (frame: number, fps: number) => {
  if (frame < 3 * fps) {
    return shortNews.title;
  }

  const telops = [
    shortNews.summary,
    ...shortNews.points,
    shortNews.characterComment,
  ];
  const index = Math.min(
    telops.length - 1,
    Math.floor((frame - 3 * fps) / (6 * fps)),
  );

  return telops[index] ?? shortNews.summary;
};

export const SHORT_NEWS_DURATION_IN_FRAMES = 30 * 30;

export const ShortNewsVideo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const telop = getCurrentTelop(frame, fps);
  const titleProgress = interpolate(frame, [0, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const telopProgress = interpolate(frame % (6 * fps), [0, 12], [0, 1], {
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
      <Audio src={staticFile(normalizePublicPath(shortNews.audioFile))} volume={1} />
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
            marginTop: 28,
            width: 240,
            height: 9,
            backgroundColor: "#f5b84b",
          }}
        />
      </header>
      <section
        style={{
          position: "absolute",
          top: 510,
          left: 58,
          right: 58,
          minHeight: 440,
          padding: "54px 52px",
          borderRadius: 8,
          backgroundColor: "rgba(255,255,255,0.94)",
          color: "#14213d",
          boxShadow: "0 28px 80px rgba(0,0,0,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: telopProgress,
          transform: `translateY(${interpolate(telopProgress, [0, 1], [34, 0])}px)`,
        }}
      >
        <div
          style={{
            fontSize: 64,
            lineHeight: 1.28,
            fontWeight: 950,
            textAlign: "center",
          }}
        >
          {telop}
        </div>
      </section>
      <div
        style={{
          position: "absolute",
          left: 74,
          right: 74,
          top: 1020,
          padding: "22px 32px",
          borderRadius: 8,
          backgroundColor: "rgba(7,23,39,0.82)",
          border: "1px solid rgba(255,255,255,0.28)",
          color: "rgba(255,255,255,0.9)",
          fontSize: 34,
          lineHeight: 1.38,
          fontWeight: 800,
          textAlign: "center",
        }}
      >
        {shortNews.source}
      </div>
      <ShortCharacterSequences images={shortNews.characterImages} />
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
