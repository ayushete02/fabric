import { fabric } from "fabric";

export type EditorElementBase<T extends string, P> = {
  readonly id: string;
  fabricObject?: fabric.Object;
  name: string;
  readonly type: T;
  placement: Placement;
  timeFrame: TimeFrame;
  properties: P;
};
export type VideoEditorElement = EditorElementBase<
  "video",
  { src: string; elementId: string; imageObject?: fabric.Image; effect: Effect }
>;
export type ImageEditorElement = EditorElementBase<
  "image",
  {
    src: string;
    elementId: string;
    imageObject?: fabric.Object;
    effect: Effect;
  }
>;

export type AudioEditorElement = EditorElementBase<
  "audio",
  { src: string; elementId: string }
>;
export type TextEditorElement = EditorElementBase<
  "text",
  {
    text: string;
    fontSize: number;
    fontWeight: number;
    fontFamily?: string;
    fill?: string;
    backgroundColor?: string; // New: Background color for the text
    underline?: boolean; // New: Whether the text is underlined
    italic?: boolean; // New: Whether the text is italicized
    upperCase?: boolean; // New: Whether the text should be transformed to uppercase
    lowerCase?: boolean; // New: Whether the text should be transformed to lowercase
    textAlign?: "left" | "center" | "right"; // New: Text alignment
    splittedTexts: fabric.Text[];
  }
>;

export type EditorElement =
  | VideoEditorElement
  | ImageEditorElement
  | AudioEditorElement
  | TextEditorElement;

export type Placement = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
};

export type TimeFrame = {
  start: number;
  end: number;
};

export type EffectBase<T extends string> = {
  type: T;
};

export type EffectType =
  | "none"
  | "blackAndWhite"
  | "saturate"
  | "sepia"
  | "invert"
  | "blur"
  | "brightness"
  | "contrast"
  | "pixelate"
  | "noise"
  | "removeColor";

export type BlackAndWhiteEffect =
  | EffectBase<"none">
  | EffectBase<"blackAndWhite">
  | EffectBase<"sepia">
  | EffectBase<"invert">
  | EffectBase<"saturate">;
export type Effect = BlackAndWhiteEffect;
export type EffecType = Effect["type"];

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type AnimationBase<T, P = {}> = {
  id: string;
  targetId: string;
  duration: number;
  type: T;
  properties: P;
};

export type FadeInAnimation = AnimationBase<"fadeIn">;
export type FadeOutAnimation = AnimationBase<"fadeOut">;

export type BreatheAnimation = AnimationBase<"breathe">;

export type SlideDirection = "left" | "right" | "top" | "bottom";
export type SlideTextType = "none" | "character";
export type SlideInAnimation = AnimationBase<
  "slideIn",
  {
    direction: SlideDirection;
    useClipPath: boolean;
    textType: "none" | "character";
  }
>;

export type SlideOutAnimation = AnimationBase<
  "slideOut",
  {
    direction: SlideDirection;
    useClipPath: boolean;
    textType: SlideTextType;
  }
>;

export type Animation =
  | FadeInAnimation
  | FadeOutAnimation
  | SlideInAnimation
  | SlideOutAnimation
  | BreatheAnimation;

export type MenuOption =
  | "Video"
  | "Audio"
  | "Text"
  | "Image"
  | "Export"
  | "Animation"
  | "Effect"
  | "Fill";
