import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
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
import { getFileName, normalizePublicPath } from "./characterAssets";
import studyShortData from "../public/data/study-short.json";

type CharacterExpression = "normal" | "happy" | "serious" | "thinking";

type TimedCaption = {
  text: string;
  durationFrames: number;
};

type ComputedTimedCaption = TimedCaption & {
  startFrame: number;
};

type StudySlide = {
  text: string;
  caption: string;
  captions?: TimedCaption[];
  characterImage?: string;
  characterExpression?: CharacterExpression;
  audio?: string;
  slideImage?: string;
  durationFrames?: number;
  startFrame?: number;
  audioStartFrame?: number;
  characterDurationFrames?: number;
  slideDurationFrames?: number;
};

type ComputedStudySlide = StudySlide & {
  computedStartFrame: number;
  computedDurationFrames: number;
  computedAudioStartFrame: number;
  computedCharacterDurationFrames: number;
  computedSlideDurationFrames: number;
  computedCaptions?: ComputedTimedCaption[];
  resolvedAudio?: string;
  resolvedCharacterImage?: string;
};

type StudyShortData = {
  title: string;
  subject: string;
  slides: StudySlide[];
};

export type StudyShortVideoProps = {
  study?: StudyShortData;
};

type AssetStatus = {
  exists: boolean;
  src: string;
};

const studyShort = studyShortData as StudyShortData;
const fps = 30;
const defaultSlideDurationFrames = 8 * fps;
const studySlideBasePath = "slides/study-shorts";
const studyAudioBasePath = "audio/study-shorts";

const theme = {
  sky: "#dff5ff",
  blue: "#123b63",
  blueAccent: "#145d99",
  brown: "#7a3f17",
  white: "#ffffff",
};

const characterExpressionPaths: Record<CharacterExpression, string[]> = {
  normal: ["characters/short-ryunosuke/normal.png", "characters/rs1.png"],
  happy: ["characters/short-ryunosuke/happy.png", "characters/rs2.png"],
  serious: ["characters/short-ryunosuke/serious.png", "characters/rn3.png"],
  thinking: ["characters/short-ryunosuke/thinking.png", "characters/rt1.png"],
};

const getStudySlideAssetPath = (path: string) => {
  const normalized = normalizePublicPath(path);

  if (normalized.startsWith("slides/")) {
    return normalized;
  }

  if (normalized.startsWith("study-shorts/")) {
    return `slides/${normalized}`;
  }

  if (normalized.includes("/")) {
    return normalized;
  }

  return `${studySlideBasePath}/${normalized}`;
};

const getStudyAudioAssetPath = (path: string) => {
  const normalized = normalizePublicPath(path);

  if (normalized.startsWith("audio/study-shorts/")) {
    return normalized;
  }

  if (normalized.startsWith("study-shorts/")) {
    return `audio/${normalized}`;
  }

  if (!normalized.includes("/")) {
    return `${studyAudioBasePath}/${normalized}`;
  }

  throw new Error(
    `勉強ショート動画の音声は public/audio/study-shorts/ 配下を指定してください: ${path}`,
  );
};

const getStudyCharacterAssetPath = (path: string) => {
  const normalized = normalizePublicPath(path);

  if (normalized.startsWith("characters/")) {
    return normalized;
  }

  return `characters/${normalized}`;
};

const getCharacterCandidates = (expression: CharacterExpression = "normal") =>
  characterExpressionPaths[expression];

const getAudioDurationFrames = async (audioPath: string | undefined) => {
  if (!audioPath) {
    return undefined;
  }

  try {
    const audioDurationSeconds = await getAudioDurationInSeconds(
      staticFile(audioPath),
    );

    return Math.max(1, Math.ceil(audioDurationSeconds * fps));
  } catch {
    return undefined;
  }
};

const getFallbackDurationFrames = (slide: StudySlide) =>
  Math.max(1, slide.durationFrames ?? defaultSlideDurationFrames);

