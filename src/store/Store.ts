// src/store/Store.ts

import { makeAutoObservable } from "mobx";
import { fabric } from "fabric";
import {
  AudioEditorElement,
  EditorElement,
  MenuOption,
  Placement,
  TimeFrame,
  VideoEditorElement,
} from "@/fabric-types";
import {
  isHtmlAudioElement,
  isHtmlImageElement,
  isHtmlVideoElement,
} from "@/utils";

export class Store {
  canvas: fabric.Canvas | null = null;
  backgroundColor: string = "#f3f3f3";
  editorElements: EditorElement[] = [];

  selectedMenuOption: MenuOption;
  audios: string[];
  videos: string[];
  images: string[];
  selectedElement: EditorElement | null;

  maxTime: number;
  // animations: Animation[];
  // animationTimeLine: anime.AnimeTimelineInstance;
  playing: boolean;

  currentKeyFrame: number;
  fps: number;

  possibleVideoFormats: string[] = ["mp4", "webm"];
  selectedVideoFormat: "mp4" | "webm";

  constructor() {
    this.canvas = null;
    this.videos = [];
    this.images = [];
    this.audios = [];
    this.backgroundColor = "#111111";
    this.maxTime = 30 * 1000;
    this.playing = false;
    this.currentKeyFrame = 0;
    this.selectedElement = null;
    this.fps = 60;
    // this.animations = [];
    // this.animationTimeLine = anime.timeline();
    this.selectedMenuOption = "Video";
    this.selectedVideoFormat = "mp4";
    makeAutoObservable(this);
  }

  get currentTimeInMs() {
    return (this.currentKeyFrame * 1000) / this.fps;
  }

  setCurrentTimeInMs(time: number) {
    this.currentKeyFrame = Math.floor((time / 1000) * this.fps);
  }

  setCanvas(canvas: fabric.Canvas | null) {
    this.canvas = canvas;
    if (canvas) {
      canvas.backgroundColor = this.backgroundColor;
    }
  }

  updateEditorElementTimeFrame(
    editorElement: EditorElement,
    timeFrame: Partial<TimeFrame>
  ) {
    if (timeFrame.start != undefined && timeFrame.start < 0) {
      timeFrame.start = 0;
    }
    if (timeFrame.end != undefined && timeFrame.end > this.maxTime) {
      timeFrame.end = this.maxTime;
    }
    const newEditorElement = {
      ...editorElement,
      timeFrame: {
        ...editorElement.timeFrame,
        ...timeFrame,
      },
    };
    this.updateVideoElements();
    this.updateAudioElements();
    this.updateEditorElement(newEditorElement);
    // this.refreshAnimations();
  }

  addElement(element: EditorElement) {
    this.editorElements.push(element);
    this.refreshElements();
  }

  setSelectedElement(selectedElement: EditorElement | null) {
    this.selectedElement = selectedElement;
    if (this.canvas) {
      if (selectedElement?.fabricObject)
        this.canvas.setActiveObject(selectedElement.fabricObject);
      else this.canvas.discardActiveObject();
    }
  }

  addImageResource(image: string) {
    this.images = [...this.images, image];
  }

  addVideoResource(video: string) {
    this.videos = [...this.videos, video];
  }

  addAudioResource(audio: string) {
    this.audios = [...this.audios, audio];
  }

