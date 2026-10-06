import {
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  type InteractivitySchema,
} from "remotion";

type TypewriterProps = {
  readonly children: string;
  readonly color: string;
  readonly fontSize: number;
  readonly speed: number;
  readonly holdWidth?: boolean;
  readonly style?: React.CSSProperties;
};

const TypewriterInner: React.FC<TypewriterProps> = ({
  children,
  color,
  fontSize,
  speed,
  holdWidth = false,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const finish = Math.max(1, (children.length / speed) * fps);
  const progress = interpolate(frame, [0, finish], [0, children.length], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const characters = Math.min(children.length, Math.floor(progress));
  const typed = children.slice(0, characters);
  const next = children.slice(characters, characters + 1);
  const finished = characters >= children.length;

  const caret = (
    <span
      style={{
        display: "inline-block",
        width: Math.max(6, fontSize * 0.045),
        height: fontSize * 0.72,
        marginLeft: fontSize * 0.04,
        backgroundColor: "#d6ff3f",
        verticalAlign: "baseline",
        translate: "0px 8px",
        opacity: 1,
        boxShadow: "0 0 18px rgba(214,255,63,0.85)",
      }}
    />
  );

  return (
    <Interactive.Div
      premountFor={fps}
      style={{
        position: "relative",
        display: "inline-block",
        color,
        fontSize,
        lineHeight: 0.95,
        whiteSpace: "pre",
        scale: interpolate(
          frame,
          [Math.max(0, finish - fps / 15), finish, finish + 0.22 * fps],
          [1, 1.035, 1],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            output: "perceptual-scale",
          },
        ),
        ...style,
      }}
    >
      {holdWidth ? (
        <span style={{ visibility: "hidden" }}>{children}</span>
      ) : null}
      <span
        style={{
          position: holdWidth ? "absolute" : "relative",
          left: 0,
          top: 0,
        }}
      >
        {typed}
        <span style={{ opacity: finished ? 0 : progress - characters }}>{next}</span>
        {finished ? null : caret}
      </span>
    </Interactive.Div>
  );
};

const typewriterSchema = {
  children: { type: "text-content", default: "", description: "Text" },
  color: { type: "color", default: "#f4efe4", description: "Color" },
  fontSize: {
    type: "number",
    default: 72,
    min: 24,
    max: 480,
    step: 1,
    hiddenFromList: false,
    description: "Size",
  },
  speed: {
    type: "number",
    default: 16,
    min: 2,
    max: 40,
    step: 1,
    hiddenFromList: false,
    description: "Characters per second",
  },
} as const satisfies InteractivitySchema;

export const Typewriter = Interactive.withSchema({
  Component: TypewriterInner,
  componentName: "<Typewriter>",
  schema: typewriterSchema,
  wrapInSequence: true,
});
