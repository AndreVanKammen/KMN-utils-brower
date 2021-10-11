import { beforeAnimationFrame } from "./animation-frame.js";

const defaultOptions = {
  onChange: () => {},
  minYScale: 0.001,
  maxYScale: 1000.0,
  minXScale: 0.001,
  maxXScale: 1000.0,

  minXPos: 0.0,
  maxXPos: 1.0,
  minYPos: 0.0,
  maxYPos: 1.0,

  includeSizeInMaxPos: true
}
/** @typedef {{
 *   handleClick?: (x,y) => boolean,
 *   handleMove?: (x,y) => boolean,
 *   handleDown?: (x,y) => boolean,
 *   handleUp?: (x,y) => boolean,
 *   handleKey?: (x,y,up) => boolean,
 *  }} ControlHandler 
 */

export class PanZoomBase {
  constructor() {
    this.xScale = 1.0;
    this.yScale = 1.0;

    this.xScaleSmooth = 1.0;
    this.yScaleSmooth = 1.0;

    this.xOffset = 0.0;
    this.yOffset = 0.0;
    
    this.xOffsetSmooth = 0.0;
    this.yOffsetSmooth = 0.0;

    /* @type {Array<ControlHandler>) */
    this.handlers = [];

    this.onClick = (x, y) => {
      for (let h of this.handlers) {
        if (h.handleClick(x, y)) {
          return true;
        }
      }
      return false;
    };
    this.onMove = (x, y) => {
      for (let h of this.handlers) {
        if (h.handleMove && h.handleMove(x, y)) {
          return true;
        }
      }
      return false;
    };
    this.onDown = (x, y) => {
      for (let h of this.handlers) {
        if (h.handleDown && h.handleDown(x, y)) {
          return true;
        }
      }
      return false;
    };
    this.onUp = (x, y) => {
      for (let h of this.handlers) {
        if (h.handleUp && h.handleUp(x, y)) {
          return true;
        }
      }
      return false;
    };
    this.onKeyDown = (x, y) => {
      for (let h of this.handlers) {
        if (h.handleKey && h.handleKey(x, y, false)) {
          return true;
        }
      }
      return false;
    };
    this.onKeyUp = (x, y) => {
      for (let h of this.handlers) {
        if (h.handleKey && h.handleKey(x, y, true)) {
          return true;
        }
      }
      return false;
    };

  }

  /**
   * Adds a control handler to be used for handling the controls
   * @param {ControlHandler} controlHandler 
   */
  addHandler(controlHandler) {
    // Last add 1st handle because it's on top
    this.handlers.unshift(controlHandler)
  }

}
export class PanZoomChild extends PanZoomBase {
  /**
   * 
   * @param {PanZoomBase} parent 
   */
  constructor(parent) {
    super();
    this.parent = parent;
    this.myWidth = 1.0; // My width within parentWidth
    this.myHeight = 1.0; // My height within parentHeight
    this.myXOffset = 0.0; // My offset within parentWidth
    this.myYOffset = 0.0; // My offset within parentHeight
    this.parentWidth = 10.0;
    this.parentHeight = 2.0;
  }

  update() {
    let widthFactor = this.myWidth / this.parentWidth;
    let heightFactor = this.myHeight / this.parentHeight;  // 2 /4 = 0.5
    this.xOffset = this.parent.xOffsetSmooth / widthFactor- this.myXOffset / this.myWidth;// / this.parentWidth;
    this.xScale = this.parent.xScaleSmooth * widthFactor;
    this.yOffset = this.parent.yOffsetSmooth - this.myYOffset;
    this.yScale = this.parent.yScaleSmooth * heightFactor;
    this.xOffsetSmooth = this.xOffset;
    this.xScaleSmooth = this.xScale;
    this.yOffsetSmooth = this.yOffset;
    this.yScaleSmooth = this.yScale;
  }
}

