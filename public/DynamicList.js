/* A DOM component which displays a list of items (strings) and allows the user to add and remove
   items. Note that the list will not automatically update after calling onAdd or onDelete; you
   must call setList to give it a new list of items. */
export default class DynamicList {
  /* placeholder is the text shown in the input */
  constructor(placeholder) {
    this._placeholder = placeholder;

    this._callbacks = { onAdd: null, onDelete: null };
    this._list = null;
    this._form = null;

    this._onAdd = this._onAdd.bind(this);
    this._onDelete = this._onDelete.bind(this);

    this._createNodes();
  }

  /* Add the list to the DOM under parent. When a new item is added, the onAdd callback is called
     with the value of the item. When an item is deleted, onDelete is called with the value being
     deleted. */
  addToDOM(parent, onAdd, onDelete) {
    this._callbacks = { onAdd, onDelete };
    parent.appendChild(this._list);
    parent.appendChild(this._form);
  }

  /* Set the list of items being displayed */
  setList(items) {
    this._list.textContent = "";
    for (let item of items) {
      let node = document.createElement("li");
      let label = document.createElement("span");
      label.textContent = item;
      label.classList.add("label");
      node.appendChild(label);

      let button = document.createElement("button");
      button.type = "button";
      button.classList.add("deleteButton");
      /* Set this attribute to make the button readable with assistive technology */
      button.setAttribute("aria-label", `Remove ${item}`);
      button.textContent = "\u00d7"; /* The "times" character */
      button.addEventListener("click", this._onDelete);
      node.appendChild(button);

      this._list.appendChild(node);
    }
  }

  _createNodes() {
    this._list = document.createElement("ul");
    this._form = document.createElement("form");

    let input = document.createElement("input");
    /* Use name to ensure we don't have duplicate IDs, but allow access through form.userid */
    input.name = "userid";
    input.type = "text";
    input.placeholder = this._placeholder;
    this._form.appendChild(input);

    let button = document.createElement("button");
    button.type = "submit";
    button.textContent = "Add";
    button.addEventListener("click", this._onAdd);
    this._form.appendChild(button);
  }

  _onAdd(event) {
    event.preventDefault();
    let input = this._form.userid;
    let item = input.value;
    input.value = "";
    this._callbacks.onAdd(item);
  }

  _onDelete(event) {
    let node = event.currentTarget.parentNode;
    let item = node.querySelector(".label").textContent;
    this._callbacks.onDelete(item);
  }
}
