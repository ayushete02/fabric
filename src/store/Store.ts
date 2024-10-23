// src/store/Store.ts

import { makeAutoObservable } from "mobx";
import { fabric } from "fabric";
import {
  AudioEditorElement,
  EditorElement,
  Effects,
  ImageEditorElement,
  MenuOption,
  Placement,
  TextEditorElement,
  TimeFrame,
  VideoEditorElement,
  Animation,
  EffectBase,
} from "@/fabric-types";
import anime, { get } from "animejs";
import {
  isHtmlAudioElement,
  isHtmlImageElement,
  isHtmlVideoElement,
} from "@/utils";
import { FabricUitls } from "@/utils/fabric-utils";

export class Store {
  canvas: fabric.Canvas | null = null;
  backgroundColor: string = "#f3f3f3";
  editorElements: EditorElement[] = [];

  selectedMenuOption: MenuOption = "Video";
  audios: string[] = [];
  videos: string[] = [];
  images: string[] = [];
  selectedElement: EditorElement | null = null;

  maxTime: number = 30 * 1000;
  animations: Animation[] = [];
  animationTimeLine: anime.AnimeTimelineInstance = anime.timeline();
  playing: boolean = false;

  currentKeyFrame: number = 0;
  fps: number = 60;

  possibleVideoFormats: string[] = ["mp4", "webm"];
  selectedVideoFormat: "mp4" | "webm" = "mp4";

  constructor() {
    makeAutoObservable(this);
  }

  get currentTimeInMs() {
    return (this.currentKeyFrame * 1000) / this.fps;
  }

  setCurrentTimeInMs(time: number) {
    this.currentKeyFrame = Math.floor((time / 1000) * this.fps);
  }

  // setCanvas(canvas: fabric.Canvas | null) {
  //   this.canvas = canvas;
  //   if (canvas) {
  //     canvas.backgroundColor = this.backgroundColor;
  //   }
  // }

  setCanvas(canvas: fabric.Canvas | null) {
    this.canvas = canvas;
    if (canvas) {
      canvas.backgroundColor = this.backgroundColor;

      canvas.on("selection:created", (e) => {
        this.handleSelection(e.selected);
      });

      canvas.on("selection:updated", (e) => {
        this.handleSelection(e.selected);
      });

      canvas.on("selection:cleared", () => {
        this.setSelectedElement(null);
      });
    }
  }

  handleSelection(selectedObjects: fabric.Object[]) {
    const target = selectedObjects[0];
    const selectedElement =
      this.editorElements.find((element) => element.fabricObject === target) ??
      null;
    this.setSelectedElement(selectedElement);
  }

  setBackgroundColor(backgroundColor: string) {
    this.backgroundColor = backgroundColor;
    if (this.canvas) {
      this.canvas.selection = true;
      this.canvas.backgroundColor = backgroundColor;
    }
  }

  addAnimation(animation: Animation) {
    this.animations = [...this.animations, animation];
    this.refreshAnimations();
  }

  updateAnimation(id: string, animation: Animation) {
    const index = this.animations.findIndex((a) => a.id === id);
    this.animations[index] = animation;
    this.refreshAnimations();
  }

  removeAnimation(id: string) {
    this.animations = this.animations.filter(
      (animation) => animation.id !== id
    );
    this.refreshAnimations();
  }

