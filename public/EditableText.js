/* A DOM component that displays text and allows the user to edit it, turning into an input. */
export default class EditableText {
  constructor(id) {
    this.id = id;
    this.value = "";
    //TODO: Add instance variables, bind event handlers, etc.
    this._onClick = this._onClick.bind(this);
    this._onBlur = this._onBlur.bind(this);
  }

  /* Add the component (in display state) to the DOM under parent. When the value changes, onChange
     is called with a reference to this object. */
  addToDOM(parent, onChange) {
    let container = this._createDisplay();
    parent.appendChild(container);
    this._onChange = onChange;
  }

  /* Set the value of the component and switch to display state if necessary. Does not call onChange */
  setValue(value) {
    console.log("Setting value");
    let input = this._createInput();
    input.value = value;
    document.querySelector(`#${this.id}`).replaceWith(input);
  }


  _onClick(event) {
    console.log("Click activated")
    let input = this._createInput();
    document.querySelector(`#${this.id}`).replaceWith(input);
    input.focus();
  }

  _createDisplay() {
    let container = document.createElement("div");
    container.id = this.id;
    container.classList.add("editableText");

    let text = document.createElement("span");
    text.textContent = this.value;
    container.appendChild(text);

    let button = document.createElement("button");
    button.type = "button";
    button.textContent = "Edit";
    //Add event handler to edit button
    button.addEventListener("click", this._onClick);
    container.appendChild(button);

    return container;
  }

  _onBlur(event) {
    console.log("Event blurred")
    console.log(this)
    this.value = event.target.value;
    console.log(this)
    let display = this._createDisplay()
    document.querySelector(`#${this.id}`).replaceWith(display);
    this._onChange(this);
  }

  _createInput() {
    let input = document.createElement("input");
    input.classList.add("editableInput");
    input.type = "text";
    input.id = this.id;
    input.value = this.value;
    // Add event handler to input
    input.addEventListener("blur", this._onBlur);
    return input;
  }
}
