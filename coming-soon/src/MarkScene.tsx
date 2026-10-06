import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  type InteractivitySchema,
  Interactive,
} from "remotion";
import { display } from "./fonts";
import { Stage } from "./Stage";
import { Typewriter } from "./Typewriter";

type MarkSceneProps = {
  readonly children: string;
  readonly style?: React.CSSProperties;
};

const MarkSceneInner: React.FC<MarkSceneProps> = ({ children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={style}>
      <Stage>
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 860,
            height: 860,
            marginLeft: -430,
            marginTop: -430,
            borderRadius: "50%",
            border: "2px solid #d6ff3f",
            opacity: interpolate(frame, [0.35 * fps, 0.5 * fps, 1.3 * fps], [0, 0.7, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            scale: interpolate(frame, [0.35 * fps, 1.3 * fps], [0.35, 1.35], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
              output: "perceptual-scale",
            }),
          }}
        />
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Typewriter
            name="Mark"
            premountFor={fps}
            color="#d6ff3f"
            fontSize={420}
            speed={4}
            holdWidth
            style={{
              fontFamily: display.fontFamily,
              fontWeight: 700,
              letterSpacing: -18,
            }}
          >
            {children}
          </Typewriter>
        </AbsoluteFill>
      </Stage>
    </AbsoluteFill>
  );
};

const markSceneSchema = {
  children: { type: "text-content", default: "NP", description: "Mark" },
} as const satisfies InteractivitySchema;

export const MarkScene = Interactive.withSchema({
  Component: MarkSceneInner,
  componentName: "<MarkScene>",
  schema: markSceneSchema,
  wrapInSequence: true,
});
