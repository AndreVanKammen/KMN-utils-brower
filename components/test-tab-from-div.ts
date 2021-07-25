// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import PanelBase from './panel-base.js';
import { TabOptions } from './test-tab-controller';

const defaultOptions = {
};
interface TabFromDivOptions extends TabOptions {
  /** id of the div to show */ 
  divToShow: string;
}

class TabFromDiv extends PanelBase {
  constructor(options : TabFromDivOptions) {
    super(defaultOptions, options);
  }

  initializeDOM(parentElement :HTMLElement) {
    super.initializeDOM(parentElement);

    let element = document.getElementById(this.options.divToShow);
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
