// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import PanelBase from './panel-base.js';

const defaultOptions = {
};

class TabFromDiv extends PanelBase {
  constructor(options) {
    super(defaultOptions, options);
  }

  /**
   * @param {HTMLElement} parentElement
   */
  initializeDOM(parentElement) {
    super.initializeDOM(parentElement);

    let element;
    if (typeof this.options.divToShow === 'string') {
      element = document.getElementById(this.options.divToShow);
    } else {
      element = this.options.divToShow
    }
    if (!element) {
      console.error('div not found!');
      return;
    }
    element.$setVisible(true);
    this.parentElement.appendChild(element);
  }
}
TabFromDiv.getTabName = () => 'WELCOME';

export default TabFromDiv;
