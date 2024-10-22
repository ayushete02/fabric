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

const CanvasPage = () => {
  return (
    <CanvasProvider>
      <div style={{ display: "flex" }}>
        <Sidebar />
        <CanvasArea />
      </div>
    </CanvasProvider>
  );
};

const CanvasArea = observer(() => {
  // const canvasRef = useRef<HTMLCanvasElement>(null);
  const store = useContext(CanvasContext);

  useEffect(() => {
    const canvas = new fabric.Canvas("canvas", {
      height: 400,
      width: 800,
      backgroundColor: "white",
    });

    // Global settings for all fabric objects
    fabric.Object.prototype.transparentCorners = false;
    fabric.Object.prototype.cornerColor = "#2BEBC8";
    fabric.Object.prototype.cornerStyle = "rect";
    fabric.Object.prototype.cornerStrokeColor = "#2BEBC8";
    fabric.Object.prototype.cornerSize = 6;

    // setCanvasInstance(canvas);
    store.setCanvas(canvas);
    return () => {
      canvas.dispose();
    };
  }, []);

  // useEffect(() => {
  //   if (canvasRef.current) {
  //     store.initializeCanvas(canvasRef.current);
  //   }

  //   return () => {
  //     store.disposeCanvas();
  //   };
  // }, [store]);

  return (
    <div>
      {/* <canvas ref={canvasRef} /> */}
      <canvas id="canvas" />
    </div>
  );
});

const Sidebar = observer(() => {
  const store = useCanvasStore();
  const selectedElement = store.selectedElement;

  const handleAddRectangle = () => {
    store.addRectangle();
  };

  const handleAddImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];

      if (file) {
        const blobUrl = URL.createObjectURL(file);

        store.addImageResource(blobUrl);

        const img = document.createElement("img");
        img.src = blobUrl;
        const id = Math.floor(Math.random() * 1000);

        img.id = `image-${id}`;
        img.setAttribute("style", "width: 100%; height:auto; display:none");

        img.onload = () => {
          document.body.appendChild(img);
          store.addImage(id);
        };
      } else {
        console.log("No file selected.");
      }
    };

    input.click();
  };

  const handleAddVideo = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*";

    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];

      if (file) {
        const videoUrl = URL.createObjectURL(file);

        store.addVideoResource(videoUrl);

        const video = document.createElement("video");
        video.src = videoUrl;
        const id = Math.floor(Math.random() * 1000);

        video.id = `video-${id}`;
        video.setAttribute("style", "width: 100%; height:auto; display:none");
        video.setAttribute("controls", "true"); // Add controls to the video

        // Use the `loadeddata` event instead of `onload`
        video.addEventListener("loadeddata", () => {
          document.body.appendChild(video);
          store.addVideo(id);
        });
      } else {
        console.log("No file selected.");
      }
    };

    input.click();
  };

  const handleAddAudio = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*";

    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];

      if (file) {
        const audioUrl = URL.createObjectURL(file);

        store.addAudioResource(audioUrl);

        const audio = document.createElement("audio");
        audio.src = audioUrl;
        const id = Math.floor(Math.random() * 1000);

        audio.id = `audio-${id}`;
        audio.setAttribute("style", "display:none");

        audio.addEventListener("loadeddata", () => {
          document.body.appendChild(audio);
          store.addAudio(id);
        });
      } else {
        console.log("No file selected.");
      }
    };

    input.click();
  };

  const Icon = store.playing ? MdPause : MdPlayArrow;
  const formattedTime = formatTimeToMinSecMili(store.currentTimeInMs);
  const formattedMaxTime = formatTimeToMinSecMili(store.maxTime);
  return (
    <div className="w-[350px]">
      <button onClick={handleAddRectangle}>Add Rectangle</button>
      <br /> <button onClick={handleAddImage}>Add Image</button>
      <br /> <button onClick={handleAddVideo}>Add Video</button>
      <br /> <button onClick={handleAddAudio}>Add Audio</button>
      <br />
      <input
        type="range"
        min={0}
        max={20000}
        value={store.currentTimeInMs}
        onChange={(e) => {
          store.handleSeek(Number(e.target.value));
        }}
      />
      <br />
      <div className="w-[200px] bg-blue-800">{store.currentTimeInMs}</div>
      <br />
      <button
        className="w-[80px] rounded  px-2 py-2"
        onClick={() => {
          store.setPlaying(!store.playing);
        }}
      >
        <Icon size="40"></Icon>
      </button>
      <div>{formattedTime}</div>
      <br />
      <br />
      <>
        <div className="text-sm px-[16px] pt-[16px] pb-[8px] font-semibold">
          Effects
        </div>
        {selectedElement &&
        (isEditorImageElement(selectedElement) ||
          isEditorVideoElement(selectedElement)) ? (
          <EffectResource editorElement={selectedElement} />
        ) : null}
      </>
      <br />
      <br />
      <AnimationsPanel />
    </div>
  );
});

export default CanvasPage;
