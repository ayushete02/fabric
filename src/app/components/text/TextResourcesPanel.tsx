"use client";
import { observer } from "mobx-react-lite";
import React from "react";
import { TextResource } from "./TextResource";

const TEXT_RESOURCES = [
  {
    name: "Title",
    fontSize: 28,
    fontWeight: 600,
    fontFamily: "Arial",
    backgroundColor: "#ffffff",
    underline: true,
    italic: false,
    upperCase: false,
    lowerCase: true,
    textAlign: "center",
  },
  {
    name: "Subtitle",
    fontSize: 16,
    fontWeight: 600,
    fontFamily: "Verdana",
    backgroundColor: "#f0f0f0",
    underline: false,
    italic: true,
    upperCase: false,
    lowerCase: false,
    textAlign: "left",
  },
  {
    name: "Body",
    fontSize: 14,
    fontWeight: 400,
    fontFamily: "Helvetica",
    backgroundColor: "transparent",
    underline: false,
    italic: false,
    upperCase: false,
    lowerCase: false,
    textAlign: "left",
  },
  {
    name: "Caption",
    fontSize: 12,
    fontWeight: 400,
    fontFamily: "Times New Roman",
    backgroundColor: "#e0e0e0",
    underline: false,
    italic: false,
    upperCase: false,
    lowerCase: true,
    textAlign: "right",
  },
  {
    name: "Heading 1",
    fontSize: 24,
    fontWeight: 800,
    fontFamily: "Courier New",
    backgroundColor: "#ffffff",
    underline: false,
    italic: false,
    upperCase: true,
    lowerCase: false,
    textAlign: "center",
  },
  {
    name: "Heading 2",
    fontSize: 20,
    fontWeight: 800,
    fontFamily: "Georgia",
    backgroundColor: "transparent",
    underline: false,
    italic: true,
    upperCase: false,
    lowerCase: false,
    textAlign: "left",
  },
  {
    name: "Heading 3",
    fontSize: 18,
    fontWeight: 800,
    fontFamily: "Verdana",
    backgroundColor: "transparent",
    underline: true,
    italic: false,
    upperCase: false,
    lowerCase: false,
    textAlign: "center",
  },
  // Add more resources as needed
];

export const TextResourcesPanel = observer(() => {
  return (
    <div className="bg-slate-200 h-full">
      <div className="text-sm px-[16px] pt-[16px] pb-[8px] font-semibold text-black">
        Text
      </div>
      <ul>
        {TEXT_RESOURCES.map((resource) => {
          return (
            <li key={resource.name}>
              <TextResource
                sampleText={resource.name}
                fontSize={resource.fontSize}
                fontWeight={resource.fontWeight}
                fontFamily={resource.fontFamily}
                backgroundColor={resource.backgroundColor}
                underline={resource.underline}
                italic={resource.italic}
                lowerCase={resource.lowerCase}
                textAlign={resource.textAlign as "center" | "left" | "right"}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
});
