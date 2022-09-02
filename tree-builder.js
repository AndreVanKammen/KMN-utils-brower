import { addCSS, kmnClassName } from "../KMN-varstack-browser/utils/html-utils.js";

const cssStr = /*css*/`.${kmnClassName}.tree-main {
  list-style-type: none;
  padding-inline-start: 16px;
}
.${kmnClassName}.tree-main ul.kmn {
  list-style-type: none;
  padding-inline-start: 11px;
  margin: 4px 0;
}
.${kmnClassName}.tree-main li.kmn.level-0 {
  color: var(--subHeaderColor);
  margin: 16px 0 12px 0;
}
.${kmnClassName}.tree-main li.kmn.level-1 ul.kmn {
  padding-inline-start: 12px;
  margin: 4px 0 16px 0;
}
.${kmnClassName}.tree-main li.kmn.level-1 {
  color: white;
}
.${kmnClassName}.tree-main li.kmn.item {
  white-space: nowrap;
  color: white;
  padding: 8px 8px;
}
.${kmnClassName}.tree-main li.item:hover {
  background: rgb(64,64,64);
}
.${kmnClassName}.tree-main li.item.selected {
  background: var(--subHeaderBackground);
}
/* From: https://www.w3schools.com/howto/howto_js_treeview.asp */
.${kmnClassName}.caret {
  margin: 8px 0 16px 0;
  cursor: pointer;
  user-select: none; /* Prevent text selection */
}

.${kmnClassName}.caret::before {
  content: "\\25B6";
  color: var(--subHeaderColor);
  font-size: 10px;
  display: inline-block;
  vertical-align: middle;
  margin: 0 6px 2px -10px;
  padding: auto;
}

.${kmnClassName}.caret-down::before {
  transform: rotate(90deg);
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
    this.isVisible = level <= 1;
    this.listElement.$setVisible(this.isVisible);
  }
  _addItem(str, action = null) {
    let itemEl = this.listElement.$el({ tag: 'li', cls: `level-${this.level}` });
    itemEl.$setTextNode(str);
    this.items.push(itemEl);
    if (action) {
      itemEl.onclick = (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        action(itemEl);
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
    let subTree;
    let itemEl = this._addItem(str, (itemEl) => {
      if (this.level < 1) {
        return
      }
      subTree.isVisible = !subTree.isVisible;
      console.log('subTree.isVisible', subTree.isVisible);
      subTree.listElement.$setVisible(subTree.isVisible);
      itemEl.classList.toggle("caret-down", subTree.isVisible, subTree.listElement);
      action && action(itemEl);
    });
    if (this.level >= 1) {
      itemEl.classList.add('caret');
    }
    subTree = new TreeBuilder(itemEl, className, this.level + 1);
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

