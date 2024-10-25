let icon;
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
        textEl.setAttribute('tabindex', '-1');
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
        inputList[index].removeAttribute('tabindex');
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

        tdEl.removeAttribute('class');
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
let puzzleList;

let isPuzzleCompleted;

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

    isPuzzleCompleted[stageCount - 1] ||= result;

    return result;
}

function setupNextPuzzle() {
    icon.src = '../images/ic_fridge_empty.png';
    icon.setAttribute('alt', 'This is an empty fridge icon.');
    icon.style.removeProperty('animation');

    stageCount++;

    const puzzle = puzzleList[stageCount - 1];

    const wordList = puzzle.wordList;

    // 십자말풀이 board 테이블 구성하기
    initBoard();

    setupBoard(wordList);

    // 십자말풀이 hints 섹션 구성하기
    hintList ??= document.getElementById('hint_list');
    initHints(wordList);

    setupHints(wordList);

    return puzzle;
}

function activatePuzzle(wordList) {
    inputList.forEach(input => {
        input.addEventListener('input', event => {
            event.stopPropagation();

            if (!isPuzzleCompleted[stageCount - 1] && verifyPuzzle(wordList)) {
                icon.src = '../images/ic_fridge_full.png';
                icon.setAttribute('alt', 'This is a full fridge icon.');
                icon.style.setProperty('animation', 'shake 0.5s');

                if (stageCount == puzzleList.length) {
                    new bootstrap.Modal('#completion_modal').show();
                } else {
                    clearBoard();
                    clearHints();

                    activatePuzzle(setupNextPuzzle().wordList);
                }
            }
        });
    });
}

function getPuzzleList() {
    let result = null;
    jQuery.ajax({
        async: false,
        url: 'https://gist.githubusercontent.com/koreandroid/5766402dc38b48c27d135cf3959b369d/raw/cfa01748c917b66bcdd8db576e05844696a9feb7/crosswordPuzzleList.json',
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

function startGame() {
    isPuzzleCompleted = new Array(puzzleList.length).fill(false);

    setupNextPuzzle();
    activatePuzzle(puzzleList[stageCount - 1].wordList);
}

{
    const $ = jQuery;

    $(document).ready(function() {
        if ((puzzleList = getPuzzleList())?.length > 0) {
            icon = document.getElementById('ic_fridge');
            board = document.getElementById('board');

            startGame();
        } else {}       // TODO: 홈 화면으로 되돌아갈 수 있도록 버튼 토글하기
    });
}