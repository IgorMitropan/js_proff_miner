'use strict';
class Cell {
    static isAnyMineHere(cell) {
        return ( cell.dataset.info ==='M' );
    }

    static mineCounter(array) {
        return array.reduce( (count, cell)=> {
            if ( Cell.isAnyMineHere(cell) ) {
                count++;
            }

            return count;
        },0);
    }

    static flagCounter(array) {
        return array.reduce( (count, cell)=> {
            if ( cell.dataset.type === 'marked' ) {
                count++;
            }

            return count;
        },0);
    }

//---------different non-logical methods changing styles-----------
    static showOpenedCell(cell) {
        cell.classList.remove('covered');
        cell.innerHTML = cell.dataset.info;
    }

    static toggleFlag(cell) {
        cell.classList.toggle('marked');
    }

    static selectCells(array) {
        array.forEach((td)=>{
            if (td.dataset.type==='covered') {
                td.classList.add('selected');
            }
        });
    }
}
