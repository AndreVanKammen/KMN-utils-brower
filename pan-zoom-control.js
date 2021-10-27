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

  minScreenInViewX: 1.0,
  minScreenInViewY: 1.0,

  includeSizeInMaxPos: true,
  scaleMinPos: false
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
    
    this.easeFactor = 0.7;
    this.lastTime = 0.0;

    this.isPanning = false;

    this.event = null;

    this.zoomCenterX = 0.5;
    this.zoomCenterY = 0.5;

    /* @type {Array<ControlHandler>) */
    this.handlers = [];

    this.onClick = this.eventHandler.bind(this, (h, x, y) => h.handleClick && h.handleClick(x, y));
    this.onMove = this.eventHandler.bind(this, (h, x, y) => h.handleMove && h.handleMove(x, y));
    this.onLeave = this.eventHandler.bind(this, (h, x, y) => h.handleLeave && h.handleLeave(x, y));
    this.onDown = this.eventHandler.bind(this, (h, x, y) => h.handleDown && h.handleDown(x, y));
    this.onUp = this.eventHandler.bind(this, (h, x, y) => h.handleUp && h.handleUp(x, y));
    this.onKeyDown = this.eventHandler.bind(this, (h, x, y) => h.handleKey && h.handleKey(x, y, false));
    this.onKeyUp = this.eventHandler.bind(this, (h, x, y) => h.handleKey && h.handleKey(x, y, true));

    this.pointerDown = false;
    this.pointerInside = false;

    this.updateSmoothBound = this.updateSmooth.bind(this);
    beforeAnimationFrame(this.updateSmoothBound);
  }

  eventHandler(m1, x, y)  {
    for (let h of this.handlers) {
      if (m1(h, x, y)) {
        return true;
      }
    }
    return false;
  };

  /**
   * Adds a control handler to be used for handling the controls
   * @param {ControlHandler} controlHandler 
   */
  addHandler(controlHandler) {
    // Last add 1st handle because it's on top
    this.handlers.unshift(controlHandler)
  }

  /**
   * Adds a control handler to be used for handling the controls
   * @param {ControlHandler} controlHandler 
   */
  removeHandler(controlHandler) {
    let ix = this.handlers.indexOf(controlHandler);
    if (ix >= 0) {
      this.handlers.splice(ix, 1);
    }
  }

  updateSmooth(time) {
    let deltaTime = time - this.lastTime;
    this.lastTime = time;

    let factor = Math.pow(this.easeFactor, deltaTime / 16.66);
    let n_factor = 1.0 - factor;
    // TODO correct for scale and offset in one run it now shifts left right on zoom

    // this.xOffsetSmooth -= 0.5 / this.xScaleSmooth;
    // this.yOffsetSmooth -= 0.5 / this.yScaleSmooth;
    // this.xOffset -= 0.5 / this.xScale;
    // this.yOffset -= 0.5 / this.yScale;

    // this.xOffset += mouseX / oldScaleX - mouseX / this.xScale;
    // this.yOffset += mouseY / oldScaleY - mouseY / this.yScale;
    let mouseX = this.zoomCenterX;
    let mouseY = this.zoomCenterY;
    let oldScaleX = this.xScaleSmooth;
    let oldScaleY = this.yScaleSmooth;

    this.xScaleSmooth = this.xScaleSmooth * factor + n_factor * this.xScale;
    this.yScaleSmooth = this.yScaleSmooth * factor + n_factor * this.yScale;

    let scale_dx = mouseX / oldScaleX - mouseX / this.xScaleSmooth;
    let scale_dy = mouseY / oldScaleY - mouseY / this.yScaleSmooth;

    this.xOffsetSmooth += scale_dx;
    this.yOffsetSmooth += scale_dy;

    this.xOffset += scale_dx;
    this.yOffset += scale_dy;

    // console.log(this.xOffsetSmooth);
    // if (!skipXOfs) {
      this.xOffsetSmooth = (this.xOffsetSmooth || 0.0) * factor + n_factor * this.xOffset;
    // }
    this.yOffsetSmooth = (this.yOffsetSmooth || 0.0) * factor + n_factor * this.yOffset;

    this.restrictPos();

    // this.xOffsetSmooth += 0.5 / this.xScaleSmooth;
    // this.yOffsetSmooth += 0.5 / this.yScaleSmooth;
    // this.xOffset += 0.5 / this.xScale;
    // this.yOffset += 0.5 / this.yScale;

    // this.xOffsetSmooth += 0.33 * (this.zoomCenterX / oldScaleX - this.zoomCenterX / this.xScaleSmooth);
    // this.yOffsetSmooth += 0.33 * (this.zoomCenterY / oldScaleY - this.zoomCenterY / this.yScaleSmooth);
    // this.restrictPos();
    beforeAnimationFrame(this.updateSmoothBound);
  }

  restrictPos() {
    
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
    this.myXOffsetSmooth = 0.0; // My offset within parentWidth
    this.myYOffsetSmooth = 0.0; // My offset within parentHeight
    this.parentWidth = 10.0;
    this.parentHeight = 2.0;
    this.widthFactor = 1.0;
    this.heightFactor = 1.0;
  }

  updateSmooth(time) {
  // update() {
    this.myXOffsetSmooth += (this.myXOffset - this.myXOffsetSmooth) * 0.2;
    this.myYOffsetSmooth += (this.myYOffset - this.myYOffsetSmooth) * 0.2;
    this.widthFactor = this.myWidth / this.parentWidth;
    this.heightFactor = this.myHeight / this.parentHeight;  // 2 /4 = 0.5
    this.xOffset = this.parent.xOffsetSmooth / this.widthFactor- this.myXOffsetSmooth / this.myWidth;// / this.parentWidth;
    this.xScale = this.parent.xScaleSmooth * this.widthFactor;
    this.yOffset = this.parent.yOffsetSmooth - this.myYOffsetSmooth;
    this.yScale = this.parent.yScaleSmooth * this.heightFactor;
    // super.updateSmooth(time);
    this.xOffsetSmooth = this.xOffset;
    this.xScaleSmooth = this.xScale;
    this.yOffsetSmooth = this.yOffset;
    this.yScaleSmooth = this.yScale;
    beforeAnimationFrame(this.updateSmoothBound);
  }
}

