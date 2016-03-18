'use strict';
const MAX_FIELD_HEIGHT = 16; // according to MS Windows
const MINES_CONFIGURATION = {
    9: 10,
    16: 40,
    30: 99
};

function calculateNumberOfMines(size) {
    return MINES_CONFIGURATION[size];
}

class Minesweeper {
    constructor(options) {
        this._el = options.element;

        this.startGame = this.startGame.bind(this);
        this.finishGame = this.finishGame.bind(this);

        this._levelSelector = this._el.querySelector('[data-selector="levelSelector"]');
        this._levelSelector.addEventListener('change', this.startGame);

        this._refreshBtn = this._el.querySelector('[data-selector="refreshBtn"]');
        this._refreshBtn.addEventListener('click', this.startGame);

        this._fieldPlace = this._el.querySelector('[data-component="fieldPlace"]');
        this._fieldPlace.addEventListener('endOfGame', this.finishGame);

    }

    static showEl(el) {
        el.classList.remove('js-hidden');
    }
    static hideEl(el) {
        el.classList.add('js-hidden');
    }

    get state() {
        return this._state;
    }

    startGame() {
        this._clear();

        let level = parseInt(this._levelSelector.options[this._levelSelector.selectedIndex].value);

        if (level) {
            Minesweeper.showEl(this._refreshBtn);
            Minesweeper.showEl(this._fieldPlace);

            this._field = new Field({
                element: this._fieldPlace,
                width: level,
                height: Math.min(level, MAX_FIELD_HEIGHT),
                numberOfMines: calculateNumberOfMines(level)
            });


        } else {
            Minesweeper.hideEl(this._fieldPlace);
            Minesweeper.hideEl(this._refreshBtn);
        }
    }

    finishGame(event) {
        switch (event.detail.type) {

            case 'gameOver': {
                if (!this._gameOverNotification) {
                    this._gameOverNotification = new Notification({
                        text: 'Game Over!!!',
                        place: this._el,
                        anchor: this._el.querySelector('[data-selector="field"]'),
                        position: 'center',
                        additionalStyleClass: 'gameOver'
                    })
                }
                this._gameOverNotification.show();

                this._gameOverNotification.positionAt({
                    anchor: this._fieldPlace,
                    position: 'center'
                });
                break;
            }

            case 'victory': {
                if (!this._victoryNotification) {
                    this._victoryNotification = new Notification({
                        text: 'Victory!!!',
                        place: this._el,
                        anchor: this._fieldPlace,
                        position: 'center',
                        additionalStyleClass: 'victory'
                    })
                }
                this._victoryNotification.show();

                this._victoryNotification.positionAt({
                    anchor: this._fieldPlace,
                    position: 'center'
                });
                break;
            }
        }
    }

    _clear() {
        if(this._gameOverNotification) {
            this._gameOverNotification.hide();
        }

        if(this._victoryNotification) {
            this._victoryNotification.hide();
        }

        if(this._field) {
            this._field.clear();
            this._field = null;
        }
    }
}
