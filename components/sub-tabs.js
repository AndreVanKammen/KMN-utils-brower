// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import PanelBase from './panel-base.js';
import TabController from './tab-controller.js';

const defaultOptions = {
};

class SubTabs extends PanelBase {
  constructor(options) {
    super(defaultOptions, options);

    this.tabController = new TabController(options);
  }

  /**
   * @param {HTMLElement} parentElement
   */
  initializeDOM(parentElement) {
    super.initializeDOM(parentElement);

    this.tabController.initializeDOM(this.parentElement);
  }
}
SubTabs.getTabName = () => 'TABS';

export default SubTabs;
