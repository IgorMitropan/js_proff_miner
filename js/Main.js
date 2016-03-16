'use strict';
const MAX_FIELD_HEIGHT = 16;
let myField;
let myNotification;

let container = document.getElementById('fieldPlace');
container.addEventListener('endOfGame', endOfGame);

function endOfGame(event) {
    let classAddedToNotification;
    let message;
    switch (event.detail.type) {
        case 'gameOver': {
            classAddedToNotification = 'gameOver';
            message = 'Game Over!!!';
            break;
        }
        case 'victory': {
            classAddedToNotification = 'victory';
            message = 'Victory!!!';
            break;
        }
    }
    myNotification = new Notification({
        text: message,
        anchor: container.querySelector('table'),
        position: 'center',
        addClass: classAddedToNotification
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
            mines: calculateNumberOfMines(size)
        });
    } else {
        container.classList.remove('container');
        refresh.hidden = true;
    }
}

function clear() {
    container.innerHTML = '';
    if(myNotification) {
        myNotification.removeNotification(0);
        myNotification = null;
    }
    if(myField) {
        myField = null;
    }
}

function calculateNumberOfMines(size) {
    switch (size) {
        case 9: {
            return 10;
        }
        case 16: {
            return 40;
        }
        case 30: {
            return 99;
        }
    }
}
