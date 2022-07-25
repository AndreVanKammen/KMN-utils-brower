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
  scaleMinPos: false,

  scrollXOnWheelUsingShift: false
}

export class ControlHandlerBase {
  handleClick (x,y) { 
    return false 
  }
  handleDblClick (x,y) { 
    return false 
  }
  handleMove (x,y) { 
    return false 
  }
  handleDown (x,y) { 
    return false 
  }
  handleLeave (x,y) { 
  }
  handleUp (x,y) { 
    return false 
  }
  handleKey (x,y,up) { 
    return false 
  }
  constructor() {
    this._isVisible = true;
    this._isEnabled = true;
    this._isCaptured = false;
    this._isFocused = false; // Set from _controller
    this._controller = null;
    this.onCaptureChange = (chb, value) => this._controller?.handleCaptureChange(chb, value);
    this.onFocusChange = (chb, value) => this._controller?.handleFocusChange(chb, value);
    this.onCursorChange = (chb, value) => this._controller?.handleCursorChange(chb, value);
    this._cursor = '';
    this.isSelected = false;
    // TODO: This is the isFocused from the toplevel, needs better implementation to work with _isFocussed
    this.isFocused = false;
  }

  setCursor(cursor) {
    if (this._cursor !== cursor) {
      this._cursor = cursor;
      this.onCursorChange(this, cursor);
    }
  }

  focus() {
    return this.onFocusChange(this, true);
  }

  blur() {
    return this.onFocusChange(this, false);
  }

  releaseControl() {
    return this._isCaptured = this.onCaptureChange(this, false);
  }

  captureControl() {
    return this._isCaptured = this.onCaptureChange(this, true);
  }

  get isEnabled() {
    return this._isVisible && this._isEnabled;
  }

  cleanupForDisabled() {
    if (this._isCaptured) {
      this.releaseControl();
    }
    if (this.handleLeave) {
      this.handleLeave();
    }
    this.setCursor('');
  }

  set isEnabled(x) {
    if (this._isEnabled !== x) {
      this._isEnabled = x;
      if (!x) {
        this.cleanupForDisabled();
      }
    }
  }


  get isVisible() {
    return this._isVisible;
  }

