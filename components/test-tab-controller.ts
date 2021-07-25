// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { addCSS } from '../../KMN-varstack-browser/utils/html-utils.js';
import TabFromDiv from './test-tab-from-div';
import PanelBase from './panel-base.js';

const cssStr = `/*css*/ 
:root {
  --tabHeaderHeight: 32px;
  --codeBackground: rgb(24, 24, 24);
  --codeText: rgb(200,200,200);
}
.tabHeader {
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
.tabPanel {
  overflow: hidden;
  background: var(--backgroundColor);
  color: var(--subHeaderColor)
}
.tabContent {
  top: var(--tabHeaderHeight);
  height: calc(100% - var(--tabHeaderHeight));
  overflow: hidden;
}
.tabContentNoTabs {
  top: 0;
  height: 100%;
}
.tabButton {
  background: var(--subHeaderBackground);
  color: var(--subHeaderColor);
  border: none;
  border-right: 1px solid black;
  outline: none;
  display: inline-block;
  padding: 0px 12px;
  height: 100%;
}
.tabButton:hover {
  background: var(--activeColor);
  color: white;
}
.tabButton.selected {
  background: var(--backgroundColor);
  outline: 1.5px solid var(--activeColor);
}
/*!css*/`
function isPanelBase(val: unknown): val is PanelBase {
  // return true if val is a Thing
  return true;
}

class TabInfo {
  instance: PanelBase = null;
  onSelect: (TabInfo)=>void  = null;
  /** @type {HTMLElement} */
  tabElement = null;
  tabName = '';
}
interface TabInfoMap {
  [key: string] : TabInfo;
}
class TabSelect {
  tabs: TabInfoMap = {};
  selectedTab: TabInfo = null;
  parentElement: HTMLElement;
  firstTab: TabInfo = null;

  initializeDOM(parentElement : HTMLElement) {
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

interface TabControllerOptions {
  hideTabs?: any; 
  onSelect?: (arg0: any) => void;
}
const defaultOptions: TabControllerOptions = {
  hideTabs: false,
  onSelect: undefined
};

class TabController {
  options: TabControllerOptions = undefined;
  currentScreenInstance: PanelBase = null;
  tabSelect: TabSelect;
  handleTabSelectBound: any;
  parentElement: HTMLElement;
  tabsContent: HTMLElement;
  tabsHeader: HTMLElement;
  tabSelectElement: HTMLElement;

  constructor(options: TabControllerOptions) {
    this.options = { ...defaultOptions, ...options };
    this.tabSelect = new TabSelect();
  }

  initializeDOM(parentElement: HTMLElement) {
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

  getTabName(classOrStr: typeof PanelBase | string) : string {
    if (typeof classOrStr === 'string') {
      return classOrStr
    }
    return classOrStr.getTabName();
  }

  setSelectedTab(classOrStr: typeof PanelBase | string) {
    let tabName = this.getTabName(classOrStr);
    this.tabSelect.setSelectedTab(tabName);
  }

  handleTabSelect = (tabInfo: TabInfo) => {
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

  
  addTabFromDiv(name:string, divToShow:string) {
    return this.addTab(TabFromDiv, { tabName:name, divToShow });
  }

  addTab<T extends PanelBase,K extends TabOptions>(classType: new(o:K) => T, options?: K) : T {
    let tabName = options?.tabName ||
      // @ts-ignore: To stupid to find the static method i guess
      classType.getTabName();

    let tabInfo = new TabInfo()
    let result = new classType(options);
    tabInfo.instance = result;
    tabInfo.onSelect = this.handleTabSelect;
    tabInfo.tabName = tabName;

    this.tabSelect.addTab(tabInfo);
    return result;
  }
}
export interface TabOptions {
  tabName?:string;
}
// let tc = new TabController({});
// let y = tc.addTabFromDiv('asd',
// let x = tc.addTab(TabFromDiv,{tabName:'asd',divToShow:''});
// x.initializeDOM



export { TabController as default, TabSelect };
