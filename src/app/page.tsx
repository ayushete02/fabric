"use client";

import React, { useEffect, useContext } from "react";
import {
  CanvasContext,
  CanvasProvider,
  useCanvasStore,
} from "../context/CanvasContext";
import { MdPlayArrow, MdPause } from "react-icons/md";
import { observer } from "mobx-react-lite";
import { fabric } from "fabric";
import { formatTimeToMinSecMili, isHtmlImageElement } from "@/utils";
import { isEditorImageElement, isEditorVideoElement } from "@/store/Store";
import { EffectResource } from "./components/effects/EffectResource";
import { AnimationsPanel } from "./components/animation/AnimationsPanel";
import { TextResourcesPanel } from "./components/text/TextResourcesPanel";
import { TextEditor } from "./components/text/TextEditor";
import PropertiesPanel from "./components/properties/PropertiesPanel";

const CanvasPage = () => {
  return (
    <CanvasProvider>
      <div className="flex  max-h-screen">
        <Sidebar />
        <CanvasArea />
      </div>
    </CanvasProvider>
  );
};

const CanvasArea = observer(() => {
  const store = useContext(CanvasContext);

  useEffect(() => {
    const canvas = new fabric.Canvas("canvas", {
      height: 600,
      width: 600,
      backgroundColor: "white",
    });

    fabric.Object.prototype.transparentCorners = false;
    fabric.Object.prototype.cornerColor = "#ffffff";
    fabric.Object.prototype.cornerStyle = "rect";
    fabric.Object.prototype.cornerStrokeColor = "#2BEBC8";
    fabric.Object.prototype.cornerSize = 6;

    store.setCanvas(canvas);

    // Add event listener to handle clicks inside the canvas, but outside of any selected object
    const handleClickOutside = (e) => {
      const canvasElement = document.getElementById("canvas");

      // Check if the click is outside the canvas element
      if (!canvasElement.contains(e.target)) {
        return; // Clicked outside the canvas, don't discard selection
      }

      // If the click is inside the canvas but no object is selected, discard the selection
      if (!canvas.getActiveObject()) {
        canvas.discardActiveObject().renderAll();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      canvas.dispose();
    };
  }, []);

  return (
    <div className="flex-1 w-full  flex justify-center items-center bg-gray-100 p-4">
      <canvas id="canvas" className="border-2 border-gray-400 shadow-lg" />
    </div>
  );
});

const Sidebar = observer(() => {
  const store = useCanvasStore();
  const selectedElement = store.selectedElement;

  const handleFileSelection = (
    accept: string,
    callback: (file: File, id: number) => void
  ) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const id = Math.floor(Math.random() * 1000);
        callback(file, id);
      } else {
        console.log("No file selected.");
      }
    };
    input.click();
  };

  const handleAddImage = () => {
    handleFileSelection("image/*", (file, id) => {
      const blobUrl = URL.createObjectURL(file);
      store.addImageResource(blobUrl);

      const img = document.createElement("img");
      img.src = blobUrl;
      img.id = `image-${id}`;
      img.setAttribute("style", "width: 100%; height:auto; display:none");
      img.onload = () => {
        document.body.appendChild(img);
        store.addImage(id);
      };
    });
  };

  const handleAddVideo = () => {
    handleFileSelection("video/*", (file, id) => {
      const videoUrl = URL.createObjectURL(file);
      store.addVideoResource(videoUrl);

      const video = document.createElement("video");
      video.src = videoUrl;
      video.id = `video-${id}`;
      video.setAttribute("style", "width: 100%; height:auto; display:none");
      video.setAttribute("controls", "true");

      video.addEventListener("loadeddata", () => {
        document.body.appendChild(video);
        store.addVideo(id);
      });
    });
  };

  const handleAddAudio = () => {
    handleFileSelection("audio/*", (file, id) => {
      const audioUrl = URL.createObjectURL(file);
      store.addAudioResource(audioUrl);

      const audio = document.createElement("audio");
      audio.src = audioUrl;
      audio.id = `audio-${id}`;
      audio.setAttribute("style", "display:none");

      audio.addEventListener("loadeddata", () => {
        document.body.appendChild(audio);
        store.addAudio(id);
      });
    });
  };

  const Icon = store.playing ? MdPause : MdPlayArrow;
  const formattedTime = formatTimeToMinSecMili(store.currentTimeInMs);

  return (
    <div className="max-w-96 w-full overflow-y-auto bg-black shadow-lg p-4 border-r border-gray-200">
      <h2 className="text-xl font-bold mb-4">Canvas Controls</h2>
      {!selectedElement && (
        <div className="space-y-4">
          <button
            className="w-full bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-600"
            onClick={store.addRectangle}
          >
            Add Rectangle
          </button>
          <button
            className="w-full bg-green-500 text-white rounded-md px-4 py-2 hover:bg-green-600"
            onClick={handleAddImage}
          >
            Add Image
          </button>
          <button
            className="w-full bg-indigo-500 text-white rounded-md px-4 py-2 hover:bg-indigo-600"
            onClick={handleAddVideo}
          >
            Add Video
          </button>
          <button
            className="w-full bg-purple-500 text-white rounded-md px-4 py-2 hover:bg-purple-600"
            onClick={handleAddAudio}
          >
            Add Audio
          </button>
        </div>
      )}

      <div className="my-6">
        <input
          type="range"
          min={0}
          max={store.maxTime}
          value={store.currentTimeInMs}
          className="w-full"
          onChange={(e) => store.handleSeek(Number(e.target.value))}
        />
        <div className="text-center mt-2 text-sm">{formattedTime}</div>
      </div>
      <button
        className="w-full bg-red-500 text-white rounded-md px-4 py-2 hover:bg-red-600"
        onClick={() => store.setPlaying(!store.playing)}
      >
        <Icon size="24" />
      </button>
      {selectedElement && (
        <>
          <PropertiesPanel />
        </>
      )}
      {selectedElement &&
        (isEditorImageElement(selectedElement) ||
          isEditorVideoElement(selectedElement)) && (
          <>
            <div className="mt-6">
              <h3 className="text-lg font-semibold">Effects</h3>

              <EffectResource editorElement={selectedElement} />
            </div>
            <div className="mt-6">
              <AnimationsPanel />
            </div>
          </>
        )}
      <div className="mt-6">
        {!selectedElement && <TextResourcesPanel />}
        <TextEditor />
      </div>
    </div>
  );
});

export default CanvasPage;
