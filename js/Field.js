'use strict';
class Field {
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
        event.preventDefault();
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

        if ( this._isAnyMineHere(y, x) ) {
            this._endOfGame('gameOver');
        } else {
            td.dataset.type = 'opened';
            this._showOpenedCell(td);

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

        this._toggleFlag(td);
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
                this.openNeighbours(td);
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

            if ( !this._isAnyMineHere(y,x) ) {
                this._field.rows[y].cells[x].dataset.info = 'M';
                i++;
            }
        }

        this._showMinesLeft();
    }

    _placeNumbers() {
        for(let i = 0; i<this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                if ( !this._isAnyMineHere(i,j) ) {
                    let count = this._mineCounter( this.cellNeighbours(i,j) );
                    this._field.rows[i].cells[j].dataset.info = count || '';
                }
            }
        }
    }

    _doesPlayerWin() {
        let victory = true;

        for(let i = 0; i<this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                let td = this._field.rows[i].cells[j];

                let isMine = this._isAnyMineHere(i, j);
                let isClosed = (td.dataset.type ==='covered' || td.dataset.type ==='marked');
                if (isClosed && !isMine) {
                    victory = false;
                    break;
                }
            }
        }

        return victory;
    }

    _endOfGame(typeOfEnd) {
        this._state = Field.END_OF_GAME;

        if (typeOfEnd === 'gameOver') {
            this._showMines();
        }

        let event = new CustomEvent("endOfGame", {
            detail: { type: typeOfEnd }
        });

        this._el.dispatchEvent(event);
    }

//------------------ different subordinate private methods---------------
    _isAnyMineHere(y,x) {
        return ( this._field.rows[y].cells[x].dataset.info ==='M' );
    }

    _mineCounter(array) {
        return array.reduce( (count, cell)=> {
            if ( this._isAnyMineHere(cell.parentNode.rowIndex, cell.cellIndex) ) {
                count++;
            }

            return count;
        },0);
    }

    _flagCounter(array) {
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

        this._selectCells(neighbours);

        let countFlagsAroundCell = this._flagCounter(neighbours);

        if (parseInt(cell.dataset.info) === countFlagsAroundCell) {
            neighbours.forEach((td)=>{
                let event = new MouseEvent("click", {
                    bubbles: true,
                    cancelable: true
                });

                td.dispatchEvent(event);
            })
        }

    }

    _openEmptyFieldAroundCell(y,x) {
        this.cellNeighbours(y, x).forEach((td)=>{
            let isMine = this._isAnyMineHere(td.parentNode.rowIndex, td.cellIndex);
            let isOpened = (td.dataset.type ==='opened');

            if ( !(isMine || isOpened) ) {
                let event = new MouseEvent("click", {
                    bubbles: true,
                    cancelable: true
                });

                td.dispatchEvent(event);
            }
        })
    }

//---------different non-logical private methods changing styles-------------
    _showMines() {
        for(let i = 0; i<this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                if (this._isAnyMineHere(i, j)) {
                    let td =  this._field.rows[i].cells[j];
                    td.classList.remove('covered');
                    td.classList.add('exploded');
                }
            }
        }
    }

    _showMinesLeft() {
        this._minesLeft.innerHTML = this.numberOfMines - this.flags;
    }

    _showOpenedCell(cell) {
        cell.classList.remove('covered');
        cell.innerHTML = cell.dataset.info;
    }

    _toggleFlag(cell) {
        cell.classList.toggle('marked');
    }

    _selectCells(array) {
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

}