  refreshAnimations() {
    // Remove existing animations
    anime.remove(this.animationTimeLine);
    this.animationTimeLine = anime.timeline({
      duration: this.maxTime,
      autoplay: false,
      update: () => {
        this.canvas?.renderAll();
      },
    });

    this.animations.forEach((animation) => {
      const editorElement = this.editorElements.find(
        (e) => e.id === animation.targetId
      );
      if (editorElement && editorElement.fabricObject) {
        anime.remove(editorElement.fabricObject as any);
      }
    });

    this.animations.forEach((animation) => {
      const editorElement = this.editorElements.find(
        (element) => element.id === animation.targetId
      );
      const fabricObject = editorElement?.fabricObject;
      if (!editorElement || !fabricObject) {
        console.warn(`Element with ID ${animation.targetId} not found.`);
        return;
      }

      fabricObject.clipPath = undefined;

      switch (animation.type) {
        case "fadeIn": {
          this.animationTimeLine.add(
            {
              opacity: [0, 1],
              duration: animation.duration,
              targets: fabricObject,
              easing: "linear",
            },
            editorElement.timeFrame.start
          );
          break;
        }
        case "fadeOut": {
          this.animationTimeLine.add(
            {
              opacity: [1, 0],
              duration: animation.duration,
              targets: fabricObject,
              easing: "linear",
            },
            editorElement.timeFrame.end - animation.duration
          );
          break;
        }
        case "slideIn": {
          const direction = animation.properties.direction;
          const targetPosition = {
            left: editorElement.placement.x,
            top: editorElement.placement.y,
          };
          const canvasWidth = this.canvas?.getWidth() || 800;
          const canvasHeight = this.canvas?.getHeight() || 600;

          let startPosition = { ...targetPosition };

          switch (direction) {
            case "left":
              startPosition.left = -editorElement.placement.width;
              break;
            case "right":
              startPosition.left = canvasWidth;
              break;
            case "top":
              startPosition.top = -editorElement.placement.height;
              break;
            case "bottom":
              startPosition.top = canvasHeight;
              break;
          }

          this.animationTimeLine.add(
            {
              left: [startPosition.left, targetPosition.left],
              top: [startPosition.top, targetPosition.top],
              duration: animation.duration,
              targets: fabricObject,
              easing: "linear",
            },
            editorElement.timeFrame.start
          );
          break;
        }
        case "slideOut": {
          const direction = animation.properties.direction;
          const targetPosition = { ...editorElement.placement };

          const canvasWidth = this.canvas?.getWidth() || 800;
          const canvasHeight = this.canvas?.getHeight() || 600;

          switch (direction) {
            case "left":
              targetPosition.x = -editorElement.placement.width;
              break;
            case "right":
              targetPosition.x = canvasWidth;
              break;
            case "top":
              targetPosition.y = -editorElement.placement.height;
              break;
            case "bottom":
              targetPosition.y = canvasHeight;
              break;
          }

          this.animationTimeLine.add(
            {
              left: [editorElement.placement.x, targetPosition.x],
              top: [editorElement.placement.y, targetPosition.y],
              duration: animation.duration,
              targets: fabricObject,
              easing: "linear",
            },
            editorElement.timeFrame.end - animation.duration
          );
          break;
        }
        case "breathe": {
          const upScale = 1.05;
          const currentScaleX = fabricObject.scaleX || 1;
          const currentScaleY = fabricObject.scaleY || 1;
          const finalScaleX = currentScaleX * upScale;
          const finalScaleY = currentScaleY * upScale;

          this.animationTimeLine.add(
            {
              scaleX: [currentScaleX, finalScaleX, currentScaleX],
              scaleY: [currentScaleY, finalScaleY, currentScaleY],
              duration: animation.duration,
              targets: fabricObject,
              easing: "easeInOutSine",
              loop: true,
            },
            editorElement.timeFrame.start
          );
          break;
        }
        // Add more animation types as needed
        default:
          console.warn(`Animation type "${animation.type}" not implemented.`);
      }
    });

    console.log("Animations refreshed.");
  }

  updateEffect(
    id: string,
    effectType: keyof Effects,
    effectProperties: Partial<EffectBase<string, any>>
  ) {
    const elementIndex = this.editorElements.findIndex(
      (element) => element.id === id
    );
    const element = this.editorElements[elementIndex];

    if (isEditorVideoElement(element) || isEditorImageElement(element)) {
      // Update the specified effect properties
      element.properties.effects[effectType] = {
        ...element.properties.effects[effectType],
        ...effectProperties,
        enabled:
          effectProperties.enabled ??
          element.properties.effects[effectType]?.enabled,
      };
      this.applyEffectToFabricObject(element);
    }
    this.refreshElements();
  }

  updateFilterValue(
    id: string,
    filterName: keyof Effects,
    prop: string,
    value: number | string
  ) {
    const element = this.editorElements.find((el) => el.id === id);
    if (
      element &&
      (isEditorVideoElement(element) || isEditorImageElement(element))
    ) {
      const effect = element.properties.effects[filterName];
      if (effect) {
        effect.properties = {
          ...effect.properties,
          [prop]: value,
        };
        this.applyEffectToFabricObject(
          element as VideoEditorElement | ImageEditorElement
        );
      }
    }
  }