  refreshElements() {
    const store = this;
    if (!store.canvas) return;
    const canvas = store.canvas;
    canvas.remove(...canvas.getObjects());
    for (let index = 0; index < store.editorElements.length; index++) {
      const element = store.editorElements[index];
      switch (element.type) {
        case "rectangle":
          const rect = new fabric.Rect({
            left: element.placement.x,
            top: element.placement.y,
            width: element.placement.width,
            height: element.placement.height,
            fill: element.properties.fill || "red",
            angle: element.placement.rotation,
            scaleX: element.placement.scaleX,
            scaleY: element.placement.scaleY,
          });
          element.fabricObject = rect;
          this.canvas?.add(rect);
          break;

        case "video": {
          const videoElement = document.getElementById(
            element.properties.elementId
          );
          if (videoElement == null || !isHtmlVideoElement(videoElement))
            continue;

          // Ensure the video element has dimensions set correctly
          videoElement.width =
            element.placement.width ?? videoElement.videoWidth;
          videoElement.height =
            element.placement.height ?? videoElement.videoHeight;

          // Create a fabric.Image object using the video element as a source
          const videoObject = new fabric.Image(videoElement, {
            left: element.placement.x,
            top: element.placement.y,
            angle: element.placement.rotation,
            originX: "left",
            originY: "top",
            // objectCaching: false,
            // selectable: true,
            // lockUniScaling: true,
            // scaleX: element.placement.scaleX,
            // scaleY: element.placement.scaleY,
          });

          // Calculate desired scaling
          const desiredWidth =
            element.placement.width ?? videoElement.videoWidth;
          const desiredHeight =
            element.placement.height ?? videoElement.videoHeight;
          const scaleX = desiredWidth / videoElement.videoWidth;
          const scaleY = desiredHeight / videoElement.videoHeight;

          const finalScaleX = scaleX * (element.placement.scaleX ?? 1);
          const finalScaleY = scaleY * (element.placement.scaleY ?? 1);

          videoObject.set({
            scaleX: finalScaleX,
            scaleY: finalScaleY,
          });

          canvas.add(videoObject);

          // Store the fabric object
          element.fabricObject = videoObject;
          element.properties.imageObject = videoObject;

          // Event handler for when the video object is modified
          videoObject.on("modified", function (e) {
            if (e.target != videoObject) return;
            const target = e.target;
            const placement = element.placement;

            const image = {
              w: videoElement.videoWidth,
              h: videoElement.videoHeight,
            };
            const toScale = {
              x: element.placement.width / image.w,
              y: element.placement.height / image.h,
            };

            let finalScale = 1;
            if (target.scaleX && target.scaleX > 0) {
              finalScale = target.scaleX / toScale.x;
            }

            const newPlacement = {
              ...placement,
              x: target.left ?? placement.x,
              y: target.top ?? placement.y,
              rotation: target.angle ?? placement.rotation,
              width: target.width ? target.width : placement.width,
              height: target.height ? target.height : placement.height,
              scaleX: finalScale,
              scaleY: finalScale,
            };

            const newElement = {
              ...element,
              placement: newPlacement,
            };

            store.updateEditorElement(newElement);
          });

          break;
        }

        case "image": {
          const imageElement = document.getElementById(
            element.properties.elementId
          );
          if (!isHtmlImageElement(imageElement)) continue;
          const imageUrl = element.properties.src;
          fabric.Image.fromURL(
            imageUrl,
            (img) => {
              // Set initial position, rotation, and origin
              img.set({
                left: element.placement.x,
                top: element.placement.y,
                angle: element.placement.rotation,
                originX: "left",
                originY: "top",
              });

              // Calculate desired scaling
              const desiredWidth = element.placement.width ?? img.width;
              const desiredHeight = element.placement.height ?? img.height;
              const scaleX = desiredWidth / img.width;
              const scaleY = desiredHeight / img.height;

              const finalScaleX = scaleX * (element.placement.scaleX ?? 1);
              const finalScaleY = scaleY * (element.placement.scaleY ?? 1);

              img.set({
                scaleX: finalScaleX,
                scaleY: finalScaleY,
              });
              canvas.add(img);

              // Store the fabric object
              element.fabricObject = img;

              // Event handler for when the image is modified
              img.on("modified", function (e) {
                if (!e.target) return;
                const target = e.target;
                if (target != img) return;
                const placement = element.placement;

                let finalScale = 1;
                if (target.scaleX && target.scaleX > 0) {
                  finalScale = target.scaleX / (desiredWidth / img.width);
                }

                const newPlacement: Placement = {
                  ...placement,
                  x: target.left ?? placement.x,
                  y: target.top ?? placement.y,
                  rotation: target.angle ?? placement.rotation,
                  scaleX: finalScale,
                  scaleY: finalScale,
                  width: placement.width ?? target.width,
                  height: placement.height ?? target.height,
                };

                const newElement = {
                  ...element,
                  placement: newPlacement,
                };

                store.updateEditorElement(newElement);
              });
            },
            { crossOrigin: "anonymous" }
          );
          break;
        }

        case "audio": {
          // Audio elements don't have a visual representation on the canvas,
          // so we don't need to add anything to the canvas here.
          // However, you might want to show an icon or waveform in the future.
          break;
        }

        default: {
          throw new Error(`Element type "${element.type}" not implemented`);
        }
      }

      if (element.fabricObject) {
        element.fabricObject.on("selected", function (e) {
          store.setSelectedElement(element);
        });
      }
    }

    const selectedEditorElement = store.selectedElement;
    if (selectedEditorElement && selectedEditorElement.fabricObject) {
      canvas.setActiveObject(selectedEditorElement.fabricObject);
    }
    // this.refreshAnimations();
    this.updateTimeTo(this.currentTimeInMs);
    store.canvas.renderAll();
  }