export default class PanZoomControl extends PanZoomBase {
  /**
   * @param {HTMLElement} element 
   * @param {Partial<typeof defaultOptions>} options 
   */
  constructor(element, options) {
    super();

    this.element = element;
    options = options || {};
    /** @type {Partial<typeof defaultOptions>} */
    this.options = { ...defaultOptions, ...options }

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
      // this.xOffset += mouseX / oldScaleX - mouseX / this.xScale;
      // this.yOffset += mouseY / oldScaleY - mouseY / this.yScale;
      // this.restrictPos();
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
        this.pointerDown = true;
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

      this.element.onpointerleave = (event) => {
        this.event = event;
        if (this.pointerInside) {
          this.pointerInside = false;
          this.onLeave(-1,-1);
        }
      }

      this.element.onpointermove = (event) => {
        this.event = event;
        this.mouseX = this.xOffset + (event.offsetX / this.element.clientWidth) / this.xScale;
        this.mouseY = this.yOffset + (1.0 - (event.offsetY / this.element.clientHeight)) / this.yScale;
        this.pointerInside = true;
        this.onMove(this.mouseX, this.mouseY);
        let newMouseX = event.offsetX / this.element.clientWidth;
        let newMouseY = 1.0 - (event.offsetY / this.element.clientHeight);
        const deltaX = (newMouseX - mouseDownX);
        const deltaY = (newMouseY - mouseDownY);
        if (Math.abs(deltaX) >= 0.01 / this.xScale || Math.abs(deltaY) >= 0.01 / this.yScale) {
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
        this.pointerDown = false;
      };
    }
  }

