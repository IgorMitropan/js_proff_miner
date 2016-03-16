'use strict';
class Notification {
    constructor(options) {
        this._el = document.createElement('div');
        this._el.className = "notification";
        this._el.innerHTML = options.text;
        if (options.addClass) {
            this._el.classList.add(options.addClass);
        }
        document.body.appendChild(this._el);

        this.positionAt(options);
    }
    positionAt(options) {
        let box = options.anchor.getBoundingClientRect();
        let top;
        let left;
        switch (options.position) {
            case 'center': {
                top = box.top + options.anchor.offsetHeight / 2 - this._el.offsetHeight / 2;
                left = box.left + options.anchor.offsetWidth / 2 - this._el.offsetWidth / 2;
                break;
            }
            default: {
                top = 10;
                left = 530;
            }
        }
        this._el.style.top = (options.top || top ) + 'px';
        this._el.style.left = (options.left || left) + 'px';
    }

    removeNotification() {
        document.body.removeChild(this._el);
    }
}
