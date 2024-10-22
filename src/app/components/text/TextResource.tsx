"use client";
import React from "react";
import { MdAdd } from "react-icons/md";
import { useCanvasStore } from "@/context/CanvasContext";
import { observer } from "mobx-react-lite";

type TextResourceProps = {
  fontSize: number;
  fontWeight: number;
  sampleText: string;
  fontFamily?: string;
  backgroundColor?: string;
  underline?: boolean;
  italic?: boolean;
  upperCase?: boolean;
  fill?: string;
  lowerCase?: boolean;
  textAlign?: "left" | "center" | "right";
};

export const TextResource = observer(
  ({
    fontSize,
    fontWeight,
    sampleText,
    fontFamily = "Arial",
    backgroundColor = "#ffffff",
    underline = false,
    italic = false,
    upperCase = false,
    lowerCase = false,
    fill = "#000000",
    textAlign = "left",
  }: TextResourceProps) => {
    const store = useCanvasStore();

    const handleAddText = () => {
      store.addText({
        text: upperCase
          ? sampleText.toUpperCase()
          : lowerCase
          ? sampleText.toLowerCase()
          : sampleText,
        fontSize,
        fontWeight,
        fontFamily,
        fill,
        backgroundColor,
        underline,
        italic,
        textAlign,
      });
    };

    return (
      <div className="items-center  text-black m-[15px]  flex flex-row">
        <div
          className="flex-1 px-2 py-1"
          style={{
            fontSize: `${fontSize}px`,
            fontWeight: `${fontWeight}`,
            fontFamily,
            backgroundColor,
            textDecoration: underline ? "underline" : "none",
            fontStyle: italic ? "italic" : "normal",
            textAlign,
          }}
        >
          {sampleText}
        </div>
        <button
          className="h-[32px] w-[32px] hover:bg-black bg-[rgba(0,0,0,.25)] rounded z-10 text-white font-bold py-1 flex items-center justify-center"
          onClick={handleAddText}
        >
          <MdAdd size="25" />
        </button>
      </div>
    );
  }
);