  set isVisible(x) {
    if (this._isVisible !== x) {
      this._isVisible = x;
      if (!x && this._isEnabled) {
        this.cleanupForDisabled();
      }
    }
  }

}

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
    this.currentEaseFactor = 0.7;
    this.lastTime = 0.0;

    this.isPanning = false;

    this.event = null;

    this.zoomCenterX = 0.5;
    this.zoomCenterY = 0.5;

    /* @type {Array<ControlHandler>) */
    this.handlers = [];
    this.capturedControl = null;
    this.focusedControl = null;

    this.onClick = this.eventHandler.bind(this, (h, x, y) => h.handleClick && h.handleClick(x, y));
    this.onDblClick = this.eventHandler.bind(this, (h, x, y) => h.handleDblClick && h.handleDblClick(x, y));
    this.onMove = this.eventHandler.bind(this, (h, x, y) => h.handleMove && h.handleMove(x, y));
    this.onLeave = this.eventHandler.bind(this, (h, x, y) => h.handleLeave && h.handleLeave(x, y));
    this.onDown = this.eventHandler.bind(this, (h, x, y) => h.handleDown && h.handleDown(x, y));
    this.onUp = this.eventHandler.bind(this, (h, x, y) => h.handleUp && h.handleUp(x, y));
    this.onKeyDown = this.eventHandler.bind(this, (h, x, y) => h.handleKey && h.handleKey(x, y, false));
    this.onKeyUp = this.eventHandler.bind(this, (h, x, y) => h.handleKey && h.handleKey(x, y, true));

    this.pointerDown = false;
    this.pointerInside = false;

    this._updateSmoothBound = this._updateSmooth.bind(this);
  }

  _updateSmooth(time) {
    this.updateSmooth(time)
 
    beforeAnimationFrame(this._updateSmoothBound);
  }


  eventHandler(m1, x, y, debug = false) {
    if (this.capturedControl) {
      return m1(this.capturedControl, x, y);
    }
    for (let h of this.handlers) {
      if (h.isEnabled && m1(h, x, y)) {
        if (debug) console.log('handler',h);
        return true;
      }
    }
    return false;
  };

  updateCursor(cursor) {
  }

  setCursor(cursor) {
    if (cursor !== this._cursor) {
      this._cursor = cursor;
      this.updateCursor(cursor);
    }
  }

  handleCursorChange(chb, value) {
    if (this.capturedControl) {
      this.setCursor(this.capturedControl._cursor);
      return;
    }
    for (let h of this.handlers) {
      if (h.isEnabled && h._cursor !== '') {
        this.setCursor(h._cursor);
        return;
      }
    }
    this.setCursor('');
  }

  /**
   * Adds a control handler to be used for handling the controls
   * @param {ControlHandlerBase} controlHandler 
   */
  addHandler(controlHandler) {
    // Last add 1st handle because it's on top
    this.handlers.unshift(controlHandler)
    controlHandler._controller = this;
  }

  handleCaptureChange(ch, value) {
    if (value) {
      this.capturedControl = ch;
      this.handleCursorChange();
      return true;
    } else {
      if (this.capturedControl === ch) {
        this.capturedControl = null;
      }
      this.handleCursorChange();
      return false;
    }
  }

  handleFocusChange(ch, value) {
    if (value) {
      if (this.focusedControl !== ch) {
        this.focusedControl = ch;
        for (let h of this.handlers) {
          h._isFocused = h === ch;
        }
      }
      this.handleCursorChange();
      return true;
    } else {
      if (this.focusedControl === ch) {
        this.focusedControl = null;
        for (let h of this.handlers) {
          h._isFocused = false;
        }
      }
      this.handleCursorChange();
      return false;
    }
  }

  /**
   * Adds a control handler to be used for handling the controls
   * @param {ControlHandlerBase} controlHandler 
   */
  removeHandler(controlHandler) {
    let ix = this.handlers.indexOf(controlHandler);
    if (ix >= 0) {
      this.handleCaptureChange(this.handlers[ix], false);
      this.handlers.splice(ix, 1);
    }
  }

  updateSmooth(time) {
    let deltaTime = time - this.lastTime;
    this.lastTime = time;

    let easeFactor = this.currentEaseFactor;
    let factor = Math.pow(easeFactor, deltaTime / 16.66);
    let n_factor = 1.0 - factor;
    // Ease the currenteasefactor back to the normal easefactor
    this.currentEaseFactor = this.currentEaseFactor * factor + n_factor * this.easeFactor;

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

    this.xOffsetSmooth = (this.xOffsetSmooth || 0.0) * factor + n_factor * this.xOffset;
    this.yOffsetSmooth = (this.yOffsetSmooth || 0.0) * factor + n_factor * this.yOffset;

    this.restrictPos();
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
    this.parentWidth = 1.0;
    this.parentHeight = 1.0;
    this.widthFactor = 1.0;
    this.heightFactor = 1.0;

    // Children in children
    this.childControl = new ChildControlHandler(this);
  }

  updateSmooth(time) {
    // update() {
    // TODO Smoothing of child movement 
    this.myXOffsetSmooth += (this.myXOffset - this.myXOffsetSmooth) * 0.15;
    this.myYOffsetSmooth += (this.myYOffset - this.myYOffsetSmooth) * 0.15;
    this.widthFactor = this.myWidth / this.parentWidth;
    this.heightFactor = this.myHeight / this.parentHeight;  // 2 /4 = 0.5
    this.xOffset = this.parent.xOffsetSmooth / this.widthFactor - this.myXOffsetSmooth / this.myWidth;// / this.parentWidth;
    this.yOffset = this.parent.yOffsetSmooth / this.heightFactor - this.myYOffsetSmooth / this.myHeight;
    this.xScale = this.parent.xScaleSmooth * this.widthFactor;
    this.yScale = this.parent.yScaleSmooth * this.heightFactor;
    // super.updateSmooth(time);
    this.xOffsetSmooth = this.xOffset;
    this.xScaleSmooth = this.xScale;
    this.yOffsetSmooth = this.yOffset;
    this.yScaleSmooth = this.yScale;
    for (let childControl of this.childControl.children) {
      childControl.updateSmooth();
    }
  }

  updateCursor(cursor) {
    this.parent.updateCursor(cursor);
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

    this.haltDragging = false;

    this.clear();

    let mouseInside = false;
    let keyStillDown = false;

    this.onGetZoomCenter = null;

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
      event.preventDefault();

      let mouseX = event.offsetX / this.element.clientWidth;
      let mouseY = 1.0 - (event.offsetY / this.element.clientHeight);
      let oldScaleX = this.xScale;
      let oldScaleY = this.yScale;
      let deltaY = event.deltaY;
      if (!deltaY || !isFinite(deltaY)) {
        return;
      }
      if (event.deltaMode > 0) {
        // Lines
        deltaY *= 16;
      }
      if (event.deltaMode > 1) {
        // Pages
        deltaY *= 40;
      }
      if (this.onGetZoomCenter) {
        this.onGetZoomCenter(mouseX, mouseY, deltaY);
      } else {
        this.zoomCenterX = mouseX;
        this.zoomCenterY = mouseY;
      }
      if (this.options.scrollXOnWheelUsingShift && event.shiftKey) {
        this.xOffset -= deltaY * this.zoomSpeed / this.xScale / 10000;
        this.restrictPos();
      } else {
        if (event.offsetX > this.leftScrollMargin && !event.altKey) {
          // this.autoScaleX = false;
          // console.log(event.deltaY);
          // console.log(event.deltaMode);
          // this.xScale *= (event.deltaY > 0) ? 0.9 : (1 / 0.9);
          this.xScale *= (1000 - deltaY * this.zoomSpeed) / 1000;//  > 0) ? 0.9 : (1 / 0.9);
          this.xScale = Math.max(this.options.minXScale, Math.min(this.options.maxXScale, this.xScale));
        }
      }
      if (event.offsetY > 32 && !event.shiftKey) {
        // this.autoScaleY = false;
        // deltaY has unusable different units depending on deltaMode, old wheelData was better but firfox doesn't support it
        this.yScale *= (1000 - deltaY * this.zoomSpeed) / 1000; // (event.deltaY > 0) ? 0.9 : (1 / 0.9);
        this.yScale = Math.max(this.options.minYScale, Math.min(this.options.maxYScale, this.yScale));
      }
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
      let mouseDownTime = performance.now();
      let mouseDownX = 0.0;
      let mouseDownY = 0.0;
      let mouseDownTrackPosX = 0.0;
      let mouseDownTrackPosY = 0.0;

      this.element.onpointerdown = (event) => {
        this.event = event;
        this.mouseX = this.xOffset + (event.offsetX / this.element.clientWidth) / this.xScale;
        this.mouseY = this.yOffset + (1.0 - (event.offsetY / this.element.clientHeight)) / this.yScale;
        this.pointerDown = true;
        mouseDownTime = performance.now();
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
        if (mouseDown && (Math.abs(event.offsetX) > 2.0 || Math.abs(event.offsetY) > 2.0)) {
          let clickTime = (performance.now() - mouseDownTime);
          if (clickTime > 200 && (Math.abs(event.offsetX) > clickTime || Math.abs(event.offsetY) > clickTime)) {
            mouseMoved = true;
          }
        }
        if (mouseDown && !this.haltDragging) {
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
        this.pointerDown = false;
      };

      this.element.onclick = (event) => {
        if (!mouseMoved) {
          // console.log('click',this.mouseX, this.mouseY, this.event.offsetX, this.element.clientWidth,  this.xScale, this.event.target);
          this.onClick(this.mouseX, this.mouseY);
        }
      }
      this.element.ondblclick = (event) => {
        if (!mouseMoved) {
          this.onDblClick(this.mouseX, this.mouseY);
        }
      }
    }
    beforeAnimationFrame(this._updateSmoothBound);
  }

  restrictScale() {
    this.xScale = Math.max(this.options.minXScale, Math.min(this.options.maxXScale, this.xScale));
    this.yScale = Math.max(this.options.minYScale, Math.min(this.options.maxYScale, this.yScale));
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

  updateCursor(cursor) {
    this.element.style.cursor = cursor;
  }

  dispose() {
    // TODO: unbind all events
  }
}

