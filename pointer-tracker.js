
class ButtonData {
  down = false;
  x = 0;
  y = 0;
}
class PointerData {
  /** @type {Record<string,ButtonData>} */
  buttons = {};
  isOver = 0;
  isInside = 0;
  isDown = 0;
  eventCount = 0;
  pointerType = '';
  isPrimary = false;
  currentX = 0;
  currentY = 0;
  pointerId = '';
  tangentialPressure = -1;
  pressure = -1;
  tiltX = -1;
  tiltY = -1;
  twist = -1;
}
export class PointerTracker {

  /**
   * @param {EventTarget} element
   * @param {*} options
   */
  constructor(element, options = { cancelEvents: true }) {
    this.element = element;
    this.options = options;

    this.lastPrimary = undefined;

    /** @type {Record<string,PointerData>} */
    this.pointerData = {}
    this.element.addEventListener('pointerenter',this._handlePointerEnter);
    this.element.addEventListener('pointerleave',this._handlePointerLeave);
    this.element.addEventListener('pointerover',this._handlePointerOver);
    this.element.addEventListener('pointerout',this._handlePointerOut);
    this.element.addEventListener('pointerdown',this._handlePointerDown);
    this.element.addEventListener('pointerup',this._handlePointerUp);
    this.element.addEventListener('pointermove',this._handlePointerMove);
    this.element.addEventListener('pointerrawupdate', this._handlePointerRawUpdate);

    this.element.addEventListener('contextmenu',this._handlecontextmenu);

    this.element.addEventListener('touchstart',this._handleTouchStart);
    this.element.addEventListener('touchend',this._handleTouchEnd);
    this.element.addEventListener('touchmove',this._handleTouchMove);
    this.element.addEventListener('touchcancel',this._handleTouchEnd);
  }

  dispose() {
    this.element.removeEventListener('touchstart',this._handleTouchStart);
    this.element.removeEventListener('touchend',this._handleTouchEnd);
    this.element.removeEventListener('touchmove',this._handleTouchMove);
    this.element.removeEventListener('touchcancel',this._handleTouchEnd);

    this.element.removeEventListener('pointerenter', this._handlePointerEnter);
    this.element.removeEventListener('pointerleave',this._handlePointerLeave);
    this.element.removeEventListener('pointerover',this._handlePointerOver);
    this.element.removeEventListener('pointerout',this._handlePointerOut);
    this.element.removeEventListener('pointerdown',this._handlePointerDown);
    this.element.removeEventListener('pointerup',this._handlePointerUp);
    this.element.removeEventListener('pointermove',this._handlePointerMove);
    this.element.removeEventListener('pointerrawupdate',this._handlePointerRawUpdate);

    this.element.removeEventListener('contextmenu',this._handlecontextmenu);
  }

  /** @param {UIEvent} evt */
  stopEvent(evt) {
    if (this.options.cancelEvents) {
      evt.stopPropagation();
      evt.preventDefault();
    }
  }

  getLastPrimary() {
    if (this.lastPrimary != null) {
      return this.pointerData[this.lastPrimary];
    } else {
      return {};
    }
  }

  /**
   *
   * @param {PointerEvent | Touch} evt
   * @returns {PointerData}
   */
  getPointerData(evt) {
    let pointerId = (evt instanceof PointerEvent) ?
      'p_' + evt.pointerId :
      't_' + evt.identifier;
    /** @type {PointerData} */
    let pointerData = this.pointerData[pointerId];
    if (pointerData === undefined) {
      pointerData = this.pointerData[pointerId] = new PointerData();
      pointerData.pointerId = pointerId;
    }
    this.lastPrimary = pointerData.pointerId;
    pointerData.eventCount++;
    return pointerData
  }