const buildTimedCaptions = (captions: TimedCaption[]) => {
  let cursor = 0;

  return captions.map((caption) => {
    const durationFrames = Math.max(1, caption.durationFrames);
    const result = {
      ...caption,
      durationFrames,
      startFrame: cursor,
    };

    cursor += durationFrames;

    return result;
  });
};

const getActiveCaption = (
  slide: ComputedStudySlide,
  localFrame: number,
): ComputedTimedCaption | undefined => {
  const captions = slide.computedCaptions;

  if (!captions || captions.length === 0 || localFrame < 0) {
    return undefined;
  }

  return (
    captions.find(
      (caption) =>
        localFrame >= caption.startFrame &&
        localFrame < caption.startFrame + caption.durationFrames,
    ) ??
    captions
      .slice()
      .reverse()
      .find((caption) => localFrame >= caption.startFrame) ??
    captions[0]
  );
};

const getResolvedSlides = async (
  slides: StudySlide[],
): Promise<ComputedStudySlide[]> => {
  let cursor = 0;

  const resolvedSlides = await Promise.all(
    slides.map(async (slide) => {
      const resolvedAudio = slide.audio
        ? getStudyAudioAssetPath(slide.audio)
        : undefined;
      const audioDurationFrames = await getAudioDurationFrames(resolvedAudio);
      const computedDurationFrames =
        audioDurationFrames ?? getFallbackDurationFrames(slide);

      return {
        ...slide,
        resolvedAudio,
        resolvedCharacterImage: slide.characterImage
          ? getStudyCharacterAssetPath(slide.characterImage)
          : undefined,
        durationFrames: computedDurationFrames,
        computedDurationFrames,
        characterDurationFrames: computedDurationFrames,
        computedCharacterDurationFrames: computedDurationFrames,
        slideDurationFrames: computedDurationFrames,
        computedSlideDurationFrames: computedDurationFrames,
        computedCaptions: slide.captions
          ? buildTimedCaptions(slide.captions)
          : undefined,
      };
    }),
  );

  return resolvedSlides.map((slide) => {
    const computedSlide = {
      ...slide,
      startFrame: cursor,
      audioStartFrame: cursor,
      computedStartFrame: cursor,
      computedAudioStartFrame: cursor,
    };

    cursor += slide.computedDurationFrames;

    return computedSlide;
  });
};

const getStaticSlides = (slides: StudySlide[]): ComputedStudySlide[] => {
  let cursor = 0;

  return slides.map((slide) => {
    const computedDurationFrames = Math.max(
      1,
      slide.durationFrames ??
        slide.slideDurationFrames ??
        slide.characterDurationFrames ??
        defaultSlideDurationFrames,
    );
    const computedStartFrame = cursor;
    const computedSlide = {
      ...slide,
      resolvedAudio: slide.audio ? getStudyAudioAssetPath(slide.audio) : undefined,
      resolvedCharacterImage: slide.characterImage
        ? getStudyCharacterAssetPath(slide.characterImage)
        : undefined,
      startFrame: computedStartFrame,
      audioStartFrame: computedStartFrame,
      computedStartFrame,
      computedAudioStartFrame: computedStartFrame,
      computedDurationFrames,
      characterDurationFrames: computedDurationFrames,
      computedCharacterDurationFrames: computedDurationFrames,
      slideDurationFrames: computedDurationFrames,
      computedSlideDurationFrames: computedDurationFrames,
      computedCaptions: slide.captions
        ? buildTimedCaptions(slide.captions)
        : undefined,
    };

    cursor += computedDurationFrames;

    return computedSlide;
  });
};

const getTotalFrames = (slides: ComputedStudySlide[]) =>
  Math.max(
    1,
    slides.reduce(
      (maxFrame, slide) =>
        Math.max(
          maxFrame,
          slide.computedStartFrame + slide.computedDurationFrames,
        ),
      0,
    ),
  );

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
  candidates,
  style,
}: {
  candidates: string[];
  style: CSSProperties;
}) => {
  const primary = usePublicAsset(candidates[0]);
  const fallback = usePublicAsset(candidates[1]);
  const backup = usePublicAsset(candidates[2]);
  const src = primary.exists
    ? primary.src
    : fallback.exists
      ? fallback.src
      : backup.exists
        ? backup.src
        : null;

  if (!src) {
    return null;
  }

  return <Img src={src} style={style} />;
};