export default class PanZoomControl extends PanZoomBase {
  /**
   * @param {HTMLElement} element 
   * @param {*} options 
   */
  constructor(element, options) {
    super();

    this.element = element;
    options = options || {};
    this.options = { ...defaultOptions, ...options }

    this.lastTime = 0.0;
    this.zoomCenterX = 0.5;
    this.zoomCenterY = 0.5;
    this.isPanning = false;
    this.easeFactor = 0.6;
    this.zoomSpeed = 5.0;

    this.leftScrollMargin = this.options.maxYScale === this.options.minYScale ? 0.0 : 32.0;

    this.clear();

    let mouseInside = false;
    let keyStillDown = false;

    // TODO: Make global handler for everything
    window.addEventListener('keydown', (event) => {
      if (mouseInside) {
        this.event = event;
        keyStillDown = true;
        this.onKeyDown(this.mouseX, this.mouseY);
      }
    });
    window.addEventListener('keyup', (event) => {
      if (mouseInside || keyStillDown) {
        this.event = event;
        keyStillDown = false;
        this.onKeyUp(this.mouseX, this.mouseY);
      }
    });
    this.element.addEventListener('click', function (e) {
      if (e.ctrlKey) return;
      e.preventDefault();
    }, false);

    this.element.addEventListener('contextmenu', function (e) {
      e.preventDefault();
    }, false);

    this.element.onmouseenter = (event) => {
      mouseInside = true;
    }
    this.element.onmouseleave = (event) => {
      mouseInside = false;
    }
    // Zoom control
    this.element.onwheel = (event) => {
      this.event = event;
      let mouseX = event.offsetX / this.element.clientWidth;
      let mouseY = 1.0 - (event.offsetY / this.element.clientHeight);
      let oldScaleX = this.xScale;
      let oldScaleY = this.yScale;
      let deltaY = event.deltaY;
      if (event.deltaMode > 0) {
        // Lines
        deltaY *= 16;
      }
      if (event.deltaMode > 1) {
        // Pages
        deltaY *= 40;
      }
      if (event.offsetX > this.leftScrollMargin && !event.altKey) {
        // this.autoScaleX = false;
        // console.log(event.deltaY);
        // console.log(event.deltaMode);
        // this.xScale *= (event.deltaY > 0) ? 0.9 : (1 / 0.9);
        this.xScale *= (1000 - deltaY * this.zoomSpeed) / 1000;//  > 0) ? 0.9 : (1 / 0.9);
        this.xScale = Math.max(this.options.minXScale, Math.min(this.options.maxXScale, this.xScale));
      }
      if (event.offsetY > 32 && !event.shiftKey) {
        // this.autoScaleY = false;
        // deltaY has unusable different units depending on deltaMode, old wheelData was better but firfox doesn't support it
        this.yScale *= (1000 - deltaY * this.zoomSpeed) / 1000; // (event.deltaY > 0) ? 0.9 : (1 / 0.9);
        this.yScale = Math.max(this.options.minYScale, Math.min(this.options.maxYScale, this.yScale));
      }
      this.zoomCenterX = mouseX;
      this.zoomCenterY = mouseY;
      this.xOffset += mouseX / oldScaleX - mouseX / this.xScale;
      this.yOffset += mouseY / oldScaleY - mouseY / this.yScale;
      this.restrictPos();
      this.options.onChange();
      // console.log('mouseScale: ',this.xScale,',',this.yScale, ' ', mouseX,',',mouseY);
    }

    // Pan control
    {
      let mouseDown = false;
      let mouseMoved = false;
      let mouseDownX = 0.0;
      let mouseDownY = 0.0;
      let mouseDownTrackPosX = 0.0;
      let mouseDownTrackPosY = 0.0;

      this.element.onpointerdown = (event) => {
        this.event = event;
        this.mouseX = this.xOffset + (event.offsetX / this.element.clientWidth) / this.xScale;
        this.mouseY = this.yOffset + (1.0 - (event.offsetY / this.element.clientHeight)) / this.yScale;
        mouseDownX = event.offsetX / this.element.clientWidth;
        mouseDownY = 1.0 - (event.offsetY / this.element.clientHeight);
        mouseMoved = false;
        if (!this.onDown(this.mouseX, this.mouseY)) {
          mouseDown = true;
          this.isPanning = true;
          mouseDownTrackPosX = this.xOffset;
          mouseDownTrackPosY = this.yOffset;
          event.preventDefault();
        }
        // console.log('mouseDown: ',mouseDownX,',',mouseDownY);
        // @ts-ignore Yes it does exist!!!
        event.target.setPointerCapture(event.pointerId);
      };

      this.element.onpointermove = (event) => {
        this.event = event;
        this.mouseX = this.xOffset + (event.offsetX / this.element.clientWidth) / this.xScale;
        this.mouseY = this.yOffset + (1.0 - (event.offsetY / this.element.clientHeight)) / this.yScale;
        this.onMove(this.mouseX, this.mouseY);
        let newMouseX = event.offsetX / this.element.clientWidth;
        let newMouseY = 1.0 - (event.offsetY / this.element.clientHeight);
        const deltaX = (newMouseX - mouseDownX);
        const deltaY = (newMouseY - mouseDownY);
        if (Math.abs(deltaX) >= 0.01 || Math.abs(deltaY) >= 0.01) {
          mouseMoved = true;
        }
        if (mouseDown) {
          this.xOffset = mouseDownTrackPosX - deltaX / this.xScale;
          this.yOffset = mouseDownTrackPosY - deltaY / this.yScale;
          this.restrictPos();
          this.options.onChange();
        }
      };

      this.element.onpointerup = (event) => {
        this.event = event;
        // @ts-ignore Yes it does exist!!!
        event.target.releasePointerCapture(event.pointerId);
        this.mouseX = this.xOffset + (event.offsetX / this.element.clientWidth) / this.xScale;
        this.mouseY = this.yOffset + (1.0 - (event.offsetY / this.element.clientHeight)) / this.yScale;
        this.onUp(this.mouseX, this.mouseY);
        this.isPanning = false;
        mouseDown = false;
        if (!mouseMoved) {
          this.onClick(this.mouseX, this.mouseY);
        }
      };
    }

    this.updateSmoothBound = this.updateSmooth.bind(this);
    beforeAnimationFrame(this.updateSmoothBound);
  }

