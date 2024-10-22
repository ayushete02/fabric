// src/components/EffectResource.tsx

import React from "react";
import {
  VideoEditorElement,
  ImageEditorElement,
  EffectType,
} from "@/fabric-types";
import { observer } from "mobx-react-lite";
import { useCanvasStore } from "@/context/CanvasContext";

const EFFECT_TYPE_TO_LABEL: Record<EffectType, string> = {
  none: "None",
  blackAndWhite: "Black and White",
  saturate: "Saturate",
  sepia: "Sepia",
  invert: "Invert",
  blur: "Blur",
  brightness: "Brightness",
  contrast: "Contrast",
  pixelate: "Pixelate",
  noise: "Noise",
  removeColor: "Remove White",
};

export type EffectResourceProps = {
  editorElement: VideoEditorElement | ImageEditorElement;
};

export const EffectResource = observer((props: EffectResourceProps) => {
  const store = useCanvasStore();

  return (
    <div className="rounded-lg overflow-hidden items-center bg-slate-800 m-[15px] flex flex-col relative min-h-[100px] p-2">
      <div className="flex flex-row justify-between w-full">
        <div className="text-white py-1 text-base text-left w-full">
          {EFFECT_TYPE_TO_LABEL[props.editorElement.properties.effect.type]}
        </div>
      </div>
      {/* Select effect from drop down */}
      <select
        className="bg-slate-100 text-black rounded-lg px-2 py-1 ml-2 w-40 text-xs"
        value={props.editorElement.properties.effect.type}
        onChange={(e) => {
          const type = e.target.value;
          store.updateEffect(props.editorElement.id, {
            type: type as EffectType,
          });
        }}
      >
        {Object.keys(EFFECT_TYPE_TO_LABEL).map((type) => {
          return (
            <option key={type} value={type}>
              {EFFECT_TYPE_TO_LABEL[type]}
            </option>
          );
        })}
      </select>
    </div>
  );
});
