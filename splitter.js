import { addCSS, kmnClassName } from "../KMN-varstack-browser/utils/html-utils.js";

const cssStr = /*css*/`
.${kmnClassName}.h-splitter {
  cursor: ns-resize;
  background: rgba(0,0,0,0);
  height: var(--splitter-size);
  width: 100%;
  z-index: 4;
  top: 0;
}
`;
export class Splitter {
  constructor() {
  }
  /**
   * 
   * @param {HTMLElement} parentElement 
   * @param {string} cssVar 
   * @param {boolean} isHorizontal 
   */
  initializeDOM(parentElement, cssVar, isHorizontal) {
    addCSS('splitter', cssStr);
    this.parentElement = parentElement;
    this.cssVar = cssVar;
    this.isHorizontal = isHorizontal;
    this.splitterElement = this.parentElement.$el({
      cls: isHorizontal ? 'h-splitter' : 'v-splitter'
    });
    let mouseDownX = 0;
    let mouseDownY = 0;
    let mouseIsDown = false;
    let startVal = 100;

    this.splitterElement.onpointerdown = (event) => {
      // @ts-ignore Yes it does exist!!!
      event.target.setPointerCapture(event.pointerId);
      startVal = this.parentElement.clientHeight;// Number.parseFloat(document.documentElement.style.getPropertyValue(this.cssVar));
      mouseDownX = event.screenX;
      mouseDownY = event.screenY;
      mouseIsDown = true;
      console.log('down');
    }
    this.splitterElement.onpointerup = (event) => {
      // @ts-ignore Yes it does exist!!!
      event.target.releasePointerCapture(event.pointerId);
      mouseIsDown = false;
      console.log('up');
    }
    this.splitterElement.onpointermove = (event) => {
      if (mouseIsDown) {
        let deltaY = event.screenY - mouseDownY;
        document.documentElement.style.setProperty(this.cssVar, (startVal - deltaY).toFixed(0) + "px");
        console.log('move');
      }
    }
  }

}