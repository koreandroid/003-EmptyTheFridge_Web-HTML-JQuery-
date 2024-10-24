let board;
let stageCount = 0;

const inputList = [];

function setBoard(wordList) {
    const tdElements = board.getElementsByTagName('td');
    for (tdEl of tdElements) {
        const textEl = document.createElement('input');
        textEl.setAttribute('type', 'text');
        textEl.setAttribute('maxlength', '1');
        inputList.push(tdEl.appendChild(textEl));
    }

    const usingGrids = new Set();
    for (const word of wordList) {
        word.gridList.forEach(grid => usingGrids.add(grid));
    }

    // 칸 활성화하기
    for (const grid of usingGrids) {
        const index = 20 * (grid[0] - 1) + grid[1] - 1;
        tdElements.item(index).setAttribute('class', `on bd-${stageCount % 2}`);

        inputList[index].style.setProperty('pointer-events', 'auto');
    }
}

function getPuzzleList() {
    let result = null;
    jQuery.ajax({
        async: false,
        url: 'https://gist.githubusercontent.com/koreandroid/5766402dc38b48c27d135cf3959b369d/raw/9218f90376035bd5b46df36507ae9dc40f3270a3/crosswordPuzzleList.json',
        dataType: 'json',
        success: function(response) {
            result = response.puzzleList;
        },
        error: function(xhr, status, error) {
            console.log('Error:', error);
        }
    });

    return result;
}

const puzzleList = getPuzzleList();

function setupNextPuzzle() {
    if (puzzleList.length == stageCount) return false;

    const puzzle = puzzleList[stageCount];

    setBoard(puzzle.wordList);

    stageCount++;
}

{
    const $ = jQuery;

    $(document).ready(function() {
        board = document.getElementById('board');

        if (puzzleList?.length) {
            setupNextPuzzle();
        }
    });
}