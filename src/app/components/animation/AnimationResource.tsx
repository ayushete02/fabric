// AnimationResource.tsx

"use client";
import React from "react";
import { MdDelete } from "react-icons/md";
import { Animation } from "@/fabric-types";
import { observer } from "mobx-react-lite";
import { useCanvasStore } from "@/context/CanvasContext";

const ANIMATION_TYPE_TO_LABEL: Record<string, string> = {
  fadeIn: "Fade In",
  fadeOut: "Fade Out",
  slideIn: "Slide In",
  slideOut: "Slide Out",
  breathe: "Breathe",
  zoomIn: "Zoom In",
  zoomOut: "Zoom Out",
  rotateIn: "Rotate In",
  rotateOut: "Rotate Out",
  bounceIn: "Bounce In",
  bounceOut: "Bounce Out",
};

export type AnimationResourceProps = {
  animation: Animation;
};

export const AnimationResource = observer((props: AnimationResourceProps) => {
  const store = useCanvasStore();

  return (
    <div className="rounded-lg overflow-hidden items-center bg-slate-800 m-[15px] flex flex-col relative min-h-[100px] p-2">
      <div className="flex flex-row justify-between w-full">
        <div className="text-white py-1 text-base text-left w-full">
          {ANIMATION_TYPE_TO_LABEL[props.animation.type]}
        </div>
        <button
          className="hover:bg-[#00a0f5] bg-[rgba(0,0,0,.25)] rounded z-10 text-white font-bold py-1 text-lg"
          onClick={() => store.removeAnimation(props.animation.id)}
        >
          <MdDelete size="25" />
        </button>
      </div>
      {/* Animation Properties */}
      <AnimationProperties animation={props.animation} />
    </div>
  );
});

const AnimationProperties = observer((props: { animation: Animation }) => {
  const store = useCanvasStore();
  const { animation } = props;

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const duration = Number(e.target.value) * 1000;
    const isValidDuration = duration > 0;
    let newDuration = isValidDuration ? duration : 0;
    if (newDuration < 10) {
      newDuration = 10;
    }
    store.updateAnimation(animation.id, {
      ...animation,
      duration: newDuration,
    });
  };

  return (
    <div className="flex flex-col w-full items-start">
      {/* Duration */}
      <div className="flex flex-row items-center justify-between my-1">
        <div className="text-white text-xs">Duration(s)</div>
        <input
          className="bg-slate-100 text-black rounded-lg px-2 py-1 ml-2 w-16 text-xs"
          type="number"
          value={animation.duration / 1000}
          onChange={handleDurationChange}
        />
      </div>
      {/* Specific Animation Properties */}
      {animation.type === "slideIn" || animation.type === "slideOut" ? (
        <SlideAnimationProperties animation={animation} />
      ) : null}
      {/* Add more property components if needed */}
    </div>
  );
});

const SlideAnimationProperties = observer((props: { animation: Animation }) => {
  const store = useCanvasStore();
  const { animation } = props;

  const handleDirectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    store.updateAnimation(animation.id, {
      ...animation,
      properties: {
        ...animation.properties,
        direction: e.target.value,
      },
    });
  };

  return (
    <>
      <div className="flex flex-row items-center justify-between my-1">
        <div className="text-white text-xs">Direction</div>
        <select
          className="bg-slate-100 text-black rounded-lg px-2 py-1 ml-2 w-20 text-xs"
          value={animation.properties.direction}
          onChange={handleDirectionChange}
        >
          <option value="left">Left</option>
          <option value="right">Right</option>
          <option value="top">Top</option>
          <option value="bottom">Bottom</option>
        </select>
      </div>
    </>
  );
});