const StudyBackground = () => (
  <AbsoluteFill style={{ backgroundColor: theme.sky }}>
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(180deg, #fbfdff 0%, #ecf9ff 58%, #dff5ff 100%)",
      }}
    />
  </AbsoluteFill>
);

const Header = ({
  title,
  frame,
}: {
  title: string;
  frame: number;
}) => {
  const progress = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <header
      style={{
        position: "absolute",
        left: 72,
        right: 72,
        top: 74,
        opacity: progress,
        transform: `translateY(${interpolate(progress, [0, 1], [-28, 0])}px)`,
        zIndex: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
        }}
      >
        <div
          style={{
            color: theme.blueAccent,
            fontSize: 34,
            lineHeight: 1,
            fontWeight: 950,
            letterSpacing: 0,
          }}
        >
          ハルカ授業 SHORTS
        </div>
      </div>
      <h1
        style={{
          margin: "24px 0 0",
          color: theme.blue,
          fontSize: 82,
          lineHeight: 1.08,
          fontWeight: 950,
          letterSpacing: 0,
        }}
      >
        {title}
      </h1>
    </header>
  );
};

const KeywordText = ({ text }: { text: string }) => {
  const parts = text.split(/(偏微分|1つだけ|固定|変化率|∂|x|y|AI|数学)/g);

  return (
    <>
      {parts.map((part, index) => {
        const highlighted = /^(偏微分|1つだけ|固定|変化率|∂|x|y|AI|数学)$/.test(
          part,
        );

        return (
          <span
            key={`${part}-${index}`}
            style={{
              color: highlighted ? theme.brown : "inherit",
              padding: highlighted ? "0 4px" : 0,
            }}
          >
            {part}
          </span>
        );
      })}
    </>
  );
};

