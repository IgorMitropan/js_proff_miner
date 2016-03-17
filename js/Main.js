'use strict';
const MAX_FIELD_HEIGHT = 16; // according to MS Windows
const MINES_CONFIGURATION = {
    9: 10,
    16: 40,
    30: 99
};
let myField;
let myNotification;

let container = document.getElementById('fieldPlace');
container.addEventListener('endOfGame', endOfGame);

function endOfGame(event) {
    let additionalClass;
    let message;

    switch (event.detail.type) {
        case 'gameOver': {
            additionalClass = 'gameOver';
            message = 'Game Over!!!';
            break;
        }
        case 'victory': {
            additionalClass = 'victory';
            message = 'Victory!!!';
            break;
        }
    }

    myNotification = new Notification({
        text: message,
        place: container,
        anchor: container.querySelector('table'),
        position: 'center',
        additionalStyleClass: additionalClass
    });
}

let fieldSizeSelect = document.getElementById('fieldSize');
fieldSizeSelect.addEventListener('change', createField);

let refresh = document.getElementById('refresh');
refresh.addEventListener('click', createField);

function createField() {
    clear();

    let size = parseInt(fieldSizeSelect.options[fieldSizeSelect.selectedIndex].value);

    if (size) {
        container.classList.add('container');
        refresh.hidden = false;

        myField = new Field({ element: container,
            width: size,
            height: Math.min(size, MAX_FIELD_HEIGHT),
            numberOfMines: calculateNumberOfMines(size)
        });
    } else {
        container.classList.remove('container');
        refresh.hidden = true;
    }
}

function clear() {
    if(myNotification) {
        myNotification.removeNotification();
        myNotification = null;
    }

    if(myField) {
        myField = null;
    }

    container.innerHTML = '';
}

function calculateNumberOfMines(size) {
    return MINES_CONFIGURATION[size];
}