  /**
   *
   * @param {PointerData} pointerData
   * @param {PointerEvent | Touch} evt
   * @param {String} type
   */
  updatePointerData(pointerData, evt, type = '') {
    if (evt instanceof PointerEvent) {
      pointerData.pointerType = evt.pointerType
      pointerData.isPrimary = evt.isPrimary
      pointerData.currentX = evt.pageX;
      pointerData.currentY = evt.pageY;
      pointerData.pressure = evt.pressure
      if (pointerData.pointerType.toLowerCase() === 'pen') {
        pointerData.tangentialPressure = evt.tangentialPressure
        pointerData.tiltX = evt.tiltX
        pointerData.tiltY = evt.tiltY
        pointerData.twist = evt.twist
      }
    } else {
      pointerData.pointerType = 'touch'
      pointerData.isPrimary = false;
      pointerData.currentX = evt.pageX;
      pointerData.currentY = evt.pageY;
      pointerData.pressure = evt.force;
      if (type === 'start') {
        pointerData.isInside = 1;
        pointerData.isDown = 1;
        pointerData.isOver = 1;
        pointerData.buttons[0] = { down: true, x: evt.pageX, y: evt.pageY };
      } else if (type === 'end') {
        pointerData.isDown = 0;
        pointerData.isInside = 1;
        pointerData.isOver = 1;
        pointerData.buttons[0] = { down: false, x: evt.pageX, y: evt.pageY };
        setTimeout(() => {
          pointerData.isInside = 0;
          pointerData.isOver = 0;
        }, 200);
      }
      // TODO: Probably sin cos of the angle
      // pointerInfo.tiltX = evt.rotationAngle;
      // pointerInfo.tiltY = evt.rotationAngle;
    }
    // console.log('pointerData:', JSON.stringify( pointerData));
  }

  stopGetAndUpdate(evt) {
    this.stopEvent(evt);
    let pointerData = this.getPointerData(evt)
    this.updatePointerData(pointerData, evt);
    return pointerData
  }

  _handlecontextmenu = (evt) => {
    this.stopEvent(evt);
    return false;
  }

  /** @param {PointerEvent} evt */
  _handlePointerEnter = (evt) => {
    this.stopGetAndUpdate(evt).isInside++;
  }

  /** @param {PointerEvent} evt */
  _handlePointerLeave = (evt) => {
    this.stopGetAndUpdate(evt).isInside--;
  }

  /** @param {PointerEvent} evt */
  _handlePointerOver = (evt) => {
    this.stopGetAndUpdate(evt).isOver++;
  }

  /** @param {PointerEvent} evt */
  _handlePointerOut = (evt) => {
    this.stopGetAndUpdate(evt).isOver--;
  }

  /** @param {PointerEvent} evt */
  _handlePointerDown = (evt) => {
    // console.log('down');
    let pointerData = this.stopGetAndUpdate(evt);
    if (pointerData.buttons[evt.button]?.down !== true) {
      pointerData.isDown++;
    }
    let target = evt.target;
    if (target instanceof Element) {
      target.setPointerCapture(evt.pointerId);
    }
    pointerData.buttons[evt.button] = { down: true, x: evt.pageX, y: evt.pageY };
  }

  /** @param {PointerEvent} evt */
  _handlePointerUp = (evt) => {
    // console.log('up');
    let pointerData = this.stopGetAndUpdate(evt);
    if (pointerData.buttons[evt.button]?.down) {
      pointerData.isDown--;
    }
    let target = evt.target;
    if (target instanceof Element) {
      target.releasePointerCapture(evt.pointerId);
    }
    pointerData.buttons[evt.button] = { down: false, x: evt.pageX, y: evt.pageY };
  }

  /** @param {PointerEvent} evt */
  _handlePointerMove = (evt) => {
    // console.log('move', evt.buttons);
    this.stopGetAndUpdate(evt);
  }

  /** @param {PointerEvent} evt */
  _handlePointerRawUpdate = (evt) => {
    this.stopGetAndUpdate(evt);
  }

  /** @param {TouchList} touchList */
  handleTouchUpdate(touchList, type) {
    for (let touch of touchList) {
      let pointerData = this.getPointerData(touch)
      this.updatePointerData(pointerData, touch, type);
    }
  }

  /** @param {TouchEvent} evt */
  _handleTouchStart = (evt) => {
    this.stopEvent(evt);
    this.handleTouchUpdate(evt.changedTouches,'start');
  }

  /** @param {TouchEvent} evt */
  _handleTouchEnd = (evt) => {
    this.stopEvent(evt);
    this.handleTouchUpdate(evt.changedTouches,'end');
  }

  /** @param {TouchEvent} evt */
  _handleTouchMove = (evt) => {
    this.stopEvent(evt);
    this.handleTouchUpdate(evt.touches,'move');
  }

}