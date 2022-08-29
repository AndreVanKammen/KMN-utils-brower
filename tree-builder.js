import { addCSS, kmnClassName } from "../KMN-varstack-browser/utils/html-utils.js";

const cssStr = /*css*/`.${kmnClassName}.tree-main {
  list-style-type: none;
  padding-inline-start: 16px;
}
.${kmnClassName}.tree-main ul.kmn {
  list-style-type: none;
  padding-inline-start: 24px;
  margin: 4px 0;
}
.${kmnClassName}.tree-main li.kmn.level-0 {
  color: gray;
  margin: 24px 0 12px 0;
}
.${kmnClassName}.tree-main li.kmn.level-1 ul.kmn {
  padding-inline-start: 12px;
  margin: 4px 0 0 0;
}
.${kmnClassName}.tree-main li.kmn.level-1 {
  color: var(--subHeaderColor);
}
.${kmnClassName}.tree-main li.kmn.item {
  color: var(--subHeaderColor);
  padding: 8px 8px;
}
.${kmnClassName}.tree-main li.item:hover {
  background: rgb(64,64,64);
}
.${kmnClassName}.tree-main li.item.selected {
  background: var(--subHeaderBackground);
}
`;

export class TreeBuilder {
  constructor(element, className, level = 0) {
    addCSS('tree-buidler', cssStr);
    this.element = element;
    this.level = level;
    this.listElement = element.$el({ tag: 'ul', cls: className });
    this.items = [];
    this.subTrees = [];
  }
  _addItem(str, action = null) {
    let itemEl = this.listElement.$el({ tag: 'li', cls: `level-${this.level}` });
    itemEl.$setTextNode(str);
    this.items.push(itemEl);
    if (action) {
      itemEl.onclick = (evt) => {
        action(itemEl);
        evt.preventDefault();
        evt.stopPropagation();
        return true;
      };
      itemEl.style.cursor = 'pointer';
    }
    return itemEl;
  }

  addItem(str, action = null) {
    let itemEl = this._addItem(str, action);
    itemEl.classList.add('item');
    return itemEl;
  }

  setSelected(itemEl) {
    this.listElement.$clearSelected();
    for (let st of this.subTrees) {
      st.setSelected(itemEl);
    }
    if (this.items.indexOf(itemEl) !== -1) {
      itemEl.$setSelected();
    }
  }

  addSubMenu(str, className, action = null) {
    let itemEl = this._addItem(str, action);
    let subTree = new TreeBuilder(itemEl, className, this.level + 1);
    this.subTrees.push(subTree);
    return subTree;
  }

  clear() {
    for (let subTree of this.subTrees) {
      subTree.dispose();
    }
    for (let itemEl of this.items) {
      itemEl.remove();
    }
    this.subTrees = [];
    this.items = [];
  }

  dispose() {
    this.clear();
  }
}

