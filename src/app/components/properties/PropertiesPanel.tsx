// In src/components/PropertiesPanel.tsx

import React from "react";
import { observer } from "mobx-react-lite";
import {
  isEditorImageElement,
  isEditorTextElement,
  isEditorVideoElement,
} from "@/store/Store";
import { useCanvasStore } from "@/context/CanvasContext";

const PropertiesPanel = observer(() => {
  const store = useCanvasStore();
  const selectedElement = store.selectedElement;

  if (!selectedElement) return null;

  const { placement, properties } = selectedElement;

  const handlePlacementChange = (
    key: keyof typeof placement,
    value: number
  ) => {
    store.updateSelectedElementPlacement({ [key]: value });
  };

  const handlePropertiesChange = (key: string, value: any) => {
    store.updateSelectedElementProperties({ [key]: value });
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold">Properties</h3>
      <div className="space-y-4 mt-4">
        {/* Position */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Position
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              value={placement.x}
              onChange={(e) =>
                handlePlacementChange("x", parseFloat(e.target.value))
              }
              className="w-1/2 p-2 border rounded"
              placeholder="X"
            />
            <input
              type="number"
              value={placement.y}
              onChange={(e) =>
                handlePlacementChange("y", parseFloat(e.target.value))
              }
              className="w-1/2 p-2 border rounded"
              placeholder="Y"
            />
          </div>
        </div>

        {/* Dimensions */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Dimensions
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              value={placement.width}
              onChange={(e) =>
                handlePlacementChange("width", parseFloat(e.target.value))
              }
              className="w-1/2 p-2 border rounded"
              placeholder="Width"
            />
            <input
              type="number"
              value={placement.height}
              onChange={(e) =>
                handlePlacementChange("height", parseFloat(e.target.value))
              }
              className="w-1/2 p-2 border rounded"
              placeholder="Height"
            />
          </div>
        </div>

        {/* Rotation */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Rotation
          </label>
          <input
            type="number"
            value={placement.rotation}
            onChange={(e) =>
              handlePlacementChange("rotation", parseFloat(e.target.value))
            }
            className="w-full p-2 border rounded"
            placeholder="Rotation"
          />
        </div>

        {/* Opacity */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Opacity
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={selectedElement.fabricObject?.opacity || 1}
            onChange={(e) =>
              handlePropertiesChange("opacity", parseFloat(e.target.value))
            }
            className="w-full"
          />
        </div>

        {/* Border */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Border
          </label>
          <div className="flex space-x-2">
            <input
              type="color"
              value={properties.stroke || "#000000"}
              onChange={(e) => handlePropertiesChange("stroke", e.target.value)}
              className="w-1/2 p-2 border rounded"
            />
            <input
              type="number"
              value={properties.strokeWidth || 1}
              onChange={(e) =>
                handlePropertiesChange(
                  "strokeWidth",
                  parseFloat(e.target.value)
                )
              }
              className="w-1/2 p-2 border rounded"
              placeholder="Width"
            />
          </div>
        </div>

        {/* Border Radius (for rectangles) */}
        {selectedElement.type === "rectangle" && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Border Radius
            </label>
            <input
              type="number"
              value={properties.rx || 0}
              onChange={(e) =>
                handlePropertiesChange("rx", parseFloat(e.target.value))
              }
              className="w-full p-2 border rounded"
              placeholder="Radius"
            />
          </div>
        )}

        {/* Crop (for images and videos) */}
        {(isEditorImageElement(selectedElement) ||
          isEditorVideoElement(selectedElement)) && (
          <div>
            {!store.isCropping ? (
              <button
                className="w-full bg-gray-500 text-white rounded-md px-4 py-2 hover:bg-gray-600"
                onClick={() => store.startCropping()}
              >
                Crop
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  className="w-full bg-green-500 text-white rounded-md px-4 py-2 hover:bg-green-600"
                  onClick={() => store.applyCrop()}
                >
                  Apply Crop
                </button>
                <button
                  className="w-full bg-red-500 text-white rounded-md px-4 py-2 hover:bg-red-600"
                  onClick={() => store.cancelCrop()}
                >
                  Cancel Crop
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default PropertiesPanel;
