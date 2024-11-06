// AnimationsPanel.tsx

"use client";
import React from "react";
import { getUid } from "@/utils";
import { useCanvasStore } from "@/context/CanvasContext";
import { observer } from "mobx-react-lite";
import { AnimationResource } from "./AnimationResource";

export const AnimationsPanel = observer(() => {
  const store = useCanvasStore();

  const selectedElement = store.selectedElement;
  const selectedElementAnimations = store.animations.filter((animation) => {
    return animation.targetId === selectedElement?.id;
  });

  const existingAnimationTypes = selectedElementAnimations.map((a) => a.type);

  const entranceAnimations = [
    { type: "fadeIn", label: "Fade In" },
    { type: "slideIn", label: "Slide In" },
    { type: "zoomIn", label: "Zoom In" },
    { type: "rotateIn", label: "Rotate In" },
    { type: "bounceIn", label: "Bounce In" },
  ];

  const exitAnimations = [
    { type: "fadeOut", label: "Fade Out" },
    { type: "slideOut", label: "Slide Out" },
    { type: "zoomOut", label: "Zoom Out" },
    { type: "rotateOut", label: "Rotate Out" },
    { type: "bounceOut", label: "Bounce Out" },
  ];

  const emphasisAnimations = [
    { type: "breathe", label: "Breathe" },
    // Add more emphasis animations if desired
  ];

  const renderAddAnimationButton = (animationType: string, label: string) => {
    if (!selectedElement || existingAnimationTypes.includes(animationType)) {
      return null;
    }
    return (
      <div
        key={animationType}
        className="text-sm px-[16px] py-[8px] font-semibold hover:bg-slate-700 hover:text-white cursor-pointer"
        onClick={() => {
          const animation: Animation = {
            id: getUid(),
            type: animationType,
            targetId: selectedElement?.id ?? "",
            duration: 1000,
            properties: {}, // Add default properties if needed
          };
          if (animationType.startsWith("slide")) {
            animation.properties = {
              direction: "left",
              useClipPath: false,
              textType: "none",
            };
          }
          store.addAnimation(animation);
        }}
      >
        {`Add ${label}`}
      </div>
    );
  };

  return (
    <>
      <div className="text-sm px-[16px] pt-[16px] pb-[8px] font-semibold">
        Animations
      </div>
      {/* Entrance Animations */}
      <div className="text-sm px-[16px] pt-[16px] pb-[8px] font-semibold">
        Entrance Animations
      </div>
      {entranceAnimations.map((anim) =>
        renderAddAnimationButton(anim.type, anim.label)
      )}
      {/* Exit Animations */}
      <div className="text-sm px-[16px] pt-[16px] pb-[8px] font-semibold">
        Exit Animations
      </div>
      {exitAnimations.map((anim) =>
        renderAddAnimationButton(anim.type, anim.label)
      )}
      {/* Emphasis Animations */}
      <div className="text-sm px-[16px] pt-[16px] pb-[8px] font-semibold">
        Emphasis Animations
      </div>
      {emphasisAnimations.map((anim) =>
        renderAddAnimationButton(anim.type, anim.label)
      )}
      {/* List existing animations */}
      {selectedElementAnimations.map((animation) => {
        return <AnimationResource key={animation.id} animation={animation} />;
      })}
    </>
  );
});
