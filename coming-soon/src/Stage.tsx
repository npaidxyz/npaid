import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const Stage: React.FC<{ readonly children: React.ReactNode }> = ({
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#12161a",
        backgroundImage: "radial-gradient(#5c656e 1.35px, transparent 1.55px)",
        backgroundSize: "28px 28px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          width: 3,
          height,
          backgroundColor: "#d6ff3f",
          boxShadow: "0 0 28px rgba(214,255,63,0.9)",
          opacity: interpolate(
            frame,
            [0, 0.15 * fps, 0.85 * fps, 1.05 * fps],
            [0, 0.9, 0.9, 0],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
          translate: interpolate(
            frame,
            [0, 1.05 * fps],
            ["-60px 0px", `${width + 40}px 0px`],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.inOut(Easing.cubic),
            },
          ),
        }}
      />
      {children}
    </AbsoluteFill>
  );
};
