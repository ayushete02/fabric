// src/components/EffectResource.tsx

import React from "react";
import {
  VideoEditorElement,
  ImageEditorElement,
  Effects,
} from "@/fabric-types";
import { observer } from "mobx-react-lite";
import { useCanvasStore } from "@/context/CanvasContext";

export type EffectResourceProps = {
  editorElement: VideoEditorElement | ImageEditorElement;
};

export const EffectResource = observer(
  ({ editorElement }: EffectResourceProps) => {
    const store = useCanvasStore();

    const handleFilterToggle = (
      filterName: keyof Effects,
      isChecked: boolean
    ) => {
      store.updateEffect(editorElement.id, filterName, {
        enabled: isChecked,
      });
    };

    const handleFilterValueChange = (
      filterName: keyof Effects,
      prop: string,
      value: number | string
    ) => {
      store.updateFilterValue(editorElement.id, filterName, prop, value);
    };

    const { effects } = editorElement.properties;

    return (
      <div className="rounded-lg overflow-hidden items-center bg-slate-800 m-[15px] flex flex-col relative min-h-[100px] p-2">
        <div className="text-white py-1 text-base text-left w-full">
          Filters
        </div>

        <div className="flex flex-col space-y-4">
          {/* Brightness */}
          <div>
            <input
              type="checkbox"
              checked={!!effects.brightness?.enabled}
              onChange={(e) =>
                handleFilterToggle("brightness", e.target.checked)
              }
            />
            <label className="ml-2">Brightness</label>
            {effects.brightness?.enabled && (
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={effects.brightness?.properties?.value || 1}
                onChange={(e) =>
                  handleFilterValueChange(
                    "brightness",
                    "value",
                    parseFloat(e.target.value)
                  )
                }
              />
            )}
          </div>

          {/* Gamma */}
          <div>
            <input
              type="checkbox"
              checked={!!effects.gamma?.enabled}
              onChange={(e) => handleFilterToggle("gamma", e.target.checked)}
            />
            <label className="ml-2">Gamma</label>
            {effects.gamma?.enabled && (
              <div>
                <label>Red:</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={effects.gamma?.properties?.red || 1}
                  onChange={(e) =>
                    handleFilterValueChange(
                      "gamma",
                      "red",
                      parseFloat(e.target.value)
                    )
                  }
                />
                <label>Green:</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={effects.gamma?.properties?.green || 1}
                  onChange={(e) =>
                    handleFilterValueChange(
                      "gamma",
                      "green",
                      parseFloat(e.target.value)
                    )
                  }
                />
                <label>Blue:</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={effects.gamma?.properties?.blue || 1}
                  onChange={(e) =>
                    handleFilterValueChange(
                      "gamma",
                      "blue",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </div>
            )}
          </div>

          {/* Contrast */}
          <div>
            <input
              type="checkbox"
              checked={!!effects.contrast?.enabled}
              onChange={(e) => handleFilterToggle("contrast", e.target.checked)}
            />
            <label className="ml-2">Contrast</label>
            {effects.contrast?.enabled && (
              <input
                type="range"
                min="-1"
                max="1"
                step="0.1"
                value={effects.contrast?.properties?.value || 0}
                onChange={(e) =>
                  handleFilterValueChange(
                    "contrast",
                    "value",
                    parseFloat(e.target.value)
                  )
                }
              />
            )}
          </div>

          {/* Saturation */}
          <div>
            <input
              type="checkbox"
              checked={!!effects.saturation?.enabled}
              onChange={(e) =>
                handleFilterToggle("saturation", e.target.checked)
              }
            />
            <label className="ml-2">Saturation</label>
            {effects.saturation?.enabled && (
              <input
                type="range"
                min="-1"
                max="1"
                step="0.1"
                value={effects.saturation?.properties?.value || 0}
                onChange={(e) =>
                  handleFilterValueChange(
                    "saturation",
                    "value",
                    parseFloat(e.target.value)
                  )
                }
              />
            )}
          </div>

          {/* Sepia */}
          <div>
            <input
              type="checkbox"
              checked={!!effects.sepia?.enabled}
              onChange={(e) => handleFilterToggle("sepia", e.target.checked)}
            />
            <label className="ml-2">Sepia</label>
          </div>

          {/* Invert */}
          <div>
            <input
              type="checkbox"
              checked={!!effects.invert?.enabled}
              onChange={(e) => handleFilterToggle("invert", e.target.checked)}
            />
            <label className="ml-2">Invert</label>
          </div>

          {/* Blur */}
          <div>
            <input
              type="checkbox"
              checked={!!effects.blur?.enabled}
              onChange={(e) => handleFilterToggle("blur", e.target.checked)}
            />
            <label className="ml-2">Blur</label>
            {effects.blur?.enabled && (
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={effects.blur?.properties?.value || 0}
                onChange={(e) =>
                  handleFilterValueChange(
                    "blur",
                    "value",
                    parseFloat(e.target.value)
                  )
                }
              />
            )}
          </div>

          {/* Pixelate */}
          <div>
            <input
              type="checkbox"
              checked={!!effects.pixelate?.enabled}
              onChange={(e) => handleFilterToggle("pixelate", e.target.checked)}
            />
            <label className="ml-2">Pixelate</label>
            {effects.pixelate?.enabled && (
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={effects.pixelate?.properties?.value || 4}
                onChange={(e) =>
                  handleFilterValueChange(
                    "pixelate",
                    "blocksize",
                    parseInt(e.target.value, 10)
                  )
                }
              />
            )}
          </div>

          {/* Noise */}
          <div>
            <input
              type="checkbox"
              checked={!!effects.noise?.enabled}
              onChange={(e) => handleFilterToggle("noise", e.target.checked)}
            />
            <label className="ml-2">Noise</label>
            {effects.noise?.enabled && (
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={effects.noise?.properties?.value || 0}
                onChange={(e) =>
                  handleFilterValueChange(
                    "noise",
                    "noise",
                    parseInt(e.target.value, 10)
                  )
                }
              />
            )}
          </div>

          {/* Gamma */}
          {/* Already handled above */}

          {/* Remove Color */}
          <div>
            <input
              type="checkbox"
              checked={!!effects.removeColor?.enabled}
              onChange={(e) =>
                handleFilterToggle("removeColor", e.target.checked)
              }
            />
            <label className="ml-2">Remove Color</label>
            {effects.removeColor?.enabled && (
              <div>
                <label>Color:</label>
                <input
                  type="color"
                  value={effects.removeColor?.properties?.color || "#ffffff"}
                  onChange={(e) =>
                    handleFilterValueChange(
                      "removeColor",
                      "color",
                      e.target.value
                    )
                  }
                />
                <label>Distance:</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={effects.removeColor?.properties?.distance || 0.1}
                  onChange={(e) =>
                    handleFilterValueChange(
                      "removeColor",
                      "distance",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </div>
            )}
          </div>

          {/* Blend Color */}
          <div>
            <input
              type="checkbox"
              checked={!!effects.blendColor?.enabled}
              onChange={(e) =>
                handleFilterToggle("blendColor", e.target.checked)
              }
            />
            <label className="ml-2">Blend Color</label>
            {effects.blendColor?.enabled && (
              <div>
                <label>Mode:</label>
                <select
                  value={effects.blendColor?.properties?.mode || "multiply"}
                  onChange={(e) =>
                    handleFilterValueChange(
                      "blendColor",
                      "mode",
                      e.target.value
                    )
                  }
                >
                  <option value="multiply">Multiply</option>
                  <option value="screen">Screen</option>
                  {/* Add more modes as needed */}
                </select>
                <label>Color:</label>
                <input
                  type="color"
                  value={effects.blendColor?.properties?.color || "#ffffff"}
                  onChange={(e) =>
                    handleFilterValueChange(
                      "blendColor",
                      "color",
                      e.target.value
                    )
                  }
                />
                <label>Alpha:</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={effects.blendColor?.properties?.alpha || 1}
                  onChange={(e) =>
                    handleFilterValueChange(
                      "blendColor",
                      "alpha",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </div>
            )}
          </div>

          {/* Hue */}
          <div>
            <input
              type="checkbox"
              checked={!!effects.hue?.enabled}
              onChange={(e) => handleFilterToggle("hue", e.target.checked)}
            />
            <label className="ml-2">Hue Rotation</label>
            {effects.hue?.enabled && (
              <input
                type="range"
                min="0"
                max="6.28319" // 2π radians
                step="0.1"
                value={effects.hue?.properties?.value || 0}
                onChange={(e) =>
                  handleFilterValueChange(
                    "hue",
                    "rotation",
                    parseFloat(e.target.value)
                  )
                }
              />
            )}
          </div>

          {/* Add more effects similarly */}
        </div>
      </div>
    );
  }
);
