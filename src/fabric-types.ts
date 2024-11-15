import { fabric } from "fabric";

export type EditorElementBase<T extends string, P> = {
  readonly id: string;
  fabricObject?: fabric.Object;
  name: string;
  shapeType:
    | "rectangle"
    | "circle"
    | "triangle"
    | "ellipse"
    | "line"
    | "polyline"
    | "polygon";
  readonly type: T;
  placement: Placement;
  timeFrame: TimeFrame;
  properties: P;
};

export type VideoEditorElement = EditorElementBase<
  "video",
  {
    src: string;
    elementId: string;
    imageObject?: fabric.Image;
    effects: Effects;
  }
>;

export type ImageEditorElement = EditorElementBase<
  "image",
  {
    src: string;
    elementId: string;
    imageObject?: fabric.Object;
    effects: Effects;
  }
>;

export type ShapeEditorElement = EditorElementBase<
  "shape",
  {
    src: string;

    elementId: string;
    imageObject?: fabric.Object;
    effects: Effects;
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
  | ShapeEditorElement
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

export type EffectBase<T extends string, P = {}> = {
  type: T;
  enabled: boolean;
  properties?: P;
};

export type BrightnessEffect = EffectBase<"brightness", { value: number }>;
export type ContrastEffect = EffectBase<"contrast", { value: number }>;
export type SaturationEffect = EffectBase<"saturation", { value: number }>;
export type SepiaEffect = EffectBase<"sepia">;
export type InvertEffect = EffectBase<"invert">;
export type BlurEffect = EffectBase<"blur", { value: number }>;
export type PixelateEffect = EffectBase<"pixelate", { value: number }>;
export type NoiseEffect = EffectBase<"noise", { value: number }>;
export type GammaEffect = EffectBase<
  "gamma",
  { red: number; green: number; blue: number }
>;
export type RemoveColorEffect = EffectBase<
  "removeColor",
  { color: string; distance: number }
>;
export type HueEffect = EffectBase<"hue", { value: number }>;
export type BlendColorEffect = EffectBase<
  "blendColor",
  { color: string; mode: string; alpha: number }
>;
export type BlendImageEffect = EffectBase<
  "blendImage",
  { image: fabric.Image; mode: string; alpha: number }
>;

export type Effects = {
  brightness?: BrightnessEffect;
  contrast?: ContrastEffect;
  saturation?: SaturationEffect;
  sepia?: SepiaEffect;
  invert?: InvertEffect;
  blur?: BlurEffect;
  pixelate?: PixelateEffect;
  noise?: NoiseEffect;
  gamma?: GammaEffect;
  removeColor?: RemoveColorEffect;
  hue?: HueEffect;
  blendColor?: BlendColorEffect;
  blendImage?: BlendImageEffect;
};

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
