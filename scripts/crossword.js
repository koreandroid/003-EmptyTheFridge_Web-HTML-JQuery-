let board;
let stageCount = 0;

const inputList = [];

function setupBoard(wordList) {
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

    [...hintList.getElementsByTagName('button')].forEach(el => {
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
    const wordList = puzzle.wordList;

    setupBoard(wordList);

    initHints(wordList);
    setupHints(wordList);

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