let board;
let stageCount = 0;

let inputList = [];
let checkboxList = [];

function verifyPuzzle(wordList) {
    let result = true;

    for (const [idx, word] of wordList.entries()) {
        let text = '';
        for (const grid of word.gridList) {
            text += inputList[20 * (grid[0] - 1) + grid[1] - 1].value[0] ?? '';
        }

        checkboxList[idx].checked = text == word.word;
        result &&= checkboxList[idx].checked;
    }

    return result;
}

let clearBoard;
let clearHints;

function runPuzzle(wordList) {
    if (verifyPuzzle(wordList)) {
        clearBoard();
        clearHints();

        setupNextPuzzle();
    }
}

function initBoard() {
    for (const tdEl of board.getElementsByTagName('td')) {
        const textEl = document.createElement('input');
        textEl.setAttribute('type', 'text');
        textEl.setAttribute('maxlength', '1');
        inputList.push(tdEl.appendChild(textEl));
    }
}

function setupBoard(wordList) {
    const tdElements = board.getElementsByTagName('td');

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

    inputList.forEach(input => {
        input.addEventListener('input', () => {
            runPuzzle(wordList);
        });
    });
}

clearBoard = () => {
    inputList = [];
    for (const tdEl of board.getElementsByTagName('td')) {
        while (tdEl.firstChild)
        {
            tdEl.removeChild(tdEl.firstChild);
        }
    }
};

function buildHintItemHtmlString(number, hint) {
    return `<button type="button" id="hint_item_${number}` +
    '" class="list-group-item list-group-item-action"><div class="hint_wrap"><div class="hint_checkbox_wrap"><input type="checkbox" class="form-check-input me-1" /></div><div>' +
    `<span class="form-check-label">${hint}</span></div></div></button>`;
}

function initHints(wordList) {
    const hintList = document.getElementById('hint_list');

    for (const [idx, word] of wordList.entries()) {
        hintList.innerHTML += buildHintItemHtmlString(idx + 1, word.hint);
    }
}

function setupHints(wordList) {
    const hintList = document.getElementById('hint_list');

    const buttonElements = hintList.getElementsByTagName('button');
    [...buttonElements].forEach(el => {
        const index = Number(el.id.replace('hint_item_', '')) - 1;

        el.addEventListener('mouseenter', () => {
            wordList[index].gridList.forEach(grid => {
                inputList[20 * (grid[0] - 1) + grid[1] - 1].style.setProperty('background-color', '#ffeed9');
            });
        });
        el.addEventListener('mouseleave', () => {
            wordList[index].gridList.forEach(grid => {
                inputList[20 * (grid[0] - 1) + grid[1] - 1].style.setProperty('background-color', 'transparent');
            });
        });
    });

    for (const buttonEl of buttonElements) {
        checkboxList.push(buttonEl.querySelector('.form-check-input'));
    }
}

clearHints = () => {
    checkboxList = [];
    document.getElementById('hint_list').innerHTML = '';
};

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
    const wordList = puzzle.wordList;

    initBoard();
    setupBoard(wordList);

    initHints(wordList);
    setupHints(wordList);

    stageCount++;

    return true;
}

{
    const $ = jQuery;

    $(document).ready(function() {
        board = document.getElementById('board');

        if (puzzleList?.length > 0) {
            setupNextPuzzle();
        } else {}       // TODO: 홈 화면으로 되돌아갈 수 있도록 버튼 토글하기
    });
}