  restrictPos() {
    // Don't restrict pos while scaling
    if (Math.abs(this.xScale - this.xScaleSmooth) < (0.01 * this.xScaleSmooth)) {
      this.zoomCenterX = (0.5 + this.zoomCenterX) * 0.5;
  
      let maxXPos = this.options.maxXPos;
      if (this.options.includeSizeInMaxPos) {
        maxXPos -= this.options.minScreenInViewX / this.xScale;
      }
      if (this.options.scaleMinPos) {
        this.xOffset = Math.max(this.options.minXPos / this.xScale, Math.min(maxXPos, this.xOffset));
      } else {
        this.xOffset = Math.max(this.options.minXPos, Math.min(maxXPos, this.xOffset));
      }
    }
    // Don't restrict pos while scaling
    if (Math.abs(this.yScale - this.yScaleSmooth) < (0.01 * this.yScaleSmooth)) {
      this.zoomCenterY = (0.5 + this.zoomCenterY) * 0.5;
      let maxYPos = this.options.maxYPos;
      if (this.options.includeSizeInMaxPos) {
        maxYPos -= this.options.minScreenInViewY / this.yScale;
      }
      if (this.options.scaleMinPos) {
        this.yOffset = Math.max(this.options.minYPos / this.yScale, Math.min(maxYPos, this.yOffset));
      } else {
        this.yOffset = Math.max(this.options.minYPos, Math.min(maxYPos, this.yOffset));
      }
    }
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

  dispose() {
    // TODO: unbind all events
  }
}
export class PanZoomParent extends PanZoomControl {
  /**
   * @param {HTMLElement} element 
   * @param {Partial<typeof defaultOptions>} options 
   */
  constructor(element, options) {
    super(element, options);
    /** @type {PanZoomChild[]} */
    this.children = [];

    const eventHandler = (m1, m2, x, y) => {
      let childHandlers = this.getChilds(x, y);
      for (let childHandler of childHandlers) {
        childHandler.child.event = this.event;
        if (m1(childHandler.child, childHandler.x, childHandler.y)) {
          return true;
        }
      }
      return this.eventHandler(m2, x, y);
    };
    this.onClick = eventHandler.bind(
      this,
      (c, x, y) => c.onClick(x, y),
      (h, x, y) => h.handleClick && h.handleClick(x, y));
    
    this.onMove = eventHandler.bind(
      this,
      (c, x, y) => c.onMove(x, y),
      (h, x, y) => h.handleMove && h.handleMove(x, y));
    
    this.onLeave = eventHandler.bind(
      this,
      (c, x, y) => c.onLeave(x, y),
      (h, x, y) => h.handleLeave && h.handleLeave(x, y));
    
    this.onDown = eventHandler.bind(
      this,
      (c, x, y) => c.onDown(x, y),
      (h, x, y) => h.handleDown && h.handleDown(x, y));
    
    this.onUp = eventHandler.bind(
      this,
      (c, x, y) => c.onUp(x, y),
      (h, x, y) => h.handleUp && h.handleUp(x, y));
    
    this.onKeyDown = eventHandler.bind(
      this,
      (c, x, y) => c.onKeyDown(x, y),
      (h, x, y) => h.handleKey && h.handleKey(x, y, false));
    
    this.onKeyUp = eventHandler.bind(
      this,
      (c, x, y) => c.onKeyUp(x, y),
      (h, x, y) => h.handleKey && h.handleKey(x, y, true));
  }

  getChilds(px, py) {
    let result = [];
    for (let child of this.children) {
      let x = (px - (child.myXOffset / child.parentWidth)) / child.widthFactor;
      let y = py / child.heightFactor - child.myYOffset;
      if ((x > -0.01 && x < 1.01 &&
        y > -0.01 && y < 1.01) || child.pointerDown) {
        result.push({ child, x, y });
        child.pointerDown = this.pointerDown;
        if (!child.pointerInside) {
          child.pointerInside = true;
        }
      } else {
        if (child.pointerInside) {
          child.onLeave(x, y);
          child.pointerInside = false;
        }
      }
      // }
    }
    return result;
  }
}