  restrictPos() {
    let maxXPos = this.options.maxXPos;
    let maxYPos = this.options.maxYPos;
    if (this.options.includeSizeInMaxPos) {
      maxXPos -= 1.0 / this.xScale;
      maxYPos -= 1.0 / this.yScale;
    }
    this.xOffset = Math.max(this.options.minXPos, Math.min(maxXPos, this.xOffset));
    this.yOffset = Math.max(this.options.minYPos, Math.min(maxYPos, this.yOffset));
  }

  clear() {
    this.xScale = 1.0;
    this.yScale = 1.0;
    this.xOffset = 0.0;
    this.yOffset = 0.0;

    this.xScaleSmooth = 1.0;
    this.yScaleSmooth = 1.0;
    this.xOffsetSmooth = 0.0;
    this.yOffsetSmooth = 0.0;
  }

  updateSmooth(time) {
    let deltaTime = time - this.lastTime;
    this.lastTime = time;
    let factor = Math.pow(this.easeFactor, deltaTime / 16.66);
    let n_factor = 1.0 - factor;
    // TODO correct for scale and offset in one run it now shifts left right on zoom
    let oldScaleX = this.xScaleSmooth;
    let oldScaleY = this.yScaleSmooth;
    this.xScaleSmooth = this.xScaleSmooth * factor + n_factor * this.xScale;
    this.yScaleSmooth = this.yScaleSmooth * factor + n_factor * this.yScale;

    // this.xOffset += this.zoomCenterX / oldScaleX - this.zoomCenterX / this.xScaleSmooth;
    // this.yOffset += this.zoomCenterY / oldScaleY - this.zoomCenterY / this.yScaleSmooth;
    
    this.xOffsetSmooth = (this.xOffsetSmooth || 0.0) * factor + n_factor * this.xOffset;
    this.yOffsetSmooth = (this.yOffsetSmooth || 0.0) * factor + n_factor * this.yOffset;

    // this.xOffsetSmooth += 0.33 * (this.zoomCenterX / oldScaleX - this.zoomCenterX / this.xScaleSmooth);
    // this.yOffsetSmooth += 0.33 * (this.zoomCenterY / oldScaleY - this.zoomCenterY / this.yScaleSmooth);

    this.restrictPos();
    beforeAnimationFrame(this.updateSmoothBound);
  }

  dispose() {
    // TODO: unbind all events
  }
}
