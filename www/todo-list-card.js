class ToDoListAPI {
  fetchItems(
    hass,
    entity,
    showCompleted,
  ) {
    return hass.callWS({
      type: "todolist/tasks/list",
      entity_id: entity,
      show_completed: showCompleted,
    });
  }

  // item must include the 'id' field too
  updateItem(
    hass,
    entity,
    item,
  ) {
    return hass.callWS({
      type: "todolist/tasks/update",
      entity_id: entity,
      task: item,
    });
  }

  clearItems(
    hass,
    entity,
  ) {
    return hass.callWS({
      type: "todolist/tasks/clear",
      entity_id: entity,
    });
  }

  addItem(
    hass,
    entity,
    item,
  ) {
    return hass.callWS({
      type: "todolist/tasks/create",
      entity_id: entity,
      task: item,
    });
  }
}

((LitElement) => {
  var html = LitElement.prototype.html;
  var css = LitElement.prototype.css;

  class TodoListCard extends LitElement {
    getCardSize() {
      return (this._config ? (this._config.title ? 1 : 0) : 0) + 3;
    }

    get _showCompleted() {
      return !!(this._config && this._config.show_completed);
    }

    static get properties() {
      return {
        config: Object,
        hass: Object,
      };
    }

    setConfig(config) {
      if (!config || !config.entity) {
        throw new Error("Invalid Configuration: 'entity' required!");
      }

      this._toDoListAPI = new ToDoListAPI();
      this._config = config;
      this._uncheckedItems = [];
      this._checkedItems = [];
      this._fetchData();
    }

    connectedCallback() {
      super.connectedCallback();

      if (this.hass) {
        this._unsubEvents = this.hass.connection.subscribeEvents(
          () => this._fetchData(),
          "todo_list_updated",
        );
        this._fetchData();
      }
    }

    disconnectedCallback() {
      super.disconnectedCallback();

      if (this._unsubEvents) {
        this._unsubEvents.then((unsub) => unsub());
      }
    }

    render() {
      if (!this._config || !this.hass) {
        return html``;
      }

      return html`
      <ha-card .header="${this._config.title}">
        <div class="addRow">
          <ha-icon
            class="addButton"
            @click="${this._addItem}"
            icon="hass:plus"
            .title="${this.hass.localize(
        "ui.panel.lovelace.cards.todo-list.add_item",
      )}"
          >
          </ha-icon>
          <paper-item-body>
            <paper-input
              no-label-float
              class="addBox"
              placeholder="${this.hass.localize(
        "ui.panel.lovelace.cards.todo-list.add_item",
      )}"
              @keydown="${this._addKeyPress}"
            ></paper-input>
          </paper-item-body>
        </div>
        ${this._uncheckedItems.map((item, index) =>
        html`
              <div class="editRow">
                <paper-checkbox
                  slot="item-icon"
                  id="${index}"
                  ?checked="${item.complete}"
                  .itemId="${item.id}"
                  @click="${this._completeItem}"
                  tabindex="0"
                ></paper-checkbox>
                <paper-item-body>
                  <paper-input
                    no-label-float
                    .value="${item.name}"
                    .itemId="${item.id}"
                    @change="${this._saveEdit}"
                  ></paper-input>
                </paper-item-body>
              </div>
            `,
      )}
        ${this._checkedItems.length > 0
        ? html`
              <div class="divider"></div>
              <div class="checked">
                <span class="label">
                  ${this.hass.localize(
          "ui.panel.lovelace.cards.todo-list.checked_items",
        )}
                </span>
                <ha-icon
                  class="clearall"
                  @click="${this._clearItems}"
                  icon="hass:notification-clear-all"
                  .title="${this.hass.localize(
          "ui.panel.lovelace.cards.todo-list.clear_items",
        )}"
                >
                </ha-icon>
              </div>
              ${this._checkedItems.map((item, index) =>
          html`
                    <div class="editRow">
                      <paper-checkbox
                        slot="item-icon"
                        id="${index}"
                        ?checked="${item.complete}"
                        .itemId="${item.id}"
                        @click="${this._completeItem}"
                        tabindex="0"
                      ></paper-checkbox>
                      <paper-item-body>
                        <paper-input
                          no-label-float
                          .value="${item.name}"
                          .itemId="${item.id}"
                          @change="${this._saveEdit}"
                        ></paper-input>
                      </paper-item-body>
                    </div>
                  `,
        )}
            `
        : ""}
      </ha-card>
    `;
    }

    static get styles() {
      return [
        css`
        .editRow,
        .addRow {
          display: flex;
          flex-direction: row;
        }
        .addButton {
          padding: 9px 15px 11px 15px;
          cursor: pointer;
        }
        paper-item-body {
          width: 75%;
        }
        paper-checkbox {
          padding: 11px 11px 11px 18px;
        }
        paper-input {
          --paper-input-container-underline: {
            display: none;
          }
          --paper-input-container-underline-focus: {
            display: none;
          }
          --paper-input-container-underline-disabled: {
            display: none;
          }
          position: relative;
          top: 1px;
        }
        .checked {
          margin-left: 17px;
          margin-bottom: 11px;
          margin-top: 11px;
        }
        .label {
          color: var(--primary-color);
        }
        .divider {
          height: 1px;
          background-color: var(--divider-color);
          margin: 10px;
        }
        .clearall {
          cursor: pointer;
          margin-bottom: 3px;
          float: right;
          padding-right: 10px;
        }
        .addRow > ha-icon {
          color: var(--secondary-text-color);
        }
      `,
      ];
    }

    _fetchData() {
      if (this.hass) {
        const checkedItems = [];
        const uncheckedItems = [];
        const entity = this._config ? this._config.entity : null;
        const showCompleted = this._showCompleted;

        this._toDoListAPI
          .fetchItems(this.hass, entity, showCompleted)
          .then(items => {
            for (const key in items) {
              if (items[key].complete) {
                checkedItems.push(items[key]);
              } else {
                uncheckedItems.push(items[key]);
              }
            }
            this._checkedItems = checkedItems;
            this._uncheckedItems = uncheckedItems;
          });
      }
    }

    _completeItem(ev) {
      const entity = this._config.entity;
      const updatedTask = {
        id: ev.target.itemId,
        complete: ev.target.checked,
      };
      this._toDoListAPI
        .updateItem(this.hass, entity, updatedTask)
        .finally(() => this._fetchData());
    }

    _saveEdit(ev) {
      const entity = this._config.entity;
      const updatedTask = {
        id: ev.target.itemId,
        name: ev.target.value,
      };
      this._toDoListAPI
        .updateItem(this.hass, entity, updatedTask)
        .finally(() => this._fetchData());

      ev.target.blur();
    }

    _clearItems() {
      if (this.hass) {
        const entity = this._config.entity;
        this._toDoListAPI
          .clearItems(this.hass, entity)
          .finally(() => this._fetchData());
      }
    }

    get _newItem() {
      return this.shadowRoot.querySelector(".addBox");
    }

    _addItem(ev) {
      const newItem = this._newItem;

      if (newItem.value.length > 0) {
        const entity = this._config.entity;
        const newTask = {
          name: newItem.value,
          complete: false,
        };

        this._toDoListAPI
          .addItem(this.hass, entity, newTask)
          .finally(() => this._fetchData());
      }

      newItem.value = "";
      if (ev) {
        newItem.focus();
      }
    }

    _addKeyPress(ev) {
      if (ev.keyCode === 13) {
        this._addItem(null);
      }
    }
  }

  customElements.define("todo-list", TodoListCard);
})(window.LitElement || Object.getPrototypeOf(customElements.get("home-assistant-main")));