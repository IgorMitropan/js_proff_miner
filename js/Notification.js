'use strict';
const TOP_OFFSET_FOR_NOTIFICATION = 10;
const RIGHT_OFFSET_FOR_NOTIFICATION = 10;
class Notification {
    constructor(options) {
        this._el = document.createElement('div');
        this._el.className = "notification";
        this._el.innerHTML = options.text;
        this._el.oncontextmenu = Notification.preventContextMenu;

        if (options.additionalStyleClass) {
            this._el.classList.add(options.additionalStyleClass);
        }

        let parent = options.place || document.body;
        parent.appendChild(this._el);

        this.positionAt(options);
    }

    static preventContextMenu(event) {
        event.preventDefault();
    }

    positionAt(options) {
        if (options.top && options.left) {
            this._el.style.top = options.top + 'px';
            this._el.style.left = options.left + 'px';
        } else {
            let box;
            let top;
            let left;

            if (options.anchor) {
                box = options.anchor.getBoundingClientRect();
            } else {
                box = this._el.parentNode.getBoundingClientRect();
            }

            if (options.position) {
                switch (options.position) {
                    case 'center': {
                        top = box.top + box.height / 2 - this._el.offsetHeight / 2;
                        left = box.left + box.width / 2 - this._el.offsetWidth / 2;
                        break;
                    }
                }
            } else {
                top = box.top + TOP_OFFSET_FOR_NOTIFICATION;
                left = box.right - this._el.offsetWidth - RIGHT_OFFSET_FOR_NOTIFICATION;
            }

            this._el.style.top = top + 'px';
            this._el.style.left = left + 'px';
        }
    }

    show() {
        this._el.classList.remove('js-hidden');
    }

    hide() {
        this._el.classList.add('js-hidden');
    }

    removeNotification() {
        this._el.parentNode.removeChild(this._el);
    }
}