  applyEffectToFabricObject(element: VideoEditorElement | ImageEditorElement) {
    const fabricObject = element.fabricObject;
    if (!fabricObject) return;

    // Clear any existing filters
    fabricObject.filters = [];

    // Apply all enabled effects
    const effects = element.properties.effects;

    if (effects.brightness?.enabled) {
      fabricObject.filters.push(
        new fabric.Image.filters.Brightness({
          brightness: effects.brightness.properties?.value || 0,
        })
      );
    }
    if (effects.contrast?.enabled) {
      fabricObject.filters.push(
        new fabric.Image.filters.Contrast({
          contrast: effects.contrast.properties?.value || 0,
        })
      );
    }
    if (effects.saturation?.enabled) {
      fabricObject.filters.push(
        new fabric.Image.filters.Saturation({
          saturation: effects.saturation.properties?.value || 0,
        })
      );
    }
    if (effects.sepia?.enabled) {
      fabricObject.filters.push(new fabric.Image.filters.Sepia());
    }
    if (effects.invert?.enabled) {
      fabricObject.filters.push(new fabric.Image.filters.Invert());
    }
    if (effects.blur?.enabled) {
      fabricObject.filters.push(
        new fabric.Image.filters.Blur({
          blur: effects.blur.properties?.value || 0,
        })
      );
    }
    if (effects.pixelate?.enabled) {
      fabricObject.filters.push(
        new fabric.Image.filters.Pixelate({
          blocksize: effects.pixelate.properties?.value || 4,
        })
      );
    }
    if (effects.noise?.enabled) {
      fabricObject.filters.push(
        new fabric.Image.filters.Noise({
          noise: effects.noise.properties?.value || 0,
        })
      );
    }
    if (effects.gamma?.enabled) {
      fabricObject.filters.push(
        new fabric.Image.filters.Gamma({
          gamma: [
            effects.gamma.properties?.red || 1,
            effects.gamma.properties?.green || 1,
            effects.gamma.properties?.blue || 1,
          ],
        })
      );
    }
    if (effects.removeColor?.enabled) {
      fabricObject.filters.push(
        new fabric.Image.filters.RemoveColor({
          color: effects.removeColor.properties?.color || "#ffffff",
          distance: effects.removeColor.properties?.distance || 0.1,
        })
      );
    }
    if (effects.hue?.enabled) {
      fabricObject.filters.push(
        new fabric.Image.filters.HueRotation({
          rotation: effects.hue.properties?.value || 0,
        })
      );
    }
    if (effects.blendColor?.enabled) {
      fabricObject.filters.push(
        new fabric.Image.filters.BlendColor({
          color: effects.blendColor.properties?.color || "#ffffff",
          mode: effects.blendColor.properties?.mode || "multiply",
          alpha: effects.blendColor.properties?.alpha || 1,
        })
      );
    }

    // Apply all filters
    fabricObject.applyFilters();
    this.canvas?.renderAll();
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
    this.refreshAnimations();
  }

  addElement(element: EditorElement) {
    this.editorElements.push(element);
    this.refreshElements();
    this.setSelectedElement(
      this.editorElements[this.editorElements.length - 1]
    );
  }

  setSelectedElement(selectedElement: EditorElement | null) {
    this.selectedElement = selectedElement;
    if (this.canvas) {
      if (selectedElement?.fabricObject)
        this.canvas.setActiveObject(selectedElement.fabricObject);
      else this.canvas.discardActiveObject();
      this.canvas.renderAll();
    }
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
    this.refreshAnimations();
  }

