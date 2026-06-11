import { Easing, interpolate, useCurrentFrame } from "remotion";

type TelopProps = {
  text: string;
};

export const Telop = ({ text }: TelopProps) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 20], [52, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 142,
        backgroundColor: "#071727",
        borderTop: "7px solid #f5b84b",
        display: "grid",
        gridTemplateColumns: "320px 1fr",
        alignItems: "center",
        boxShadow: "0 -20px 56px rgba(0,0,0,0.2)",
      }}
    >
      <div
        style={{
          height: "100%",
          backgroundColor: "#b91c1c",
          color: "white",
          fontSize: 42,
          fontWeight: 950,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        NEWS
      </div>
      <div
        style={{
          color: "white",
          fontSize: 46,
          lineHeight: 1.2,
          fontWeight: 900,
          padding: "0 48px",
          transform: `translateY(${enter}px)`,
          opacity: interpolate(frame, [0, 16], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          textShadow: "0 3px 14px rgba(0,0,0,0.34)",
        }}
      >
        {text}
      </div>
    </div>
  );
};