class ChildControlHandler {
  /**
   * 
   * @param {PanZoomBase} controller 
   */
  constructor(controller) {
    this.controller = controller;

    /** @type {PanZoomChild[]} */
    this.children = [];

    const eventHandler = (m1, m2, x, y) => {
      let childHandlers = this.getChilds(x, y);
      for (let childHandler of childHandlers) {
        childHandler.child.event = this.controller.event;
        if (m1(childHandler.child, childHandler.x, childHandler.y)) {
          return true;
        }
      }
      return this.controller.eventHandler(m2, x, y);
    };
    const eventHandlerDebug = (m1, m2, x, y) => {
      let childHandlers = this.getChilds(x, y);
      for (let childHandler of childHandlers) {
        childHandler.child.event = this.controller.event;
        if (m1(childHandler.child, childHandler.x, childHandler.y)) {
          console.log('child handler',childHandler);
          return true;
        }
      }
      console.log('main handler',this.controller);
      return this.controller.eventHandler(m2, x, y, true);
    };
    this.controller.onClick = eventHandler.bind(
      this.controller,
      (c, x, y) => c.onClick(x, y),
      (h, x, y) => h.handleClick && h.handleClick(x, y));
    
    this.controller.onDblClick = eventHandler.bind(
      this.controller,
      (c, x, y) => c.onDblClick(x, y),
      (h, x, y) => h.handleDblClick && h.handleDblClick(x, y));
    
    this.controller.onMove = eventHandler.bind(
      this.controller,
      (c, x, y) => c.onMove(x, y),
      (h, x, y) => h.handleMove && h.handleMove(x, y));
    
    this.controller.onLeave = eventHandler.bind(
      this.controller,
      (c, x, y) => c.onLeave(x, y),
      (h, x, y) => h.handleLeave && h.handleLeave(x, y));
    
    this.controller.onDown = eventHandler.bind(
      this.controller,
      (c, x, y) => c.onDown(x, y),
      (h, x, y) => h.handleDown && h.handleDown(x, y));
    
    this.controller.onUp = eventHandler.bind(
      this.controller,
      (c, x, y) => c.onUp(x, y),
      (h, x, y) => h.handleUp && h.handleUp(x, y));
    
    this.controller.onKeyDown = eventHandler.bind(
      this.controller,
      (c, x, y) => c.onKeyDown(x, y),
      (h, x, y) => h.handleKey && h.handleKey(x, y, false));
    
    this.controller.onKeyUp = eventHandler.bind(
      this.controller,
      (c, x, y) => c.onKeyUp(x, y),
      (h, x, y) => h.handleKey && h.handleKey(x, y, true));
  }