const SlidePanel = ({
  slide,
  localFrame,
}: {
  slide: ComputedStudySlide;
  localFrame: number;
}) => {
  const enter = interpolate(localFrame, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const imagePath = slide.slideImage
    ? getStudySlideAssetPath(slide.slideImage)
    : undefined;

  return (
    <section
      style={{
        position: "absolute",
        left: 40,
        top: 260,
        width: 1000,
        height: 800,
        backgroundColor: "rgba(255,255,255,0.96)",
        border: `3px solid rgba(122,63,23,0.42)`,
        borderRadius: 26,
        boxShadow:
          "0 22px 44px rgba(18,59,99,0.16), 0 0 0 8px rgba(255,255,255,0.42)",
        overflow: "hidden",
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [36, 0])}px)`,
        zIndex: 10,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 42,
          right: 42,
          top: 42,
          bottom: 38,
          backgroundColor: theme.white,
          borderRadius: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {imagePath ? (
          <SafeImage
            path={imagePath}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        ) : (
          <div
            style={{
              padding: 48,
              color: theme.blue,
              fontSize: 68,
              lineHeight: 1.18,
              fontWeight: 950,
              textAlign: "center",
              whiteSpace: "pre-wrap",
            }}
          >
            <KeywordText text={slide.text} />
          </div>
        )}
      </div>
    </section>
  );
};

const CharacterArea = ({
  imagePath,
  expression,
  localFrame,
}: {
  imagePath?: string;
  expression?: CharacterExpression;
  localFrame: number;
}) => {
  const enter = interpolate(localFrame, [0, 20], [80, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const float = Math.sin(localFrame / 24) * 9;

  return (
    <div
      style={{
        position: "absolute",
        left: 96,
        right: 96,
        top: 940,
        height: 680,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        transform: `translateY(${enter + float}px)`,
        zIndex: 8,
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: 72,
          width: 520,
          height: 58,
          borderRadius: "50%",
          backgroundColor: "rgba(18,59,99,0.13)",
          filter: "blur(10px)",
        }}
      />
      <SafeCharacterImage
        candidates={
          imagePath
            ? [imagePath, ...getCharacterCandidates(expression)]
            : [...getCharacterCandidates(expression), "characters/rs1.png"]
        }
        style={{
          position: "relative",
          maxWidth: 840,
          maxHeight: 640,
          objectFit: "contain",
          filter: "drop-shadow(0 24px 30px rgba(18,59,99,0.2))",
        }}
      />
    </div>
  );
};

const Caption = ({
  slide,
  localFrame,
}: {
  slide: ComputedStudySlide;
  localFrame: number;
}) => {
  const activeCaption = getActiveCaption(slide, localFrame);
  const caption = activeCaption?.text ?? slide.caption;
  const captionLocalFrame = activeCaption
    ? localFrame - activeCaption.startFrame
    : localFrame;
  const enter = interpolate(localFrame, [4, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const captionEnter = interpolate(captionLocalFrame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <section
      style={{
        position: "absolute",
        left: 64,
        right: 64,
        bottom: 70,
        minHeight: 238,
        padding: "38px 46px",
        boxSizing: "border-box",
        backgroundColor: "rgba(255,255,255,0.96)",
        border: `2px solid rgba(122,63,23,0.48)`,
        borderRadius: 22,
        color: theme.blue,
        boxShadow: "0 16px 30px rgba(18,59,99,0.11)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: enter,
        zIndex: 30,
      }}
    >
      <div
        style={{
          width: "100%",
          fontSize: 58,
          lineHeight: 1.22,
          fontWeight: 950,
          textAlign: "center",
          whiteSpace: "pre-wrap",
          overflowWrap: "break-word",
          opacity: captionEnter,
          transform: `translateY(${interpolate(captionEnter, [0, 1], [12, 0])}px) scale(${interpolate(captionEnter, [0, 1], [0.98, 1])})`,
        }}
      >
        <KeywordText text={caption} />
      </div>
    </section>
  );
};

const staticSlides = getStaticSlides(studyShort.slides ?? []);

export const STUDY_SHORT_DURATION_IN_FRAMES = getTotalFrames(staticSlides);

export const calculateStudyShortMetadata: CalculateMetadataFunction<
  StudyShortVideoProps
> = async () => {
  const slides = await getResolvedSlides(studyShort.slides ?? []);

  return {
    durationInFrames: getTotalFrames(slides),
    props: {
      study: {
        ...studyShort,
        slides,
      },
    },
  };
};

export const StudyShortVideo = ({
  study = studyShort,
}: StudyShortVideoProps) => {
  const frame = useCurrentFrame();
  const slides = getStaticSlides(study.slides ?? []);

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        color: theme.blue,
        fontFamily:
          "'Yu Gothic', 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif",
      }}
    >
      <StudyBackground />
      <Header title={study.title} frame={frame} />
      {slides.map((slide, index) => {
        const from = slide.computedStartFrame;
        const duration = slide.computedDurationFrames;
        const localFrame = frame - from;

        return (
          <Sequence
            key={`study-slide-${index}-${slide.text}`}
            from={from}
            durationInFrames={duration}
            name={`study-slide-${index + 1}`}
          >
            <SlidePanel slide={slide} localFrame={localFrame} />
            <CharacterArea
              imagePath={slide.resolvedCharacterImage}
              expression={slide.characterExpression}
              localFrame={localFrame}
            />
            <Caption slide={slide} localFrame={localFrame} />
          </Sequence>
        );
      })}
      {slides.map((slide, index) => {
        if (!slide.resolvedAudio) {
          return null;
        }

        return (
          <Sequence
            key={`study-audio-${index}-${slide.resolvedAudio}`}
            from={slide.computedAudioStartFrame}
            durationInFrames={slide.computedDurationFrames}
            name={`study-audio-${index + 1}-${getFileName(slide.resolvedAudio)}`}
            layout="none"
          >
            <SafeAudio path={slide.resolvedAudio} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