  updateSelectedElement() {
    this.selectedElement =
      this.editorElements.find(
        (element) => element.id === this.selectedElement?.id
      ) ?? null;
  }

  setEditorElements(editorElements: EditorElement[]) {
    this.editorElements = editorElements;
    this.updateSelectedElement();
    this.refreshElements();
    // this.refreshAnimations();
  }

  updateEditorElement(editorElement: EditorElement) {
    this.setEditorElements(
      this.editorElements.map((element) =>
        element.id === editorElement.id ? editorElement : element
      )
    );
  }

  setMaxTime(maxTime: number) {
    this.maxTime = maxTime;
  }

  setPlaying(playing: boolean) {
    this.playing = playing;
    // this.updateVideoElements();
    // this.updateAudioElements();
    if (playing) {
      this.startedTime = Date.now();
      this.startedTimePlay = this.currentTimeInMs;
      requestAnimationFrame(() => {
        this.playFrames();
      });
    } else {
      // Ensure that videos and audios are paused when not playing
      this.updateVideoElements();
      this.updateAudioElements();
    }
  }

  startedTime = 0;
  startedTimePlay = 0;

  playFrames() {
    if (!this.playing) {
      return;
    }
    const elapsedTime = Date.now() - this.startedTime;
    const newTime = this.startedTimePlay + elapsedTime;
    this.updateTimeTo(newTime);
    if (newTime > this.maxTime) {
      this.currentKeyFrame = 0;
      this.setPlaying(false);
    } else {
      requestAnimationFrame(() => {
        this.playFrames();
      });
    }
  }

  updateTimeTo(newTime: number) {
    this.setCurrentTimeInMs(newTime);
    if (this.canvas) {
      this.canvas.backgroundColor = this.backgroundColor;
    }
    this.editorElements.forEach((e) => {
      if (!e.fabricObject) return;
      const isInside =
        e.timeFrame.start <= newTime && newTime <= e.timeFrame.end;
      e.fabricObject.visible = isInside;
    });
    this.canvas?.renderAll();
    this.updateVideoElements();
    this.updateAudioElements();
  }

  handleSeek(seek: number) {
    if (this.playing) {
      this.setPlaying(false);
    }
    this.updateTimeTo(seek);
    this.updateVideoElements();
    this.updateAudioElements();
  }

  addRectangle() {
    const rectangleElement: EditorElement = {
      id: getUid(),
      type: "rectangle",
      name: "Rectangle",
      placement: {
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      },
      timeFrame: {
        start: 0,
        end: 5000,
      },
      properties: {
        fill: "red",
      },
    };

    this.addElement(rectangleElement);
  }

