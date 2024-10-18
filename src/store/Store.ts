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

  // refreshElements() {
  //   if (!this.canvas) return;

  //   // Clear the canvas
  //   this.canvas.clear();

  //   // Re-add all elements from editorElements
  //   this.editorElements.forEach((element) => {
  //     switch (element.type) {
  //       case "rectangle":
  //         const rect = new fabric.Rect({
  //           left: element.placement.x,
  //           top: element.placement.y,
  //           width: element.placement.width,
  //           height: element.placement.height,
  //           fill: element.properties.fill || "red",
  //           angle: element.placement.rotation,
  //           scaleX: element.placement.scaleX,
  //           scaleY: element.placement.scaleY,
  //         });
  //         element.fabricObject = rect;
  //         this.canvas?.add(rect);
  //         break;

  //       case "image":
  //         fabric.Image.fromURL(
  //           element.properties.src,
  //           (img) => {
  //             img.set({
  //               left: element.placement.x,
  //               top: element.placement.y,
  //               angle: element.placement.rotation,
  //               scaleX: element.placement.scaleX,
  //               scaleY: element.placement.scaleY,
  //             });
  //             element.fabricObject = img;
  //             this.canvas?.add(img);
  //           },
  //           { crossOrigin: "anonymous" }
  //         );
  //         break;

  //       // Handle other element types (video, audio, text)
  //     }
  //   });

  //   this.canvas.renderAll();
  // }

  addImageResource(image: string) {
    console.log("add resource image");
    this.images = [...this.images, image];
  }

  addVideoResource(video: string) {
    console.log("add video r");
    this.videos = [...this.videos, video];
  }

  refreshElements() {
    console.log("refresh");
    const store = this;
    if (!store.canvas) return;
    const canvas = store.canvas;
    store.canvas.remove(...store.canvas.getObjects());
    for (let index = 0; index < store.editorElements.length; index++) {
      const element = store.editorElements[index];
      console.log(element);
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
          console.log("elementid", element.properties.elementId);

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

            let fianlScale = 1;
            if (target.scaleX && target.scaleX > 0) {
              fianlScale = target.scaleX / toScale.x;
              console.log("imageObject");
            }

            const newPlacement = {
              ...placement,
              x: target.left ?? placement.x,
              y: target.top ?? placement.y,
              rotation: target.angle ?? placement.rotation,
              width: target.width ? target.width : placement.width,
              height: target.height ? target.height : placement.height,
              scaleX: fianlScale,
              scaleY: fianlScale,
            };

            const newElement = {
              ...element,
              placement: newPlacement,
            };

            store.updateEditorElement(newElement);
          });

          // Optional: Play the video if needed
          // videoElement.play();

          break;
        }

        case "image": {
          console.log(element.properties.elementId);
          if (document.getElementById(element.properties.elementId) == null)
            continue;

          const imageElement = document.getElementById(
            element.properties.elementId
          );
          console.log("imahe");
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
              console.log(desiredHeight, desiredWidth);
              const scaleX = desiredWidth / img.width;
              const scaleY = desiredHeight / img.height;
              console.log(scaleX, scaleY);

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
                const image = {
                  w: imageElement.naturalWidth,
                  h: imageElement.naturalHeight,
                };
                const toScale = {
                  x: element.placement.width / image.w,
                  y: element.placement.height / image.h,
                };
                const target = e.target;
                if (target != img) return;
                const placement = element.placement;
                let fianlScale = 1;
                if (target.scaleX && target.scaleX > 0) {
                  fianlScale = target.scaleX / toScale.x;
                  console.log("imageObject");
                }
                const newPlacement: Placement = {
                  ...placement,
                  x: target.left ?? placement.x,
                  y: target.top ?? placement.y,
                  rotation: target.angle ?? placement.rotation,
                  scaleX: fianlScale,
                  scaleY: fianlScale,
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

        // case "audio": {
        //   break;
        // }
        // case "text": {
        //   const textObject = new fabric.Textbox(element.properties.text, {
        //     name: element.id,
        //     left: element.placement.x,
        //     top: element.placement.y,
        //     scaleX: element.placement.scaleX,
        //     scaleY: element.placement.scaleY,
        //     width: element.placement.width,
        //     height: element.placement.height,
        //     angle: element.placement.rotation,
        //     fontSize: element.properties.fontSize,
        //     fontWeight: element.properties.fontWeight,
        //     objectCaching: false,
        //     selectable: true,
        //     lockUniScaling: true,
        //     fill: "#ffffff",
        //   });
        //   element.fabricObject = textObject;
        //   canvas.add(textObject);
        //   canvas.on("object:modified", function (e) {
        //     if (!e.target) return;
        //     const target = e.target;
        //     if (target != textObject) return;
        //     const placement = element.placement;
        //     const newPlacement: Placement = {
        //       ...placement,
        //       x: target.left ?? placement.x,
        //       y: target.top ?? placement.y,
        //       rotation: target.angle ?? placement.rotation,
        //       width: target.width ?? placement.width,
        //       height: target.height ?? placement.height,
        //       scaleX: target.scaleX ?? placement.scaleX,
        //       scaleY: target.scaleY ?? placement.scaleY,
        //     };
        //     const newElement = {
        //       ...element,
        //       placement: newPlacement,
        //       properties: {
        //         ...element.properties,
        //         // @ts-ignore
        //         text: target?.text,
        //       },
        //     };
        //     store.updateEditorElement(newElement);
        //   });
        //   break;
        // }
        default: {
          throw new Error("Not implemented");
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
    console.log(editorElement);
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
    this.updateVideoElements();
    this.updateAudioElements();
    if (playing) {
      this.startedTime = Date.now();
      this.startedTimePlay = this.currentTimeInMs;
      requestAnimationFrame(() => {
        this.playFrames();
      });
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
    this.updateVideoElements(); // Add this line
    this.updateAudioElements(); // Ensure audio elements are updated too
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
        end: 10000,
      },
      properties: {
        elementId: `image-${index}`,
        src: imageElement.src,
        effect: {
          type: "none",
        },
      },
    });
    console.log("add image");
  }

  addVideo(index: number) {
    const videoElement = document.getElementById(`video-${index}`);
    console.log(videoElement);
    if (!isHtmlVideoElement(videoElement)) {
      return;
    }
    console.log(
      videoElement.duration,
      videoElement.videoWidth,
      videoElement.videoHeight
    );
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
        end: 5000,
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
          const audioTime =
            (this.currentTimeInMs - element.timeFrame.start) / 1000;
          audio.currentTime = audioTime;
          if (this.playing) {
            audio.play();
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
