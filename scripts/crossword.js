let board;
let stageCount = 0;

let inputList = [];         // board 테이블의 입력란 리스트입니다.
let checkboxList = [];      // hints 섹션의 체크박스 리스트입니다.

/**
 * 게임 초기화 및 구성
 */

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

    // 십자말 칸 나타내기
    for (const grid of usingGrids) {
        const index = 20 * (grid[0] - 1) + grid[1] - 1;
        tdElements.item(index).setAttribute('class', `on bd-${(stageCount - 1) % 2}`);
        inputList[index].style.setProperty('pointer-events', 'auto');
    }
}

function clearBoard() {
    inputList = [];
    for (const tdEl of board.getElementsByTagName('td')) {
        while (tdEl.firstChild)
        {
            tdEl.removeChild(tdEl.firstChild);
        }
    }
}

let hintList;

function buildHintItemHtmlString(number, hint) {
    return `<button type="button" id="hint_item_${number}` +
    '" class="list-group-item list-group-item-action"><div class="hint_wrap"><div class="hint_checkbox_wrap"><input type="checkbox" class="form-check-input me-1" /></div><div>' +
    `<span class="form-check-label">${hint}</span></div></div></button>`;
}

function initHints(wordList) {
    for (const [idx, word] of wordList.entries()) {
        hintList.innerHTML += buildHintItemHtmlString(idx + 1, word.hint);
    }
}

function setupHints(wordList) {
    for (const [idx, buttonEl] of Array.from(hintList.getElementsByClassName('list-group-item')).entries()) {
        buttonEl.addEventListener('mouseenter', () => {
            wordList[idx].gridList.forEach(grid => {
                inputList[20 * (grid[0] - 1) + grid[1] - 1].style.setProperty('background-color', '#ffeed9');
            });
        });
        buttonEl.addEventListener('mouseleave', () => {
            wordList[idx].gridList.forEach(grid => {
                inputList[20 * (grid[0] - 1) + grid[1] - 1].style.setProperty('background-color', 'transparent');
            });
        });

        checkboxList.push(buttonEl.querySelector('input[type="checkbox"]'));
    }
}

function clearHints() {
    checkboxList = [];
    document.getElementById('hint_list').innerHTML = '';
}

/**
 * 게임 시작 및 작동
 */

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
    if (++stageCount > puzzleList.length) return false;

    const puzzle = puzzleList[stageCount - 1];

    const wordList = puzzle.wordList;

    // 십자말풀이 board 테이블 구성하기
    initBoard();

    setupBoard(wordList);

    // 십자말풀이 hints 섹션 구성하기
    hintList ??= document.getElementById('hint_list');
    initHints(wordList);

    setupHints(wordList);

    return true;
}

function activatePuzzle(wordList) {
    inputList.forEach(input => {
        input.addEventListener('input', event => {
            event.stopPropagation();
            if (verifyPuzzle(wordList)) {
                clearBoard();
                clearHints();

                if (setupNextPuzzle()) {
                    activatePuzzle(wordList);
                }
            }
        });
    });
}

function startGame() {
    setupNextPuzzle();
    activatePuzzle(puzzleList[stageCount - 1].wordList);
}

{
    const $ = jQuery;

    $(document).ready(function() {
        board = document.getElementById('board');

        if (puzzleList?.length > 0) {
            startGame();
        } else {}       // TODO: 홈 화면으로 되돌아갈 수 있도록 버튼 토글하기
    });
}