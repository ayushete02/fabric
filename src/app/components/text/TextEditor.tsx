"use client";
import React, { useState, useEffect } from "react";
import { useCanvasStore } from "@/context/CanvasContext";
import { observer } from "mobx-react-lite";

export const TextEditor = observer(() => {
  const store = useCanvasStore();
  const selectedElement = store.selectedElement;

  // Initialize state with default values
  const [fontSize, setFontSize] = useState(14);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [textColor, setTextColor] = useState("#000000");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [transparent, setTransparent] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [fontWeight, setFontWeight] = useState(400);

  // Update state when the selected element changes
  useEffect(() => {
    if (selectedElement && selectedElement.type === "text") {
      setFontSize(selectedElement.properties.fontSize);
      setFontFamily(selectedElement.properties.fontFamily || "Arial");
      setTextColor(selectedElement.properties.fill || "#000000");
      setBackgroundColor(
        selectedElement.properties.backgroundColor || "#ffffff"
      );
      setTransparent(
        selectedElement.properties.backgroundColor === "transparent"
      );
      setItalic(selectedElement.properties.italic || false);
      setUnderline(selectedElement.properties.underline || false);
      setFontWeight(selectedElement.properties.fontWeight);
    }
  }, [selectedElement]);

  // If no text element is selected, return null to not render the editor
  if (!selectedElement || selectedElement.type !== "text") return null;

  const handleUpdateText = () => {
    store.updateEditorElement({
      ...selectedElement,
      properties: {
        ...selectedElement.properties,
        fontSize,
        fontFamily,
        fill: textColor,
        backgroundColor: transparent ? "transparent" : backgroundColor,
        italic,
        underline,
        fontWeight,
      },
    });
  };

  const handleBackgroundColorChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setBackgroundColor(e.target.value);
    setTransparent(false); // Uncheck "Transparent" if a color is selected
  };

  const handleTransparentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTransparent(e.target.checked);
    if (e.target.checked) {
      setBackgroundColor("transparent"); // Set backgroundColor to transparent
    }
  };

  return (
    <div className="bg-black p-4 rounded shadow-lg">
      <h3 className="text-lg font-bold mb-4">Text Editor</h3>
      <div className="flex flex-col space-y-2">
        <label>
          Font Size:
          <input
            type="number"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full border px-2 py-1"
          />
        </label>
        <label>
          Font Family:
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="w-full border px-2 py-1"
          >
            <option value="Arial">Arial</option>
            <option value="Verdana">Verdana</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
          </select>
        </label>
        <label>
          Text Color:
          <input
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            className="w-full"
          />
        </label>
        <label>
          Background Color:
          <input
            type="color"
            value={backgroundColor}
            onChange={handleBackgroundColorChange}
            className="w-full"
            disabled={transparent} // Disable if transparent is checked
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={transparent}
            onChange={handleTransparentChange}
          />{" "}
          Transparent
        </label>
        <label>
          Font Weight:
          <select
            value={fontWeight}
            onChange={(e) => setFontWeight(Number(e.target.value))}
            className="w-full border px-2 py-1"
          >
            <option value={100}>Thin</option>
            <option value={300}>Light</option>
            <option value={400}>Normal</option>
            <option value={600}>Semi-Bold</option>
            <option value={800}>Bold</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={italic}
            onChange={(e) => setItalic(e.target.checked)}
          />{" "}
          Italic
        </label>

        <label>
          <input
            type="checkbox"
            checked={underline}
            onChange={(e) => setUnderline(e.target.checked)}
          />{" "}
          Underline
        </label>
        <button
          onClick={handleUpdateText}
          className="bg-blue-500 text-white rounded px-2 py-1 mt-2"
        >
          Update Text
        </button>
      </div>
    </div>
  );
});
