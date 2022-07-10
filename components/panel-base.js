// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { createKMNElement } from "../../KMN-varstack-browser/utils/html-utils.js";

class PanelBase {
  constructor(defaultOptions, options) {
    this.options = { ...defaultOptions, ...options };
    /** @type {HTMLElement} */
    this.parentElement = null;
    this.isVisible = false;
    this.preferredWidth = undefined;
    this.preferredHeight = undefined;
  }
  get DOMInitialized() {
    return !!this.parentElement;
  }

  /**
   * @param {HTMLElement} parentElement
   */
  initializeDOM(parentElement) {
    this.parentElement = createKMNElement("div");
    this.parentElement.classList.add("tabPanel");
    parentElement.appendChild(this.parentElement);
    this.updateHiddenClass();
  }

  updateHiddenClass() {
    if (this.parentElement) {
      if (this.isVisible) {
        this.parentElement.classList.remove("hidden");
      } else {
        this.parentElement.classList.add("hidden");
      }
    }
  }

  show() {
    this.isVisible = true;
    this.updateHiddenClass();
    return true;
    // console.log('show: ',this.__proto__.constructor.name);
  }

  hide() {
    this.isVisible = false;
    this.updateHiddenClass();
    // console.log('hide: ',this.__proto__.constructor.name);
  }
}

PanelBase.getTabName = function() {
  return this.name.toLocaleUpperCase()
}
export default PanelBase;
