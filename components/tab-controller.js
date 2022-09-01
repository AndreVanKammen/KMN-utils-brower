// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { addCSS, kmnClassName } from '../../KMN-varstack-browser/utils/html-utils.js';
import TabFromDiv from './tab-from-div.js';
import PanelBase from './panel-base.js';

const cssStr = /*css*/`
.${kmnClassName} {
  --tabHeaderHeight: 48px;
  --codeBackground: rgb(24, 24, 24);
  --codeText: rgb(200,200,200);
}
.${kmnClassName}.tabHeader {
  position: absolute;
  border-bottom: var(--subBorderWidth) solid var(--borderColor);
  border-right: var(--subBorderWidth) solid var(--borderColor);
  color: var(--subHeaderColor);
  background: var(--subHeaderBackground);
  height: calc(var(--tabHeaderHeight) - var(--subBorderWidth));
  width: 100%;
  padding: 0px;
  line-height: calc(var(--tabHeaderHeight) - var(--subBorderWidth) - 6px);
}
.${kmnClassName}.tabPanel {
  overflow: hidden;
  background: var(--backgroundColor);
  color: var(--subHeaderColor)
}
.${kmnClassName}.tabContent {
  top: var(--tabHeaderHeight);
  height: calc(100% - var(--tabHeaderHeight));
  overflow: hidden;
}
.${kmnClassName}.tabContentNoTabs {
  top: 0;
  height: 100%;
}
.${kmnClassName}.tabButton.selected {
  border: none;
  background: rgb(67, 67, 67);
}
.${kmnClassName}.tabButton {
  background: black;
  display: inline-block;
  padding: 0px 12px;
  height: 100%;
}
/*!css*/`

class TabInfo {
  /** @type {PanelBase} */
  instance = null;
  /** @type {(ti:TabInfo) => void} */
  onSelect = null;
  /** @type {HTMLElement} */
  tabElement = null;
  tabName = '';
}

class TabSelect {
  /** @type {Object <string,TabInfo>} */
  tabs = {};
  /** @type {TabInfo} */
  selectedTab = null;

  /** @param {HTMLElement} parentElement */
  initializeDOM(parentElement) {
    this.parentElement = parentElement;
    this.updateTabs();

    if (this.firstTab) {
      if (this.selectedTab) {
        this.selectedTab.tabElement?.$setSelected();
        this.selectedTab.onSelect(this.selectedTab);
      } else {
        this.setSelectedTab(this.firstTab.tabName);
      }
    }
  }

  updateTabs() {
    if (!this.parentElement) {
      return
    }
    this.parentElement.$removeChildren();
    for (const tabName of Object.keys(this.tabs)) {
      let tabInfo = this.tabs[tabName];
      let tabEl = tabInfo.tabElement;
      if (!tabEl) {
        tabEl = this.parentElement.$el({ tag: 'button', cls: 'tabButton' });
        tabEl.$setTextNode(tabName);
        tabEl.onclick = () => this.setSelectedTab(tabName);
        tabInfo.tabElement = tabEl;
      } else {
        this.parentElement.appendChild(tabEl);
      }
    }
  }

  /** @param {string} tabName */
  setSelectedTab(tabName) {
    let newTab = this.tabs[tabName] || this.firstTab
    if ((this.selectedTab?.tabName !== newTab?.tabName) && newTab) {
      this.selectedTab = newTab
      this.selectedTab.tabElement?.$setSelected();
      if (this.selectedTab.onSelect) {
        this.selectedTab.onSelect(this.selectedTab);
      }
    }
  }

  /** @param {TabInfo} tabInfo */
  addTab(tabInfo) {
    this.tabs[tabInfo.tabName] = tabInfo;
    if (this.parentElement) {
      this.updateTabs();
    }
    if (!this.firstTab) {
      this.firstTab = tabInfo;
    }
    return tabInfo;
  }
}

/** @typedef {{ hideTabs?: any; onSelect?: (arg0: any) => void; }} TabControllerOptions */
/** @type {TabControllerOptions} */
const defaultOptions = {
  hideTabs: false,
  onSelect: undefined
};

class TabController {
  /** @type {TabControllerOptions} */
  options = undefined;
  /** @type {PanelBase} */
  currentScreenInstance = null;

  /** @param {TabControllerOptions} [options] */
  constructor(options) {
    this.options = { ...defaultOptions, ...options };
    this.tabSelect = new TabSelect();

    // TODO remove this construct if all major browsers support arrow functions in the class definition
    this.handleTabSelectBound = this.handleTabSelect.bind(this);
  }

  /** @param {HTMLElement} parentElement */
  initializeDOM(parentElement) {
    this.parentElement = parentElement;
    addCSS('tab-controller', cssStr);

    this.tabsContent = this.parentElement.$el({ cls: 'tabContent' });
    if (!this.options.hideTabs) {
      this.tabsHeader = this.parentElement.$el({ cls: 'tabHeader' });
      this.tabSelectElement = this.tabsHeader.$el({ cls: 'tabBar' });
    } else {
      this.tabsContent.classList.add('tabContentNoTabs');
    }
    this.tabSelect.initializeDOM(this.tabSelectElement);
  }

  /** @param { PanelBase | string} classOrStr */
  getTabName(classOrStr) {
    if (typeof classOrStr === 'function') {
      // @ts-ignore: Impossible to get right?
      return classOrStr.getTabName();
    }
    return classOrStr
  }

  /** @param {string | PanelBase} classOrStr */
  setSelectedTab(classOrStr) {
    let tabName = this.getTabName(classOrStr);
    this.tabSelect.setSelectedTab(tabName);
  }

  /** @param {TabInfo} tabInfo */
  handleTabSelect(tabInfo) {
    if (!this.tabsContent) {
      return
    }

    if (!tabInfo.instance.DOMInitialized) {
      tabInfo.instance.initializeDOM(this.tabsContent);
    }

    if (this.currentScreenInstance !== tabInfo.instance) {
      if (this.currentScreenInstance) {
        this.currentScreenInstance.hide();
      }
      this.currentScreenInstance = tabInfo.instance;
      tabInfo.instance.show();
    }
    if (this.options.onSelect) {
      this.options.onSelect(tabInfo);
    }
  }

  /**
   * @param {string} name
   * @param {string | object} divToShow
   */
  addTabFromDiv(name, divToShow) {
    return this.addTab(TabFromDiv, { tabName: name, divToShow });
  }

  /**
   * @template {Object<string,any>} R
   * @template {PanelBase} T
   * @param {new (opt:R) => T} classType - A generic parameter that flows through to the return type
   * @param {R} [options] - The options to pass trough for creating @classType
   * @return {T}
   */
  addTab(classType, options) {
    let tabName = options?.tabName ||
      // @ts-ignore: To stupid to find the static method i guess
      classType.getTabName();

    let tabInfo = new TabInfo()
    // @ts-ignore: Can't define parameter with type any if typescript implicit any is not allowed :(
    tabInfo.instance = new classType(options);
    tabInfo.onSelect = this.handleTabSelectBound;
    tabInfo.tabName = tabName;

    this.tabSelect.addTab(tabInfo);
    // @ts-ignore: Typescript is to stupid to understand it i guess
    return tabInfo.instance;
  }
}

export { TabController as default, TabSelect };