  updateEditorElement(editorElement: EditorElement) {
    this.setEditorElements(
      this.editorElements.map((element) =>
        element.id === editorElement.id ? editorElement : element
      )
    );
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
      console.log(element);
      switch (element.type) {
        case "rectangle":
          const rect = new fabric.Rect({
            left: element.placement.x,
            top: element.placement.y,
            width: element.placement.width,
            height: element.placement.height,
            fill: (element as any).properties.fill || "red",
            angle: element.placement.rotation,
            scaleX: element.placement.scaleX,
            scaleY: element.placement.scaleY,
            selectable: true,
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
            selectable: true, // Ensures the object is selectable
            evented: true,
            objectCaching: false,
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
          this.applyEffectToFabricObject(element);

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
                selectable: true, // Ensures the object is selectable
                evented: true,
                objectCaching: false,
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
              this.applyEffectToFabricObject(element);

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
        case "text": {
          const textObject = new fabric.Textbox(element.properties.text, {
            left: element.placement.x,
            top: element.placement.y,
            scaleX: element.placement.scaleX,
            scaleY: element.placement.scaleY,
            width: element.placement.width,
            height: element.placement.height,
            angle: element.placement.rotation,
            fontSize: element.properties.fontSize,
            fontWeight: element.properties.fontWeight,
            fontFamily: element.properties.fontFamily || "Arial",
            fill: element.properties.fill || "#ffffff",
            backgroundColor:
              element.properties.backgroundColor || "transparent",
            underline: element.properties.underline || false,
            fontStyle: element.properties.italic ? "italic" : "normal",
            textAlign: element.properties.textAlign || "left",
            objectCaching: false,
            selectable: true,
            lockUniScaling: true,
          });

          // Apply uppercase or lowercase transformation if specified
          if (element.properties.upperCase) {
            textObject.set({ text: element.properties.text.toUpperCase() });
          } else if (element.properties.lowerCase) {
            textObject.set({ text: element.properties.text.toLowerCase() });
          }

          element.fabricObject = textObject;
          canvas.add(textObject);
          canvas.on("object:modified", function (e) {
            if (!e.target) return;
            const target = e.target;
            if (target != textObject) return;
            const placement = element.placement;
            const newPlacement: Placement = {
              ...placement,
              x: target.left ?? placement.x,
              y: target.top ?? placement.y,
              rotation: target.angle ?? placement.rotation,
              width: target.width ?? placement.width,
              height: target.height ?? placement.height,
              scaleX: target.scaleX ?? placement.scaleX,
              scaleY: target.scaleY ?? placement.scaleY,
            };
            const newElement = {
              ...element,
              placement: newPlacement,
              properties: {
                ...element.properties,
                // @ts-ignore
                text: target?.text,
              },
            };
            store.updateEditorElement(newElement);
          });
          break;
        }

        default: {
          throw new Error(`Element type "${element.type}" not implemented`);
        }
      }

      if (element.fabricObject) {
        element.fabricObject.on("object:selected", function (e) {
          console.log("selected");
          store.setSelectedElement(element);
        });
      }
    }

    const selectedEditorElement = store.selectedElement;
    if (selectedEditorElement && selectedEditorElement.fabricObject) {
      canvas.setActiveObject(selectedEditorElement.fabricObject);
    }
    this.refreshAnimations();
    this.updateTimeTo(this.currentTimeInMs);
    store.canvas.renderAll();
  }

  setMaxTime(maxTime: number) {
    this.maxTime = maxTime;
  }

  setPlaying(playing: boolean) {
    this.playing = playing;
    // this.updateVideoElements();
    // this.updateAudioElements();
    if (playing) {
      // this.animationTimeLine.play();
      this.startedTime = Date.now();
      this.startedTimePlay = this.currentTimeInMs;
      requestAnimationFrame(() => {
        this.playFrames();
      });
    } else {
      // this.animationTimeLine.play();
      //   // Ensure that videos and audios are paused when not playing
      this.updateVideoElements();
      this.updateAudioElements();
    }
  }

  startedTime: number = 0;
  startedTimePlay: number = 0;

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
        end: 10000,
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
        effects: {
          brightness: {
            type: "brightness",
            enabled: false,
            properties: { value: 0 },
          },
          contrast: {
            type: "contrast",
            enabled: false,
            properties: { value: 0 },
          },
          saturation: {
            type: "saturation",
            enabled: false,
            properties: { value: 0 },
          },
          sepia: { type: "sepia", enabled: false },
          invert: { type: "invert", enabled: false },
          blur: { type: "blur", enabled: false, properties: { value: 0 } },
          pixelate: {
            type: "pixelate",
            enabled: false,
            properties: { value: 4 },
          },
          noise: { type: "noise", enabled: false, properties: { value: 0 } },
          hue: { type: "hue", enabled: false, properties: { value: 0 } },
          removeColor: {
            type: "removeColor",
            enabled: false,
            properties: { color: "#ffffff", distance: 0.1 },
          },
          blendColor: {
            type: "blendColor",
            enabled: false,
            properties: { color: "#ffffff", mode: "multiply", alpha: 1 },
          },
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
        width: 300 * aspectRatio,
        height: 300,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      },
      timeFrame: {
        start: 0,
        end: 10000,
      },
      properties: {
        elementId: `video-${index}`,
        src: videoElement.src,
        effects: {
          brightness: {
            type: "brightness",
            enabled: false,
            properties: { value: 0 },
          },
          contrast: {
            type: "contrast",
            enabled: false,
            properties: { value: 0 },
          },
          saturation: {
            type: "saturation",
            enabled: false,
            properties: { value: 0 },
          },
          sepia: { type: "sepia", enabled: false },
          invert: { type: "invert", enabled: false },
          blur: { type: "blur", enabled: false, properties: { value: 0 } },
          pixelate: {
            type: "pixelate",
            enabled: false,
            properties: { value: 4 },
          },
          noise: { type: "noise", enabled: false, properties: { value: 0 } },
          hue: { type: "hue", enabled: false, properties: { value: 0 } },
          removeColor: {
            type: "removeColor",
            enabled: false,
            properties: { color: "#ffffff", distance: 0.1 },
          },
          blendColor: {
            type: "blendColor",
            enabled: false,
            properties: { color: "#ffffff", mode: "multiply", alpha: 1 },
          },
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
        start: 0,
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

  addText(options: {
    text: string;
    fontSize: number;
    fontWeight: number;
    fontFamily?: string;
    fill?: string;
    underline?: boolean;
    italic?: boolean;
    backgroundColor?: string;
    upperCase?: boolean;
    lowerCase?: boolean;
    textAlign?: "left" | "center" | "right";
  }) {
    const id = getUid();
    const index = this.editorElements.length;

    // Apply uppercase or lowercase transformation if specified
    const transformedText = options.upperCase
      ? options.text.toUpperCase()
      : options.lowerCase
      ? options.text.toLowerCase()
      : options.text;

    this.addElement({
      id,
      name: `Text ${index + 1}`,
      type: "text",
      placement: {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      },
      timeFrame: {
        start: 0,
        end: 4000,
      },
      properties: {
        text: transformedText,
        fontSize: options.fontSize,
        fontWeight: options.fontWeight,
        fontFamily: options.fontFamily ?? "Arial",
        fill: options.fill ?? "#ffffff",
        backgroundColor: options.backgroundColor ?? "transparent",
        underline: options.underline ?? false,
        italic: options.italic ?? false,
        textAlign: options.textAlign ?? "left",
        splittedTexts: [],
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

            if (element.fabricObject && video) {
              const videoObject = element.fabricObject as fabric.Image;
              videoObject.setElement(video);
              videoObject.setCoords();
              this.canvas?.renderAll();
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

export function isEditorAudioElement(
  element: EditorElement
): element is AudioEditorElement {
  return element.type === "audio";
}
export function isEditorVideoElement(
  element: EditorElement
): element is VideoEditorElement {
  return element.type === "video";
}

export function isEditorImageElement(
  element: EditorElement
): element is ImageEditorElement {
  return element.type === "image";
}

export function isEditorTextElement(
  element: EditorElement
): element is TextEditorElement {
  return element.type === "text";
}

function getTextObjectsPartitionedByCharacters(
  textObject: fabric.Text,
  element: TextEditorElement
): fabric.Text[] {
  let copyCharsObjects: fabric.Text[] = [];
  // replace all line endings with blank
  const characters = (textObject.text ?? "")
    .split("")
    .filter((m) => m !== "\n");
  const charObjects = textObject.__charBounds;
  if (!charObjects) return [];
  const charObjectFixed = charObjects
    .map((m, index) => m.slice(0, m.length - 1).map((m) => ({ m, index })))
    .flat();
  const lineHeight = textObject.getHeightOfLine(0);
  for (let i = 0; i < characters.length; i++) {
    if (!charObjectFixed[i]) continue;
    const { m: charObject, index: lineIndex } = charObjectFixed[i];
    const char = characters[i];
    const scaleX = textObject.scaleX ?? 1;
    const scaleY = textObject.scaleY ?? 1;
    const charTextObject = new fabric.Text(char, {
      left: charObject.left * scaleX + element.placement.x,
      scaleX: scaleX,
      scaleY: scaleY,
      top: lineIndex * lineHeight * scaleY + element.placement.y,
      fontSize: textObject.fontSize,
      fontWeight: textObject.fontWeight,
      fill: "#fff",
    });
    copyCharsObjects.push(charTextObject);
  }
  return copyCharsObjects;
}
