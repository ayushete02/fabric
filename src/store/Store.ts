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

  maxTime: number = 0;
  animations: Animation[] = [];
  animationTimeLine: anime.AnimeTimelineInstance = anime.timeline();
  playing: boolean = false;

  currentKeyFrame: number = 0;
  fps: number = 60;

  possibleVideoFormats: string[] = ["mp4", "webm"];
  selectedVideoFormat: "mp4" | "webm" = "mp4";

  isCropping: boolean = false;
  cropRect: fabric.Rect | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  get currentTimeInMs() {
    return (this.currentKeyFrame * 1000) / this.fps;
  }

  setCurrentTimeInMs(time: number) {
    this.currentKeyFrame = Math.floor((time / 1000) * this.fps);
  }

  playTimeline() {
    this.animationTimeLine.play();
  }

  pauseTimeline() {
    this.animationTimeLine.pause();
  }

  restartTimeline() {
    this.animationTimeLine.restart();
  }

  seekTimeline(timeInMs: number) {
    this.animationTimeLine.seek(timeInMs);
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

  deleteElement(id: string) {
    this.editorElements = this.editorElements.filter(
      (element) => element.id !== id
    );

    // Clear selection if the deleted element was selected
    if (this.selectedElement?.id === id) {
      this.setSelectedElement(null);
    }

    this.refreshElements();
  }

  // Method to update placement properties
  updateSelectedElementPlacement(partialPlacement: Partial<Placement>) {
    if (!this.selectedElement || !this.selectedElement.fabricObject) return;

    const fabricObject = this.selectedElement.fabricObject;
    const newPlacement = {
      ...this.selectedElement.placement,
      ...partialPlacement,
    };

    // Get the object's original width and height
    const originalWidth = fabricObject.width || 0;
    const originalHeight = fabricObject.height || 0;

    // Update scaleX and width
    if (partialPlacement.width !== undefined) {
      const newScaleX = partialPlacement.width / originalWidth;
      fabricObject.set("scaleX", newScaleX);
      newPlacement.scaleX = newScaleX;
      newPlacement.width = partialPlacement.width;
    } else if (partialPlacement.scaleX !== undefined) {
      fabricObject.set("scaleX", partialPlacement.scaleX);
      newPlacement.width = originalWidth * partialPlacement.scaleX;
      newPlacement.scaleX = partialPlacement.scaleX;
    }

    // Update scaleY and height
    if (partialPlacement.height !== undefined) {
      const newScaleY = partialPlacement.height / originalHeight;
      fabricObject.set("scaleY", newScaleY);
      newPlacement.scaleY = newScaleY;
      newPlacement.height = partialPlacement.height;
    } else if (partialPlacement.scaleY !== undefined) {
      fabricObject.set("scaleY", partialPlacement.scaleY);
      newPlacement.height = originalHeight * partialPlacement.scaleY;
      newPlacement.scaleY = partialPlacement.scaleY;
    }

    // Set other properties like position and rotation
    if (partialPlacement.x !== undefined) {
      fabricObject.set("left", partialPlacement.x);
    }
    if (partialPlacement.y !== undefined) {
      fabricObject.set("top", partialPlacement.y);
    }
    if (partialPlacement.rotation !== undefined) {
      fabricObject.set("angle", partialPlacement.rotation);
    }

    // Ensure fabric object coordinates are recalculated
    fabricObject.setCoords();
    this.canvas?.renderAll();

    // Update the store with the adjusted placement
    this.updateEditorElement({
      ...this.selectedElement,
      placement: newPlacement,
    });
  }

  // Method to update other properties (e.g., opacity, stroke, strokeWidth)
  updateSelectedElementProperties(partialProperties: any) {
    if (!this.selectedElement) return;

    const newProperties = {
      ...this.selectedElement.properties,
      ...partialProperties,
    };

    const updatedElement = {
      ...this.selectedElement,
      properties: newProperties,
    };

    // Update the Fabric.js object directly
    if (this.selectedElement.fabricObject) {
      const fabricObject = this.selectedElement.fabricObject;
      Object.keys(partialProperties).forEach((key) => {
        fabricObject.set(key, partialProperties[key]);
      });
      fabricObject.setCoords();
      this.canvas?.renderAll();
    }

    this.updateEditorElement(updatedElement);
  }

  setBackgroundColor(backgroundColor: string) {
    this.backgroundColor = backgroundColor;
    if (this.canvas) {
      this.canvas.selection = true;
      this.canvas.backgroundColor = backgroundColor;
    }
  }

  startCropping() {
    if (!this.selectedElement || !this.canvas) return;

    this.isCropping = true;
    this.canvas.selection = false;
    // this.canvas.discardActiveObject();

    const element = this.selectedElement;
    console.log(element);
    const fabricObject = element.fabricObject;

    if (!fabricObject) return;

    // Create a semi-transparent rectangle over the object to define the crop area
    this.cropRect = new fabric.Rect({
      left: fabricObject.left,
      top: fabricObject.top,
      width: fabricObject.width! * fabricObject.scaleX!,
      height: fabricObject.height! * fabricObject.scaleY!,
      fill: "rgba(0,0,0,0.3)",
      stroke: "red",
      strokeWidth: 2,
      hasBorders: true,
      hasControls: true,
      selectable: true,
      objectCaching: false,
    });

    this.canvas.add(this.cropRect);
    this.canvas.setActiveObject(this.cropRect);
    this.canvas.renderAll();
  }

  applyCrop() {
    if (!this.selectedElement || !this.canvas || !this.cropRect) return;

    const element = this.selectedElement;
    const fabricObject = element.fabricObject as fabric.Image;

    if (!fabricObject) return;

    const cropRect = this.cropRect;

    // Calculate cropping parameters
    const left = cropRect.left! - fabricObject.left!;
    const top = cropRect.top! - fabricObject.top!;
    const width = cropRect.width! * cropRect.scaleX!;
    const height = cropRect.height! * cropRect.scaleY!;

    fabricObject.set({
      cropX: left / fabricObject.scaleX!,
      cropY: top / fabricObject.scaleY!,
      width: width / fabricObject.scaleX!,
      height: height / fabricObject.scaleY!,
    });

    // Remove the cropping rectangle
    this.canvas.remove(cropRect);
    this.cropRect = null;
    this.isCropping = false;
    this.canvas.selection = true;
    this.canvas.setActiveObject(fabricObject);
    this.canvas.renderAll();

    // Update the element's placement
    this.updateSelectedElementPlacement({
      width: width,
      height: height,
    });
  }

  cancelCrop() {
    if (!this.canvas || !this.cropRect) return;

    this.canvas.remove(this.cropRect);
    this.cropRect = null;
    this.isCropping = false;
    this.canvas.selection = true;
    this.canvas.renderAll();
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
      autoplay: false,
      update: (anim) => {
        // Update the current time in the store based on the timeline's current time
        this.setCurrentTimeInMs(anim.currentTime);
        this.canvas?.renderAll();
      },
      complete: () => {
        // Animation timeline has completed, set playing to false
        this.setPlaying(false);
        this.setCurrentTimeInMs(0);
        this.animationTimeLine.pause();
        this.animationTimeLine.seek(0);
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

      // // Reset fabric object properties
      // fabricObject.set({
      //   opacity: 1,
      //   left: editorElement.placement.x,
      //   top: editorElement.placement.y,
      //   scaleX: editorElement.placement.scaleX || 1,
      //   scaleY: editorElement.placement.scaleY || 1,
      //   angle: editorElement.placement.rotation || 0,
      // });

      fabricObject.clipPath = undefined;

      // Calculate the actual start time and duration of the animation
      let animStartTime = editorElement.timeFrame.start;
      let animDuration = animation.duration;

      // Ensure the duration does not exceed the element's time frame
      // animDuration = Math.min(
      //   animation.duration,
      //   editorElement.timeFrame.end - editorElement.timeFrame.start
      // );

      switch (animation.type) {
        case "fadeIn": {
          this.animationTimeLine.add(
            {
              opacity: [0, 1],
              duration: animDuration,
              targets: fabricObject,
              easing: "linear",
            },
            animStartTime
          );
          break;
        }
        case "fadeOut": {
          animStartTime = editorElement.timeFrame.end - animDuration;
          this.animationTimeLine.add(
            {
              opacity: [1, 0],
              duration: animDuration,
              targets: fabricObject,
              easing: "linear",
            },
            animStartTime
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

          fabricObject.set({
            left: startPosition.left,
            top: startPosition.top,
          });

          this.animationTimeLine.add(
            {
              left: [startPosition.left, targetPosition.left],
              top: [startPosition.top, targetPosition.top],
              duration: animDuration,
              targets: fabricObject,
              easing: "easeOutQuad",
            },
            animStartTime
          );
          break;
        }
        case "slideOut": {
          animStartTime = editorElement.timeFrame.end - animDuration;

          const direction = animation.properties.direction;
          const startPosition = {
            left: editorElement.placement.x,
            top: editorElement.placement.y,
          };

          const targetPosition = { ...startPosition };
          const canvasWidth = this.canvas?.getWidth() || 800;
          const canvasHeight = this.canvas?.getHeight() || 600;

          switch (direction) {
            case "left":
              targetPosition.left = -editorElement.placement.width;
              break;
            case "right":
              targetPosition.left = canvasWidth;
              break;
            case "top":
              targetPosition.top = -editorElement.placement.height;
              break;
            case "bottom":
              targetPosition.top = canvasHeight;
              break;
          }

          this.animationTimeLine.add(
            {
              left: [startPosition.left, targetPosition.left],
              top: [startPosition.top, targetPosition.top],
              duration: animDuration,
              targets: fabricObject,
              easing: "easeInQuad",
            },
            animStartTime
          );
          break;
        }
        case "breathe": {
          animDuration =
            editorElement.timeFrame.end - editorElement.timeFrame.start;
          animStartTime = editorElement.timeFrame.start;

          const upScale = 1.05;
          const currentScaleX = fabricObject.scaleX || 1;
          const currentScaleY = fabricObject.scaleY || 1;
          const finalScaleX = currentScaleX * upScale;
          const finalScaleY = currentScaleY * upScale;

          this.animationTimeLine.add(
            {
              scaleX: [currentScaleX, finalScaleX, currentScaleX],
              scaleY: [currentScaleY, finalScaleY, currentScaleY],
              duration: animDuration,
              targets: fabricObject,
              easing: "easeInOutSine",
              loop: true,
            },
            animStartTime
          );
          break;
        }
        case "zoomIn": {
          const initialScaleX = 0;
          const initialScaleY = 0;
          const targetScaleX = fabricObject.scaleX || 1;
          const targetScaleY = fabricObject.scaleY || 1;

          fabricObject.set({
            scaleX: initialScaleX,
            scaleY: initialScaleY,
          });

          this.animationTimeLine.add(
            {
              scaleX: [initialScaleX, targetScaleX],
              scaleY: [initialScaleY, targetScaleY],
              duration: animDuration,
              targets: fabricObject,
              easing: "easeOutBack",
            },
            animStartTime
          );
          break;
        }
        case "zoomOut": {
          animStartTime = editorElement.timeFrame.end - animDuration;

          const initialScaleX = fabricObject.scaleX || 1;
          const initialScaleY = fabricObject.scaleY || 1;
          const targetScaleX = 0;
          const targetScaleY = 0;

          this.animationTimeLine.add(
            {
              scaleX: [initialScaleX, targetScaleX],
              scaleY: [initialScaleY, targetScaleY],
              duration: animDuration,
              targets: fabricObject,
              easing: "easeInBack",
            },
            animStartTime
          );
          break;
        }
        case "rotateIn": {
          const initialAngle = fabricObject.angle - 90;
          const targetAngle = fabricObject.angle;

          fabricObject.set({
            angle: initialAngle,
          });

          this.animationTimeLine.add(
            {
              angle: [initialAngle, targetAngle],
              duration: animDuration,
              targets: fabricObject,
              easing: "easeOutBack",
            },
            animStartTime
          );
          break;
        }
        case "rotateOut": {
          animStartTime = editorElement.timeFrame.end - animDuration;

          const initialAngle = fabricObject.angle;
          const targetAngle = fabricObject.angle + 90;

          this.animationTimeLine.add(
            {
              angle: [initialAngle, targetAngle],
              duration: animDuration,
              targets: fabricObject,
              easing: "easeInBack",
            },
            animStartTime
          );
          break;
        }
        case "bounceIn": {
          const initialScaleX = 0;
          const initialScaleY = 0;
          const targetScaleX = fabricObject.scaleX || 1;
          const targetScaleY = fabricObject.scaleY || 1;

          fabricObject.set({
            scaleX: initialScaleX,
            scaleY: initialScaleY,
          });

          this.animationTimeLine.add(
            {
              scaleX: [initialScaleX, targetScaleX],
              scaleY: [initialScaleY, targetScaleY],
              duration: animDuration,
              targets: fabricObject,
              easing: "easeOutBounce",
            },
            animStartTime
          );
          break;
        }
        case "bounceOut": {
          animStartTime = editorElement.timeFrame.end - animDuration;

          const initialScaleX = fabricObject.scaleX || 1;
          const initialScaleY = fabricObject.scaleY || 1;
          const targetScaleX = 0;
          const targetScaleY = 0;

          this.animationTimeLine.add(
            {
              scaleX: [initialScaleX, targetScaleX],
              scaleY: [initialScaleY, targetScaleY],
              duration: animDuration,
              targets: fabricObject,
              easing: "easeInBounce",
            },
            animStartTime
          );
          break;
        }
        default:
          console.warn(`Animation type "${animation.type}" not implemented.`);
      }
    });

    // Add a dummy animation to ensure the timeline runs until maxTime
    this.animationTimeLine.add(
      {
        targets: {},
        duration: 1,
      },
      this.maxTime - 1
    );

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
    console.log(element);
    this.editorElements.push(element);
    console.log(element);
    this.refreshElements();
    console.log(element);
    this.setSelectedElement(
      this.editorElements[this.editorElements.length - 1]
    );
    console.log(element);
  }

  setSelectedElement(selectedElement: EditorElement | null) {
    this.selectedElement = selectedElement;
    if (this.canvas) {
      if (selectedElement?.fabricObject)
        this.canvas.setActiveObject(selectedElement.fabricObject);
      // else this.canvas.discardActiveObject();
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

  updateElementPlacementFromFabricObject(
    element: EditorElement,
    fabricObject: fabric.Object
  ) {
    const newPlacement: Placement = {
      x: fabricObject.left ?? element.placement.x,
      y: fabricObject.top ?? element.placement.y,
      rotation: fabricObject.angle ?? element.placement.rotation,
      scaleX: fabricObject.scaleX ?? element.placement.scaleX,
      scaleY: fabricObject.scaleY ?? element.placement.scaleY,
      width: element.placement.width,
      height: element.placement.height,
    };

    // For images and videos, update width and height based on scaling
    if (
      fabricObject instanceof fabric.Image &&
      (element.type === "image" || element.type === "video")
    ) {
      const originalSize = fabricObject.getOriginalSize();
      newPlacement.width = originalSize.width * (fabricObject.scaleX || 1);
      newPlacement.height = originalSize.height * (fabricObject.scaleY || 1);
    }

    // For text elements, update width and height as well
    if (fabricObject instanceof fabric.Textbox && element.type === "text") {
      newPlacement.width = fabricObject.width || element.placement.width;
      newPlacement.height = fabricObject.height || element.placement.height;
    }

    const updatedElement = {
      ...element,
      placement: newPlacement,
    };

    this.updateEditorElement(updatedElement);
  }

  refreshElements() {
    const store = this;
    if (!store.canvas) return;
    const canvas = store.canvas;

    const selectedElementId = this.selectedElement?.id;

    // Preserve the currently selected fabric object
    let selectedFabricObject = this.selectedElement?.fabricObject;

    canvas.remove(...canvas.getObjects());
    for (let index = 0; index < store.editorElements.length; index++) {
      const element = store.editorElements[index];
      let fabricObject: fabric.Object | null = null;
      console.log(element);
      switch (element.type) {
        case "shape":
          switch (element.shapeType) {
            case "rectangle":
              fabricObject = new fabric.Rect({
                left: element.placement.x,
                top: element.placement.y,
                width: element.placement.width,
                height: element.placement.height,
                fill: (element as any).properties.fill || "red",
                angle: element.placement.rotation,
                scaleX: element.placement.scaleX,
                scaleY: element.placement.scaleY,
                opacity: element.properties.opacity || 1,
                stroke: element.properties.stroke || undefined,
                strokeWidth: element.properties.strokeWidth || 0,
                rx: element.properties.rx || 0,
                ry: element.properties.ry || 0,
                selectable: true,
              });
              element.fabricObject = fabricObject;
              this.canvas?.add(fabricObject);
              break;

            case "circle":
              fabricObject = new fabric.Circle({
                left: element.placement.x,
                top: element.placement.y,
                radius: element.placement.width / 2, // Assuming width is diameter
                fill: element.properties.fill || "blue",
                angle: element.placement.rotation,
                scaleX: element.placement.scaleX,
                scaleY: element.placement.scaleY,
                opacity: element.properties.opacity || 1,
                stroke: element.properties.stroke || undefined,
                strokeWidth: element.properties.strokeWidth || 0,
                selectable: true,
              });
              element.fabricObject = fabricObject;
              this.canvas?.add(fabricObject);
              break;

            case "triangle":
              fabricObject = new fabric.Triangle({
                left: element.placement.x,
                top: element.placement.y,
                width: element.placement.width,
                height: element.placement.height,
                fill: element.properties.fill || "green",
                angle: element.placement.rotation,
                scaleX: element.placement.scaleX,
                scaleY: element.placement.scaleY,
                opacity: element.properties.opacity || 1,
                stroke: element.properties.stroke || undefined,
                strokeWidth: element.properties.strokeWidth || 0,
                selectable: true,
              });
              element.fabricObject = fabricObject;
              this.canvas?.add(fabricObject);
              break;

            case "ellipse":
              fabricObject = new fabric.Ellipse({
                left: element.placement.x,
                top: element.placement.y,
                rx: element.placement.width / 2,
                ry: element.placement.height / 4,
                fill: element.properties.fill || "purple",
                angle: element.placement.rotation,
                scaleX: element.placement.scaleX,
                scaleY: element.placement.scaleY,
                opacity: element.properties.opacity || 1,
                stroke: element.properties.stroke || undefined,
                strokeWidth: element.properties.strokeWidth || 0,
                selectable: true,
              });
              element.fabricObject = fabricObject;
              this.canvas?.add(fabricObject);
              break;

            case "line":
              fabricObject = new fabric.Line(
                [0, 0, element.placement.width, element.placement.height],
                {
                  left: element.placement.x,
                  top: element.placement.y,
                  fill: element.properties.fill || "black",
                  stroke: element.properties.stroke || "black",
                  strokeWidth: element.properties.strokeWidth || 1,
                  angle: element.placement.rotation,
                  scaleX: element.placement.scaleX,
                  scaleY: element.placement.scaleY,
                  opacity: element.properties.opacity || 1,
                  selectable: true,
                }
              );
              element.fabricObject = fabricObject;
              this.canvas?.add(fabricObject);
              break;

            case "polygon":
              // Example: Triangle polygon
              const points = [
                { x: 0, y: 0 },
                { x: element.placement.width, y: 0 },
                { x: element.placement.width / 2, y: element.placement.height },
              ];
              fabricObject = new fabric.Polygon(points, {
                left: element.placement.x,
                top: element.placement.y,
                fill: element.properties.fill || "orange",
                angle: element.placement.rotation,
                scaleX: element.placement.scaleX,
                scaleY: element.placement.scaleY,
                opacity: element.properties.opacity || 1,
                stroke: element.properties.stroke || undefined,
                strokeWidth: element.properties.strokeWidth || 0,
                selectable: true,
              });
              element.fabricObject = fabricObject;
              this.canvas?.add(fabricObject);
              break;
          }
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

          const videoWidth =
            videoElement.videoWidth || videoElement.clientWidth;
          const videoHeight =
            videoElement.videoHeight || videoElement.clientHeight;

          // Create a fabric.Image object using the video element as a source
          fabricObject = new fabric.Image(videoElement, {
            left: element.placement.x,
            top: element.placement.y,
            angle: element.placement.rotation,
            originX: "left",
            originY: "top",
            selectable: true,
            scaleX: (element.placement.width || videoWidth) / videoWidth,
            scaleY: (element.placement.height || videoHeight) / videoHeight,
            opacity: element.properties.opacity || 1,
            stroke: element.properties.stroke || undefined,
            strokeWidth: element.properties.strokeWidth || 0,
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

          fabricObject.set({
            scaleX: finalScaleX,
            scaleY: finalScaleY,
          });

          canvas.add(fabricObject);
          // Store the fabric object
          element.fabricObject = fabricObject;
          element.properties.imageObject = fabricObject;
          this.applyEffectToFabricObject(element);

          // Event handler for when the video object is modified
          // videoObject.on("modified", function (e) {
          //   if (e.target != videoObject) return;
          //   const target = e.target;
          //   const placement = element.placement;

          //   const image = {
          //     w: videoElement.videoWidth,
          //     h: videoElement.videoHeight,
          //   };
          //   const toScale = {
          //     x: element.placement.width / image.w,
          //     y: element.placement.height / image.h,
          //   };

          //   let finalScale = 1;
          //   if (target.scaleX && target.scaleX > 0) {
          //     finalScale = target.scaleX / toScale.x;
          //   }

          //   const newPlacement = {
          //     ...placement,
          //     x: target.left ?? placement.x,
          //     y: target.top ?? placement.y,
          //     rotation: target.angle ?? placement.rotation,
          //     width: target.width ? target.width : placement.width,
          //     height: target.height ? target.height : placement.height,
          //     scaleX: finalScale,
          //     scaleY: finalScale,
          //   };

          //   const newElement = {
          //     ...element,
          //     placement: newPlacement,
          //   };

          //   store.updateEditorElement(newElement);
          // });

          break;
        }

        case "image": {
          const imageElement = document.getElementById(
            element.properties.elementId
          );
          if (!isHtmlImageElement(imageElement)) continue;
          const imageUrl = element.properties.src;
          const imgWidth = imageElement.naturalWidth;
          const imgHeight = imageElement.naturalHeight;
          fabricObject = fabric.Image.fromURL(
            imageUrl,
            (img) => {
              // Set initial position, rotation, and origin
              img.set({
                left: element.placement.x,
                top: element.placement.y,
                angle: element.placement.rotation,
                originX: "left",
                originY: "top",
                selectable: true,
                scaleX: (element.placement.width || imgWidth) / imgWidth,
                scaleY: (element.placement.height || imgHeight) / imgHeight,
                opacity: element.properties.opacity || 1,
                stroke: element.properties.stroke || undefined,
                strokeWidth: element.properties.strokeWidth || 0,
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
              // img.on("modified", function (e) {
              //   if (!e.target) return;
              //   const target = e.target;
              //   if (target != img) return;
              //   const placement = element.placement;

              //   let finalScale = 1;
              //   if (target.scaleX && target.scaleX > 0) {
              //     finalScale = target.scaleX / (desiredWidth / img.width);
              //   }

              //   const newPlacement: Placement = {
              //     ...placement,
              //     x: target.left ?? placement.x,
              //     y: target.top ?? placement.y,
              //     rotation: target.angle ?? placement.rotation,
              //     scaleX: finalScale,
              //     scaleY: finalScale,
              //     width: placement.width ?? target.width,
              //     height: placement.height ?? target.height,
              //   };

              //   const newElement = {
              //     ...element,
              //     placement: newPlacement,
              //   };

              //   store.updateEditorElement(newElement);
              // });
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
          fabricObject = new fabric.Textbox(element.properties.text, {
            left: element.placement.x,
            top: element.placement.y,
            scaleX: element.placement.scaleX || 1,
            scaleY: element.placement.scaleY || 1,
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
            opacity: element.properties.opacity || 1,
            stroke: element.properties.stroke || undefined,
            strokeWidth: element.properties.strokeWidth || 0,
            selectable: true,
            lockUniScaling: true,
            objectCaching: false,
          });

          // Apply uppercase or lowercase transformation if specified
          if (element.properties.upperCase) {
            fabricObject.set({ text: element.properties.text.toUpperCase() });
          } else if (element.properties.lowerCase) {
            fabricObject.set({ text: element.properties.text.toLowerCase() });
          }

          element.fabricObject = fabricObject;
          canvas.add(fabricObject);

          // canvas.on("object:modified", function (e) {
          //   if (!e.target) return;
          //   const target = e.target;
          //   if (target != textObject) return;
          //   const placement = element.placement;
          //   const newPlacement: Placement = {
          //     ...placement,
          //     x: target.left ?? placement.x,
          //     y: target.top ?? placement.y,
          //     rotation: target.angle ?? placement.rotation,
          //     width: target.width ?? placement.width,
          //     height: target.height ?? placement.height,
          //     scaleX: target.scaleX ?? placement.scaleX,
          //     scaleY: target.scaleY ?? placement.scaleY,
          //   };
          //   const newElement = {
          //     ...element,
          //     placement: newPlacement,
          //     properties: {
          //       ...element.properties,
          //       // @ts-ignore
          //       text: target?.text,
          //     },
          //   };
          //   store.updateEditorElement(newElement);
          // });
          break;
        }

        default: {
          throw new Error(`Element type "${element.type}" not implemented`);
        }
      }

      if (fabricObject) {
        // Assign the new fabric object to the element
        element.fabricObject = fabricObject;

        // Add the object to the canvas
        canvas.add(fabricObject);

        // Restore selection if this is the selected element
        if (element.id === selectedElementId) {
          canvas.setActiveObject(fabricObject);
          this.setSelectedElement(element);
        }

        // Attach event listeners
        fabricObject.on("modified", () => {
          this.updateElementPlacementFromFabricObject(element, fabricObject!);
        });
        fabricObject.on("selected", () => {
          this.setSelectedElement(element);
        });
      }

      // // Apply opacity and border properties to all fabric objects
      // if (element.fabricObject) {
      //   element.fabricObject.set({
      //     opacity: element.properties.opacity || 1,
      //     stroke: element.properties.stroke || undefined,
      //     strokeWidth: element.properties.strokeWidth || 0,
      //   });
      // }

      // if (element.fabricObject) {
      //   // Assign the new instance to selectedFabricObject if it matches the original
      //   if (
      //     selectedFabricObject &&
      //     selectedFabricObject === element.fabricObject
      //   ) {
      //     selectedFabricObject = element.fabricObject;
      //   }

      //   // Set event listener on the new instance for selection
      //   element.fabricObject.on("object:selected", function () {
      //     store.setSelectedElement(element);
      //   });
      // }
    }

    // Restore selection on the newly created object
    if (selectedFabricObject) {
      canvas.setActiveObject(selectedFabricObject);
      this.setSelectedElement(store.selectedElement);
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

    if (playing) {
      // Play the anime.js timeline
      this.playTimeline();
      this.startedTime = Date.now();
      this.startedTimePlay = this.currentTimeInMs;
      requestAnimationFrame(() => {
        this.playFrames();
      });
      // Start videos and audios
      // this.updateVideoElements();
      // this.updateAudioElements();
    } else {
      // Pause the anime.js timeline
      this.pauseTimeline();
      // Pause videos and audios
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

  updateTimeTo(newTimeInMs: number) {
    this.setCurrentTimeInMs(newTimeInMs);
    // Seek the anime.js timeline
    this.seekTimeline(newTimeInMs);

    // Update the visibility of elements
    this.editorElements.forEach((e) => {
      if (!e.fabricObject) return;
      const isInside =
        e.timeFrame.start <= newTimeInMs && newTimeInMs <= e.timeFrame.end;
      e.fabricObject.visible = isInside;
    });

    // Update videos and audios
    this.updateVideoElements();
    this.updateAudioElements();

    // Render the canvas
    this.canvas?.renderAll();
  }

  handleSeek(seekTimeInMs: number) {
    if (this.playing) {
      this.setPlaying(false);
    }
    this.updateTimeTo(seekTimeInMs);
    this.updateVideoElements();
    this.updateAudioElements();
  }

  addRectangle = () => {
    const shapeDurationMs = 5000;
    const startTime = 0;
    this.setMaxTime(
      this.maxTime < startTime + shapeDurationMs
        ? startTime + shapeDurationMs
        : this.maxTime
    );
    const rectangleElement: EditorElement = {
      id: getUid(),
      type: "shape",
      shapeType: "rectangle",
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
        start: startTime,
        end: startTime + shapeDurationMs,
      },
      properties: {
        fill: "red",
      },
    };
    console.log(rectangleElement);
    this.addElement(rectangleElement);
    console.log(rectangleElement);
  };

  addCircle = () => {
    const shapeDurationMs = 5000;
    const startTime = 0;
    this.setMaxTime(
      this.maxTime < startTime + shapeDurationMs
        ? startTime + shapeDurationMs
        : this.maxTime
    );
    const circleElement: EditorElement = {
      id: getUid(),
      type: "shape",
      shapeType: "circle",
      name: "Circle",
      placement: {
        x: 100,
        y: 100,
        width: 100, // Diameter
        height: 100, // Diameter
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      },
      timeFrame: {
        start: startTime,
        end: startTime + shapeDurationMs,
      },
      properties: {
        fill: "blue",
      },
    };

    this.addElement(circleElement);
  };

  addEllipse = () => {
    const shapeDurationMs = 5000;
    const startTime = 0;
    this.setMaxTime(
      this.maxTime < startTime + shapeDurationMs
        ? startTime + shapeDurationMs
        : this.maxTime
    );
    const ellipseElement: EditorElement = {
      id: getUid(),
      type: "shape",
      shapeType: "ellipse",
      name: "Ellipse",
      placement: {
        x: 100,
        y: 100,
        width: 100, // Diameter
        height: 150, // Diameter
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      },
      timeFrame: {
        start: startTime,
        end: startTime + shapeDurationMs,
      },
      properties: {
        fill: "blue",
      },
    };

    this.addElement(ellipseElement);
  };

  addTriangle = () => {
    const shapeDurationMs = 5000;
    const startTime = 0;
    this.setMaxTime(
      this.maxTime < startTime + shapeDurationMs
        ? startTime + shapeDurationMs
        : this.maxTime
    );

    const triangleElement: EditorElement = {
      id: getUid(),
      type: "shape",
      shapeType: "triangle",
      name: "Triangle",
      placement: {
        x: 200,
        y: 200,
        width: 100,
        height: 100,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      },
      timeFrame: {
        start: startTime,
        end: startTime + shapeDurationMs,
      },
      properties: {
        fill: "green",
      },
    };

    this.addElement(triangleElement);
  };

  addImage(index: number) {
    const imageElement = document.getElementById(`image-${index}`);
    if (!isHtmlImageElement(imageElement)) {
      return;
    }
    const aspectRatio = imageElement.naturalWidth / imageElement.naturalHeight;
    const imageDurationMs = 5000;
    const startTime = 2000;
    this.setMaxTime(
      this.maxTime < startTime + imageDurationMs
        ? startTime + imageDurationMs
        : this.maxTime
    );
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
        start: startTime,
        end: startTime + imageDurationMs,
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
    // const videoDurationMs = videoElement.duration * 1000;
    const videoDurationMs = 5000;
    const startTime = 0;
    this.setMaxTime(
      this.maxTime < startTime + videoDurationMs
        ? startTime + videoDurationMs
        : this.maxTime
    );
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
        start: startTime,
        end: startTime + videoDurationMs,
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
    // const audioDurationMs = audioElement.duration * 1000;
    const audioDurationMs = 5000;
    const startTime = 0;
    this.setMaxTime(
      this.maxTime < startTime + audioDurationMs
        ? startTime + audioDurationMs
        : this.maxTime
    );
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
        start: startTime,
        end: startTime + audioDurationMs,
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

    const textDurationMs = 4000;
    const startTime = 0;
    this.setMaxTime(
      this.maxTime < startTime + textDurationMs
        ? startTime + textDurationMs
        : this.maxTime
    );

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
        start: startTime,
        end: startTime + textDurationMs,
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

export function isEditorShapeElement(
  element: EditorElement
): element is VideoEditorElement {
  return element.type === "shape";
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
