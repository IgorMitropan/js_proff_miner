'use strict';
import * as polyfills from'./Polyfills';
polyfills.installMatches(); //cross browser polyfill for 'matches' (does not supported by IE)
polyfills.installClosest(); //cross browser polyfill for 'closest' (does not supported by IE)
polyfills.installCustomEvent(); //cross browser polyfill for 'custom events' (does not supported by IE)

export default class Field{
    constructor(options) {
        this._el = options.element;
        this._width = options.width;
        this._height = options.height;
        this._numberOfMines = options.numberOfMines;
        this._flags = 0;

        this._state = Field.PLAYING;

        this._simultaneousClick = {
            cell: null,
            leftButtonDown: false,
            rightButtonDown: false
        };

        this._renderField();
        this._field = this._el.querySelector('[data-selector="field"]');
        this._minesLeft = this._el.querySelector('[data-selector="minesIndicator"]');

        this._placeMines();
        this._placeNumbers();

        this._openCell = this._openCell.bind(this);
        this._field.addEventListener('click',this._openCell);

        this._setFlag = this._setFlag.bind(this);
        this._field.addEventListener('contextmenu',this._setFlag);

        this._onMouseDown = this._onMouseDown.bind(this);
        this._field.addEventListener('mousedown',this._onMouseDown);

        this._onMouseUp = this._onMouseUp.bind(this);
        this._field.addEventListener('mouseup',this._onMouseUp);
    }
//------------ static constants describing state of a game-------------
    static get PLAYING() {
        return 0;
    }
    static get END_OF_GAME() {
        return 1;
    }

    //-----------get methods---------------
    get width() {
        return this._width;
    }
    get height() {
        return this._height;
    }
    get numberOfMines() {
        return this._numberOfMines;
    }
    get flags() {
        return this._flags;
    }
    get state() {
        return this._state;
    }

//----------------public methods--------------------
    clear() {
        this._el.removeChild(this._field);
        this._field = null;
    }
    cellNeighbours(y,x) {
        let neighbours = [];

        for (let i = Math.max(y-1, 0); i <= Math.min(y+1, this.height-1); i++) {
            for (let j = Math.max(x-1, 0); j <= Math.min(x+1, this.width-1); j++) {
                if ( !(i === y && j === x) ) {
                    neighbours.push(this._field.rows[i].cells[j]);
                }
            }
        }

        return neighbours;
    }

    //-----------------event listeners----------------
    _openCell(event) {
        if (this.state === Field.END_OF_GAME) {
            return null;
        }

        let td = event.target.closest('td');

        if (!td) {
            return null;
        }

        if (td.dataset.type !== 'covered') {
            return null;
        }

        let y = td.parentNode.rowIndex;
        let x = td.cellIndex;

        if( Field._isAnyMineHere(td) ) {
            this._endOfGame('gameOver');
        } else {
            td.dataset.type = 'opened';
           Field._showOpenedCell(td);

            if ( td.dataset.info ==='' ) {
                this._openEmptyFieldAroundCell(y,x);
            }

            if ( this._doesPlayerWin() ) {
                this._endOfGame('victory');
            }
        }
    }

    _setFlag(event) {
        event.preventDefault();

        if (this.state === Field.END_OF_GAME) {
            return null;
        }

        let td = event.target.closest('td');

        if (!td) {
            return null;
        }

        let tdType = td.dataset.type;
        if (tdType !== 'covered' && tdType !== 'marked') {
            return null;
        }

        switch (tdType) {
            case 'covered': {
                td.dataset.type = 'marked';
                this._flags++;
                break;
            }
            case 'marked': {
                td.dataset.type = 'covered';
                this._flags--;
                break;
            }
        }

        Field._toggleFlag(td);
        this._showMinesLeft();
    }

    _onMouseDown(event) {
        event.preventDefault();
        if (this.state === Field.END_OF_GAME) {
            return null;
        }

        if (event.which !==1 && event.which !==3) {
            return null;
        }

        let td = event.target.closest('td');
        if (!td) {
            return null;
        }

        if (event.which === 1) {
            this._simultaneousClick.leftButtonDown = true;
        }

        if (event.which === 3) {
            this._simultaneousClick.rightButtonDown = true;
        }

        if (this._simultaneousClick.cell) {
            let sameCell = (this._simultaneousClick.cell === td);
            let leftButtonDown = this._simultaneousClick.leftButtonDown;
            let rightButtonDown = this._simultaneousClick.rightButtonDown;

            if (sameCell && leftButtonDown && rightButtonDown) {
                this._openNeighbours(td);
            } else {
                this._simultaneousClick.leftButtonDown = false;
                this._simultaneousClick.rightButtonDown = false;
                this._simultaneousClick.cell = null;
            }
        } else {
            this._simultaneousClick.cell = td;
        }
    }

