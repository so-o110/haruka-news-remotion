import { type CSSProperties, useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  Audio,
  type CalculateMetadataFunction,
  continueRender,
  delayRender,
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import studyData from "./data/study.json";
import {
  buildTimeline,
  buildTimelineFromDurations,
  getActiveCaption,
  getActiveSlide,
  getBuiltTimeline,
  normalizePublicPath,
  toStaticFilePath,
  type BuiltScene,
  type Scene,
  type TimedCaption,
  type TimedSlide,
} from "./engine";

export type StudyCaption = TimedCaption;

export type StudySlide = TimedSlide;

export type StudySection = Omit<
  Scene,
  "title" | "category" | "characterImage" | "captions" | "slides"
> & {
  title: string;
  category: string;
  characterImage: string;
  slides: StudySlide[];
  captions: StudyCaption[];
};

export type StudyData = {
  programTitle: string;
  subject: string;
  lessonTitle: string;
  teacherName: string;
  opening: {
    headline: string;
    subtitle: string;
  };
  sections: StudySection[];
};

type ComputedStudyData = Omit<StudyData, "sections"> & {
  sections: BuiltScene[];
};

export type StudyVideoProps = {
  study?: StudyData | ComputedStudyData;
};

type AssetState = {
  exists: boolean;
  src: string;
};

const FPS = 30;
const DEFAULT_SECTION_DURATION = 8 * FPS;
const defaultStudy = studyData as StudyData;
const timelineOptions = {
  fps: FPS,
  defaultDurationFrames: DEFAULT_SECTION_DURATION,
  audioBasePath: "audio/study",
  slideBasePath: "slides/study",
};

const theme = {
  blue: "#123b63",
  blueAccent: "#145d99",
  brown: "#7a3f17",
  sky: "#dff5ff",
  white: "#ffffff",
};

const usePublicAsset = (path: string): AssetState => {
  const src = useMemo(() => {
    const normalized = normalizePublicPath(path);
    return /^https?:\/\//i.test(normalized)
      ? normalized
      : staticFile(toStaticFilePath(normalized));
  }, [path]);
  const [exists, setExists] = useState(false);
  const [handle] = useState(() => delayRender(`Checking ${path}`));

  useEffect(() => {
    let mounted = true;
    fetch(src, {method: "HEAD"})
      .then((response) => {
        if (mounted) setExists(response.ok);
      })
      .catch(() => {
        if (mounted) setExists(false);
      })
      .finally(() => {
        if (mounted) continueRender(handle);
      });

    return () => {
      mounted = false;
    };
  }, [handle, src]);

  return {exists, src};
};

const SafeImage = ({path, style}: {path: string; style: CSSProperties}) => {
  const asset = usePublicAsset(path);
  return asset.exists ? <Img src={asset.src} style={style} /> : null;
};

const SafeAudio = ({path}: {path: string}) => {
  const asset = usePublicAsset(path);
  return asset.exists ? <Audio src={asset.src} /> : null;
};

const Header = ({
  study,
  section,
  localFrame,
}: {
  study: StudyData | ComputedStudyData;
  section: BuiltScene;
  localFrame: number;
}) => {
  const enter = interpolate(localFrame, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <header
      style={{
        position: "absolute",
        left: 74,
        right: 74,
        top: 48,
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [-18, 0])}px)`,
        zIndex: 40,
      }}
    >
      <div style={{display: "flex", alignItems: "center", gap: 20}}>
        <span style={{fontSize: 28, fontWeight: 950, color: theme.blueAccent}}>
          {study.programTitle}
        </span>
        <span
          style={{
            padding: "8px 18px",
            borderRadius: 8,
            backgroundColor: theme.brown,
            color: theme.white,
            fontSize: 21,
            fontWeight: 900,
          }}
        >
          {section.category || study.subject}
        </span>
        <span style={{marginLeft: "auto", fontSize: 20, color: theme.blue}}>
          講師 {study.teacherName}
        </span>
      </div>
      <h1
        style={{
          margin: "18px 0 0",
          color: theme.blue,
          fontSize: 66,
          lineHeight: 1.08,
          fontWeight: 950,
          letterSpacing: 0,
        }}
      >
        {section.title ?? study.lessonTitle}
      </h1>
      <div
        style={{
          marginTop: 10,
          color: theme.brown,
          fontSize: 24,
          fontWeight: 850,
        }}
      >
        {study.opening.headline} / {study.opening.subtitle || study.lessonTitle}
      </div>
    </header>
  );
};

const SlidePanel = ({
  section,
  localFrame,
}: {
  section: BuiltScene;
  localFrame: number;
}) => {
  const slide = getActiveSlide(
    section.slides,
    localFrame,
    section.durationFrames,
  );
  const slideLocalFrame = slide ? localFrame - slide.startFrame : localFrame;
  const fade = interpolate(slideLocalFrame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const zoom = interpolate(slideLocalFrame, [0, 24], [0.985, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <section
      style={{
        position: "absolute",
        left: 74,
        top: 250,
        width: 1350,
        height: 570,
        boxSizing: "border-box",
        overflow: "hidden",
        border: "2px solid rgba(122,63,23,0.3)",
        borderRadius: 8,
        backgroundColor: theme.white,
        boxShadow: "0 16px 34px rgba(18,59,99,0.12)",
        zIndex: 20,
      }}
    >
      {slide ? (
        <SafeImage
          path={slide.resolvedImage}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            opacity: fade,
            transform: `scale(${zoom})`,
          }}
        />
      ) : null}
    </section>
  );
};

const Character = ({
  path,
  localFrame,
}: {
  path?: string;
  localFrame: number;
}) => {
  const enter = interpolate(localFrame, [0, 22], [80, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const float = Math.sin(localFrame / 25) * 7;

  return (
    <div
      style={{
        position: "absolute",
        right: 48,
        bottom: 36,
        width: 500,
        height: 720,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        transform: `translateY(${enter + float}px)`,
        zIndex: 24,
      }}
    >
      {path ? (
        <SafeImage
          path={path}
          style={{
            maxWidth: 500,
            maxHeight: 700,
            objectFit: "contain",
            filter: "drop-shadow(0 22px 24px rgba(18,59,99,0.2))",
          }}
        />
      ) : null}
    </div>
  );
};

const Caption = ({
  section,
  localFrame,
}: {
  section: BuiltScene;
  localFrame: number;
}) => {
  const caption = getActiveCaption(
    section.captions,
    localFrame,
    section.durationFrames,
  );
  const captionLocalFrame = caption
    ? localFrame - caption.startFrame
    : localFrame;
  const opacity = interpolate(captionLocalFrame, [0, 7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <section
      style={{
        position: "absolute",
        left: 118,
        right: 118,
        bottom: 46,
        minHeight: 150,
        padding: "26px 330px 26px 42px",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        border: "2px solid rgba(122,63,23,0.38)",
        borderRadius: 8,
        backgroundColor: "rgba(255,255,255,0.97)",
        boxShadow: "0 12px 26px rgba(18,59,99,0.1)",
        zIndex: 35,
      }}
    >
      <div
        style={{
          width: "100%",
          color: theme.blue,
          fontSize: 43,
          lineHeight: 1.3,
          fontWeight: 900,
          textAlign: "center",
          whiteSpace: "pre-wrap",
          overflowWrap: "break-word",
          opacity,
        }}
      >
        {caption?.text ?? ""}
      </div>
    </section>
  );
};

const staticTimeline = buildTimelineFromDurations(
  defaultStudy.sections,
  timelineOptions,
);

export const STUDY_VIDEO_DURATION_IN_FRAMES =
  staticTimeline.totalDurationFrames;

export const calculateStudyVideoMetadata: CalculateMetadataFunction<
  StudyVideoProps
> = async () => {
  const timeline = await buildTimeline(defaultStudy.sections, timelineOptions);

  return {
    durationInFrames: timeline.totalDurationFrames,
    props: {study: {...defaultStudy, sections: timeline.scenes}},
  };
};

export const StudyVideo = ({study = defaultStudy}: StudyVideoProps) => {
  const frame = useCurrentFrame();
  const timeline = getBuiltTimeline(study.sections, timelineOptions);
  const sections = timeline.scenes;

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        color: theme.blue,
        backgroundColor: theme.sky,
        fontFamily:
          "'Yu Gothic', 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif",
      }}
    >
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, #fbfdff 0%, #effaff 60%, #dff5ff 100%)",
        }}
      />
      {sections.map((section, index) => {
        const localFrame = frame - section.startFrame;

        return (
          <Sequence
            key={`${section.title ?? "scene"}-${index}`}
            from={section.startFrame}
            durationInFrames={section.durationFrames}
            name={`study-section-${index + 1}`}
          >
            <Header study={study} section={section} localFrame={localFrame} />
            <SlidePanel section={section} localFrame={localFrame} />
            <Character
              path={section.resolvedCharacterImage}
              localFrame={localFrame}
            />
            <Caption section={section} localFrame={localFrame} />
          </Sequence>
        );
      })}
      {sections.map((section, index) =>
        section.resolvedAudio ? (
          <Sequence
            key={`study-audio-${index}-${section.resolvedAudio}`}
            from={section.audioStartFrame}
            durationInFrames={section.durationFrames}
            layout="none"
            name={`study-audio-${index + 1}`}
          >
            <SafeAudio path={section.resolvedAudio} />
          </Sequence>
        ) : null,
      )}
    </AbsoluteFill>
  );
};
