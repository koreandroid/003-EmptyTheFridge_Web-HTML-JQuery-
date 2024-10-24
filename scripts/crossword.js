let board;

const inputList = [];

function initBoard() {
    const cellElements = board.getElementsByTagName('td');
    for (el of cellElements) {
        inputList.push(el.appendChild(document.createElement('input')));
    }
}

function setupNextPuzzle() {
    initBoard();
}

{
    const $ = jQuery;

    $(document).ready(function() {
        board = document.getElementById('board');

        setupNextPuzzle();
    });
}