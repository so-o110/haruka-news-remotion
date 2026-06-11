import { Easing, interpolate, useCurrentFrame } from "remotion";

type NewsSlideProps = {
  category: string;
  title: string;
  summary: string;
  bullets: string[];
  topicIndex: number;
  totalTopics: number;
};

export const NewsSlide = ({
  category,
  title,
  summary,
  bullets,
  topicIndex,
  totalTopics,
}: NewsSlideProps) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, 42], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <section
      style={{
        position: "absolute",
        top: 118,
        right: 82,
        width: 1180,
        height: 760,
        padding: "56px 64px",
        borderRadius: 8,
        backgroundColor: "rgba(255, 255, 255, 0.94)",
        border: "1px solid rgba(255,255,255,0.8)",
        boxShadow: "0 28px 80px rgba(13, 37, 63, 0.2)",
        transform: `translateX(${interpolate(progress, [0, 1], [72, 0])}px)`,
        opacity: progress,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: 14,
          background:
            "linear-gradient(90deg, #0f6ea8 0%, #20a17a 48%, #f5b84b 100%)",
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 32,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 14,
            color: "#0f5d8f",
            fontSize: 28,
            fontWeight: 900,
            textTransform: "uppercase",
          }}
        >
          <span
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              backgroundColor: "#20a17a",
            }}
          />
          {category}
        </div>
        <div
          style={{
            color: "#64748b",
            fontSize: 26,
            fontWeight: 800,
          }}
        >
          {String(topicIndex + 1).padStart(2, "0")} /{" "}
          {String(totalTopics).padStart(2, "0")}
        </div>
      </div>
      <h1
        style={{
          margin: 0,
          color: "#14213d",
          fontSize: 68,
          lineHeight: 1.12,
          fontWeight: 950,
        }}
      >
        {title}
      </h1>
      <p
        style={{
          margin: "34px 0 36px",
          color: "#334155",
          fontSize: 35,
          lineHeight: 1.55,
          fontWeight: 700,
        }}
      >
        {summary}
      </p>
      <div style={{ display: "grid", gap: 22 }}>
        {bullets.map((bullet, index) => {
          const itemProgress = interpolate(frame, [34 + index * 12, 58 + index * 12], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          });

          return (
            <div
              key={bullet}
              style={{
                display: "grid",
                gridTemplateColumns: "44px 1fr",
                gap: 20,
                alignItems: "start",
                opacity: itemProgress,
                transform: `translateY(${interpolate(itemProgress, [0, 1], [20, 0])}px)`,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  backgroundColor: "#ecf8f3",
                  color: "#0f8a65",
                  fontSize: 24,
                  fontWeight: 950,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {index + 1}
              </div>
              <div
                style={{
                  color: "#1f2937",
                  fontSize: 34,
                  lineHeight: 1.35,
                  fontWeight: 850,
                }}
              >
                {bullet}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
