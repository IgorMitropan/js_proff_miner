'use strict';
class Field {
    constructor(options) {
        this._el = options.element;
        this._width = options.width;
        this._height = options.height;
        this._numberOfMines = options.numberOfMines;
        this._flags = 0;

        this._renderField();
        this._table = this._el.querySelector('[data-elementType="table"]');
        this._minesLeft = this._el.querySelector('[data-elementType="minesLeftIndicator"]');

        this._placeMines();
        this._placeNumbers();

        this._openCell = this._openCell.bind(this);
        this._table.addEventListener('click',this._openCell);

        this._setFlag = this._setFlag.bind(this);
        this._table.addEventListener('contextmenu',this._setFlag);
    }

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

    isAnyMineHere(y,x) {
        return ( this._table.rows[y].cells[x].dataset.info ==='M' );
    }
    cellNeighbours(y,x) {
        let neighbours = [];

        for (let i = Math.max(y-1, 0); i <= Math.min(y+1, this.height-1); i++) {
            for (let j = Math.max(x-1, 0); j <= Math.min(x+1, this.width-1); j++) {
                if ( !(i === y && j === x) ) {
                    neighbours.push(this._table.rows[i].cells[j]);
                }
            }
        }

        return neighbours;
    }

    mineCounter(array) {
        return array.reduce( (count, cell)=> {
            if ( this.isAnyMineHere(cell.parentNode.rowIndex, cell.cellIndex) ) {
                count++;
            }

            return count;
        },0);
    }

    _renderField() {
        let fieldHtml = 'Mines left: <div class="innerDiv" data-elementType="minesLeftIndicator"></div><table data-elementType="table">';

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

            if ( !this.isAnyMineHere(y,x) ) {
                this._table.rows[y].cells[x].dataset.info = 'M';
                i++;
            }
        }

        this._showMinesLeft();
    }
    _placeNumbers() {
        for(let i = 0; i<this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                if ( !this.isAnyMineHere(i,j) ) {
                    let count = this.mineCounter( this.cellNeighbours(i,j) );
                    this._table.rows[i].cells[j].dataset.info = count || '';
                }
            }
        }
    }

    _openCell(event) {
        let td = event.target.closest('td');

        if (!td) return null;

        let y = td.parentNode.rowIndex;
        let x = td.cellIndex;

        if ( this.isAnyMineHere(y, x) ) {
            this._endOfGame('gameOver');
            return null;
        }

        td.dataset.type = 'opened';
        this._showOpenedCell(td);

        if ( td.dataset.info ==='' ) {
            this._openNeighbours(y,x);
        }

        if ( this._doesPlayerWin() ) {
            this._endOfGame('victory');
        }
    }
    _setFlag(event) {
        event.preventDefault();

        let td = event.target.closest('td');

        if (!td) return null;

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
    _openNeighbours(y,x) {
        this.cellNeighbours(y, x).forEach((td)=>{
            let isMine = this.isAnyMineHere(td.parentNode.rowIndex, td.cellIndex);
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
    _doesPlayerWin() {
        let victory = true;

        for(let i = 0; i<this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                let td = this._table.rows[i].cells[j];

                let isMine = this.isAnyMineHere(i, j);
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
        this._table.removeEventListener('click', this._openCell);
        this._table.removeEventListener('contextmenu',this._setFlag);

        if (typeOfEnd === 'gameOver') {
            this._showMines();
        }

        let event = new CustomEvent("endOfGame", {
            detail: { type: typeOfEnd }
        });

        this._el.dispatchEvent(event);
    }


    _showMines() {
        for(let i = 0; i<this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                if (this.isAnyMineHere(i, j)) {
                    let td =  this._table.rows[i].cells[j];
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
        cell.classList.remove('covered','marked');
        cell.innerHTML = cell.dataset.info;
    }

    _toggleFlag(cell) {
        cell.classList.toggle('marked');
    }

}