  getChilds(px, py) {
    let result = [];
    for (let child of this.children) {
      // let x = (px - (child.myXOffset / child.parentWidth)) / child.widthFactor;
      // let x = (px - (child.myXOffset / child.parentWidth)) / (child.myWidth / child.parentWidth);
      // let x = px / (child.myWidth / child.parentWidth) -
      //           (child.myXOffset / child.myWidth);
      let x = (px * child.parentWidth - child.myXOffset) / child.myWidth;
      // let y = py / child.heightFactor - child.myYOffset;
      let y = (py * child.parentHeight - child.myYOffset) / child.myHeight;
      let xm = 0.01 / child.xScale;
      let ym = 0.01 / child.yScale;
      if ((x >= -xm && x <= (1.0 + xm) &&
        y >= -ym && y < (1.0+ym)) || child.pointerDown || child.capturedControl) {
        result.push({ child, x, y });
        child.pointerDown = this.controller.pointerDown;
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


  /**
   * 
   * @param {PanZoomChild} childControl 
   */
  add(childControl) {
    this.children.push(childControl);
  }

  remove(childControl) {
    let ix = this.children.indexOf(childControl);
    if (ix >= 0) {
      this.children.splice(ix, 1);
    }
  }
}

export class PanZoomParent extends PanZoomControl {
  /**
   * @param {HTMLElement} element 
   * @param {Partial<typeof defaultOptions>} options 
   */
  constructor(element, options) {
    super(element, options);
    this.childControl = new ChildControlHandler(this);
  }

  updateSmooth(time) {
    super.updateSmooth(time);
    for (let childControl of this.childControl.children) {
      childControl.updateSmooth();
    }
  }
}