  addImage(index: number) {
    const imageElement = document.getElementById(`image-${index}`);
    if (!isHtmlImageElement(imageElement)) {
      return;
    }
    const aspectRatio = imageElement.naturalWidth / imageElement.naturalHeight;
    const id = getUid();
    this.addElement({
      id: `image-${index}`,
      name: `Media(image) ${index + 1}`,
      type: "image",
      placement: {
        x: 0,
        y: 0,
        width: 100 * aspectRatio,
        height: 100,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      },
      timeFrame: {
        start: 0,
        end: 5000,
      },
      properties: {
        elementId: `image-${index}`,
        src: imageElement.src,
        effect: {
          type: "none",
        },
      },
    });
  }

  addVideo(index: number) {
    const videoElement = document.getElementById(`video-${index}`);
    if (!isHtmlVideoElement(videoElement)) {
      return;
    }
    const videoDurationMs = videoElement.duration * 1000;
    const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;
    const id = getUid();
    this.addElement({
      id: `video-${index}`,
      name: `Media(video) ${index + 1}`,
      type: "video",
      placement: {
        x: 0,
        y: 0,
        width: 100 * aspectRatio,
        height: 100,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      },
      timeFrame: {
        start: 2000,
        end: 6000,
        // end: videoDurationMs,
      },
      properties: {
        elementId: `video-${index}`,
        src: videoElement.src,
        effect: {
          type: "none",
        },
      },
    });
  }

  addAudio(index: number) {
    const audioElement = document.getElementById(`audio-${index}`);
    if (!isHtmlAudioElement(audioElement)) {
      return;
    }
    const audioDurationMs = audioElement.duration * 1000;
    const id = getUid();
    this.addElement({
      id: `audio-${index}`,
      name: `Media(audio) ${index + 1}`,
      type: "audio",
      placement: {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      },
      timeFrame: {
        start: 5000,
        end: 10000,
        // end: audioDurationMs,
      },
      properties: {
        elementId: `audio-${index}`,
        src: audioElement.src,
        effect: {
          type: "none",
        },
      },
    });
  }

  updateVideoElements() {
    this.editorElements
      .filter(
        (element): element is VideoEditorElement => element.type === "video"
      )
      .forEach((element) => {
        const video = document.getElementById(element.properties.elementId);
        if (isHtmlVideoElement(video)) {
          const isInside =
            this.currentTimeInMs >= element.timeFrame.start &&
            this.currentTimeInMs <= element.timeFrame.end;

          if (isInside) {
            let videoTime =
              (this.currentTimeInMs - element.timeFrame.start) / 1000;
            videoTime = Math.max(0, Math.min(videoTime, video.duration));

            if (Math.abs(video.currentTime - videoTime) > 0.1) {
              video.currentTime = videoTime;
            }

            if (this.playing && video.paused) {
              video.play();
            } else if (!this.playing && !video.paused) {
              video.pause();
            }

            if (
              videoTime >= video.duration ||
              this.currentTimeInMs >= element.timeFrame.end
            ) {
              video.pause();
            }
          } else {
            video.pause();
          }
        }
      });
  }

  updateAudioElements() {
    this.editorElements
      .filter(
        (element): element is AudioEditorElement => element.type === "audio"
      )
      .forEach((element) => {
        const audio = document.getElementById(element.properties.elementId);
        if (isHtmlAudioElement(audio)) {
          const isInside =
            this.currentTimeInMs >= element.timeFrame.start &&
            this.currentTimeInMs <= element.timeFrame.end;

          if (isInside) {
            let audioTime =
              (this.currentTimeInMs - element.timeFrame.start) / 1000;
            audioTime = Math.max(0, Math.min(audioTime, audio.duration));

            if (Math.abs(audio.currentTime - audioTime) > 0.1) {
              audio.currentTime = audioTime;
            }

            if (this.playing && audio.paused) {
              audio.play();
            } else if (!this.playing && !audio.paused) {
              audio.pause();
            }

            if (
              audioTime >= audio.duration ||
              this.currentTimeInMs >= element.timeFrame.end
            ) {
              audio.pause();
            }
          } else {
            audio.pause();
          }
        }
      });
  }
}

function getUid() {
  return Math.random().toString(36).substring(2, 9);
}
