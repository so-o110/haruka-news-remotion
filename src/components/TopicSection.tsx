import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { AICharacter, CharacterExpression } from "./AICharacter";
import { NewsSlide } from "./NewsSlide";
import { Telop } from "./Telop";

export type NewsTopic = {
  title: string;
  category: string;
  durationSeconds: number;
  expression: CharacterExpression;
  summary: string;
  bullets: string[];
  telop: string;
};

type TopicSectionProps = {
  anchorName: string;
  topic: NewsTopic;
  topicIndex: number;
  totalTopics: number;
};

export const TopicSection = ({
  anchorName,
  topic,
  topicIndex,
  totalTopics,
}: TopicSectionProps) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const remaining = durationInFrames - frame;
  const exitOpacity = interpolate(remaining, [0, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(135deg, #eaf6fb 0%, #f7fbfd 46%, #fff7e4 100%)",
        opacity: exitOpacity,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 18% 18%, rgba(15,110,168,0.16) 0, rgba(15,110,168,0) 24%), linear-gradient(rgba(15,110,168,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(15,110,168,0.08) 1px, transparent 1px)",
          backgroundSize: "auto, 72px 72px, 72px 72px",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 42,
          left: 72,
          color: "#0f5d8f",
          fontSize: 48,
          fontWeight: 950,
        }}
      >
        ハルカニュース
      </div>
      <AICharacter expression={topic.expression} name={anchorName} />
      <NewsSlide
        category={topic.category}
        title={topic.title}
        summary={topic.summary}
        bullets={topic.bullets}
        topicIndex={topicIndex}
        totalTopics={totalTopics}
      />
      <Telop text={topic.telop} />
    </AbsoluteFill>
  );
};
