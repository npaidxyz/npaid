import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  type InteractivitySchema,
} from "remotion";
import { display, mono } from "./fonts";
import { Stage } from "./Stage";
import { Typewriter } from "./Typewriter";

type StepProps = {
  readonly eyebrow: string;
  readonly step: string;
  readonly title: string;
  readonly detail: string;
  readonly index: number;
  readonly total: number;
  readonly seconds: number;
  readonly style?: React.CSSProperties;
};

const StepInner: React.FC<StepProps> = ({
  eyebrow,
  step,
  title,
  detail,
  index,
  total,
  seconds,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = ((index - 1) / total) * 1520;
  const end = (index / total) * 1520;
  const hasStep = step.trim().length > 0;

  return (
    <AbsoluteFill style={style}>
      <Stage>
        <Interactive.Div
          name="Eyebrow"
          premountFor={fps}
          style={{
            position: "absolute",
            left: 160,
            top: 220,
            fontFamily: mono.fontFamily,
            fontWeight: 500,
            fontSize: 36,
            letterSpacing: 3,
            color: "#d6ff3f",
            opacity: interpolate(frame, [0, 0.3 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          {eyebrow}
        </Interactive.Div>
        {hasStep ? (
          <Interactive.Div
            name="Number"
            premountFor={fps}
            style={{
              position: "absolute",
              left: 160,
              top: 280,
              fontFamily: display.fontFamily,
              fontWeight: 700,
              fontSize: 132,
              lineHeight: 0.9,
              color: "#d6ff3f",
              opacity: interpolate(frame, [0, 0.25 * fps], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              translate: interpolate(frame, [0, 0.3 * fps], ["0px 24px", "0px 0px"], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
            }}
          >
            {step}
          </Interactive.Div>
        ) : null}
        <Typewriter
          name="Title"
          from={0.15 * fps}
          premountFor={fps}
          color="#f4efe4"
          fontSize={hasStep ? 88 : 120}
          speed={26}
          style={{
            position: "absolute",
            left: 160,
            top: hasStep ? 450 : 340,
            fontFamily: display.fontFamily,
            fontWeight: 700,
            letterSpacing: -2,
          }}
        >
          {title}
        </Typewriter>
        <Typewriter
          name="Detail"
          from={0.7 * fps}
          premountFor={fps}
          color="#a39c8c"
          fontSize={46}
          speed={32}
          style={{
            position: "absolute",
            left: 160,
            top: 600,
            fontFamily: mono.fontFamily,
            fontWeight: 500,
          }}
        >
          {detail}
        </Typewriter>
        <Interactive.Div
          name="Track"
          premountFor={fps}
          style={{
            position: "absolute",
            left: 160,
            top: 860,
            width: 1520,
            height: 6,
            borderRadius: 3,
            backgroundColor: "#2a3036",
          }}
        />
        <Interactive.Div
          name="Progress"
          premountFor={fps}
          style={{
            position: "absolute",
            left: 160,
            top: 860,
            height: 6,
            borderRadius: 3,
            backgroundColor: "#d6ff3f",
            width: interpolate(frame, [0, seconds * fps], [start, end], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        />
      </Stage>
    </AbsoluteFill>
  );
};

const stepSchema = {
  eyebrow: { type: "text-content", default: "Tutorial", description: "Label" },
  step: { type: "text-content", default: "01", description: "Step" },
  title: { type: "text-content", default: "Sign in with X", description: "Title" },
  detail: {
    type: "text-content",
    default: "Use the account that will reply.",
    description: "Detail",
  },
  index: {
    type: "number",
    default: 1,
    min: 1,
    max: 4,
    step: 1,
    integer: true,
    hiddenFromList: false,
    description: "Step index",
  },
  total: {
    type: "number",
    default: 4,
    min: 1,
    max: 6,
    step: 1,
    integer: true,
    hiddenFromList: true,
    description: "Step count",
  },
  seconds: {
    type: "number",
    default: 7.4,
    min: 1,
    max: 20,
    step: 0.1,
    hiddenFromList: true,
    description: "Scene length",
  },
} as const satisfies InteractivitySchema;

export const Step = Interactive.withSchema({
  Component: StepInner,
  componentName: "<Step>",
  schema: stepSchema,
  wrapInSequence: true,
});