    _onMouseUp(event) {
        event.preventDefault();

        if(event.which == 1) {
            this._simultaneousClick.leftButtonDown = false;
        }

        if (event.which == 3) {
            this._simultaneousClick.rightButtonDown = false;
        }

        this._deselectCells();

        this._simultaneousClick.cell = null;
    }

    //--------------main private methods-----------
    _renderField() {
        let fieldHtml = '<table data-selector="field">';

        for(let i = 0; i<this.height; i++) {
            fieldHtml +='<tr>\n';
            for (let j = 0; j<this.width; j++) {
                fieldHtml+='<td class="covered" data-type="covered"></td>\n';
            }
            fieldHtml +='</tr>';
        }

        fieldHtml += '</table>';

        this._el.insertAdjacentHTML('beforeEnd',fieldHtml);
    }

    _placeMines() {
        for(let i = 1; i<=this.numberOfMines;) {
            let y = Math.round( Math.random()*(this.height - 1) );
            let x = Math.round( Math.random()*(this.width - 1) );
            let td = this._field.rows[y].cells[x];

            if ( !Field._isAnyMineHere(td) ) {
                td.dataset.info = 'M';
                i++;
            }
        }

        this._showMinesLeft();
    }

    _placeNumbers() {
        for(let i = 0; i<this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                let td = this._field.rows[i].cells[j];
                if ( !Field._isAnyMineHere(td) ) {
                    let count = Field._mineCounter( this.cellNeighbours(i,j) );
                    td.dataset.info = count || '';
                }
            }
        }
    }

    _endOfGame(typeOfEnd) {
        this._state = Field.END_OF_GAME;

        if (typeOfEnd === 'gameOver') {
            this._showMines();
        }


        let event = new CustomEvent("endOfGame", {
            detail: {type: typeOfEnd}
        });

        this._el.dispatchEvent(event);
    }

//------------------ different subordinate private methods---------------

    static _isAnyMineHere(cell) {
        return ( cell.dataset.info ==='M' );
    }

    static _mineCounter(array) {
        return array.reduce( (count, cell)=> {
            if ( Field._isAnyMineHere(cell) ) {
                count++;
            }

            return count;
        },0);
    }

    static _flagCounter(array) {
        return array.reduce( (count, cell)=> {
            if ( cell.dataset.type === 'marked' ) {
                count++;
            }

            return count;
        },0);
    }

    _openNeighbours(cell) {
        if (!cell.innerHTML) {
            return null;
        }
        let y = cell.parentNode.rowIndex;
        let x = cell.cellIndex;

        let neighbours = this.cellNeighbours(y,x);

        Field._selectCells(neighbours);

        let countFlagsAroundCell = Field._flagCounter(neighbours);

        if (parseInt(cell.dataset.info) === countFlagsAroundCell) {
            neighbours.forEach((td)=>{
                let event = {
                    target: td
                };
                this._openCell(event);
            })
        }

    }

    _openEmptyFieldAroundCell(y,x) {
        this.cellNeighbours(y, x).forEach((td)=>{
            let isMine = Field._isAnyMineHere(td);
            let isOpened = (td.dataset.type ==='opened');

            if ( !(isMine || isOpened) ) {
                let event = {
                    target: td
                };
                this._openCell(event);
            }
        })
    }

    _doesPlayerWin() {
        let victory = true;

        for(let i = 0; i<this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                let td = this._field.rows[i].cells[j];

                let isMine = Field._isAnyMineHere(td);
                let isClosed = (td.dataset.type ==='covered' || td.dataset.type ==='marked');
                if (isClosed && !isMine) {
                    victory = false;
                    break;
                }
            }
        }

        return victory;
    }

//---------different non-logical private methods changing styles-------------
    static _showOpenedCell(cell) {
        cell.classList.remove('covered');
        cell.innerHTML = cell.dataset.info;
    }

    static _toggleFlag(cell) {
        cell.classList.toggle('marked');
    }

    static _selectCells(array) {
        array.forEach((td)=>{
            if (td.dataset.type==='covered') {
                td.classList.add('selected');
            }
        });
    }

    _deselectCells () {
        let selectedCells = this._field.querySelectorAll('.selected');
        [].forEach.call(selectedCells,(td)=>{
            td.classList.remove('selected');
        });
    }

    _showMines() {
        for(let i = 0; i<this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                let td =  this._field.rows[i].cells[j];

                if (Field._isAnyMineHere(td)) {
                    td.classList.remove('covered');
                    td.classList.add('exploded');
                }
            }
        }
    }

    _showMinesLeft() {
        this._minesLeft.innerHTML = this.numberOfMines - this.flags;
    }

}