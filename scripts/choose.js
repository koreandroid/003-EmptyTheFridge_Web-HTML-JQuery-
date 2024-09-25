const TY_CODE_MAIN = '3060001';             // 주재료와 부재료의 재료타입 코드는 각각 3060001과 3060002입니다.
const TY_CODE_SECONDARY = '3060002';

/**
 * < 페이지 >
 */
let recipeIdsForMainIngredient;             // 주재료 먼저 선택하기
let recipeIdsForSecondaryIngredient;        // 부재료 먼저 선택하기

{
    const $ = jQuery;

    function ajaxRecipeIdsForMainIngredient() {
        $.ajax({
            url: 'https://gist.githubusercontent.com/koreandroid/0bda18f1fa593e95d7b5a18cffe4e230/raw/4a0a4732f8d992434015b8bc1efdbec3eb5fd0c0/recipeIdsForMainIngredient.json',
            dataType: 'json'
        }).done(function(response) {
            recipeIdsForMainIngredient = response;
        }).fail(function(xhr, status, error) {
            console.log('Error:', error);
        });
    }

    function ajaxRecipeIdsForSecondaryIngredient() {}       // TODO: 부재료별로 레시피 코드들을 목록화한 데이터를 가져오는 함수 구현하기

    $(document).ready(function() {
        // 재료 입력란이 포커스 되었을 때
        $('#main_ingredient_input').on('focus', function() {
            $('#secondary_ingredient_input').val('');
        }).one('focus', ajaxRecipeIdsForMainIngredient);
        $('#secondary_ingredient_input').on('focus', function() {
            $('#main_ingredient_input').val('');
        });
    });
}

/**
 * < 주재료 선택 모달 >
 */
let recipeIds;

function buildH1IngredientHtmlString(ingredientCount, irdntNm) {
    return `<input type="radio" id="ingredient_${ingredientCount}" class="btn-check" name="ingredient" autocomplete="off" />` +
    `<label class="btn btn-outline-primary" for="ingredient_${ingredientCount}">${irdntNm}</label>`;
}

function setupMainIngredientPickModal() {
    const mainIngredientPickModal = document.getElementById('main_ingredient_pick_modal');

    // 다음 버튼을 클릭했을 때
    mainIngredientPickModal.addEventListener('show.bs.modal', () => {       // This event fires immediately when the show instance method is called.
        const modalBody = mainIngredientPickModal.querySelector('.modal-body');

        let ingredientCount = 0;
        if ((input = document.getElementById('main_ingredient_input').value) && recipeIdsForMainIngredient) {
            for (const irdntNm in recipeIdsForMainIngredient) {
                if (irdntNm.replace(/ /g, '').includes(input.replace(/ /g, ''))) {
                    modalBody.innerHTML += buildH1IngredientHtmlString(++ingredientCount, irdntNm);
                }
            }
        }

        if (ingredientCount) {
            [...modalBody.getElementsByClassName('btn-check')].forEach(
                element => element.addEventListener('change', event => {
                    const ingredient = event.target.nextSibling.textContent;

                    recipeIds = recipeIdsForMainIngredient[ingredient];

                    document.getElementById('main_pick_modal_next').setAttribute('data-bs-ingredient', ingredient);
                    document.getElementById('main_pick_modal_next').disabled = false;
                })
            );
        } else {
            modalBody.appendChild(document.createElement('p'))
                .textContent = '검색된 재료가 없습니다ㅠㅠ';
        }
    });
    mainIngredientPickModal.addEventListener('hidden.bs.modal', () => {     // This event is fired when the modal has finished being hidden from the user (will wait for CSS transitions to complete).
        const modalBody = mainIngredientPickModal.querySelector('.modal-body');
        while (modalBody.firstChild)
        {
            modalBody.removeChild(modalBody.firstChild);
        }

        document.getElementById('main_pick_modal_next').disabled = true;
    });
}

{
    const $ = jQuery;

    $(document).ready(setupMainIngredientPickModal);
}

/**
 * < 레시피 결정 모달 >
 */
const recipeIdToSecondaryList = new Map();
let ajaxRecipeIdToSecondaryList;

{
    const $ = jQuery;
    const maxQuantityPerRequest = 1000;     // 데이터요청은 한번에 최대 1000건을 넘을 수 없습니다.

    ajaxRecipeIdToSecondaryList = function() {
        for (const recipeId of recipeIds) {
            $.ajax({
                url: 'https://cors-anywhere.herokuapp.com/' +
                'http://211.237.50.150:7080/openapi/acc145806a281b75ba781114b41220d54cbdbd82d97e155035977df143e75a4c/json/Grid_20150827000000000227_1/' +
                '1/' + maxQuantityPerRequest + '?RECIPE_ID=' + recipeId,
                dataType: 'json'
            }).done(function(response) {
                if (!(response.Grid_20150827000000000227_1?.totalCnt > 0)) return;

                const temp = [];
                response.Grid_20150827000000000227_1.row.filter(row => row.IRDNT_TY_CODE == TY_CODE_SECONDARY)
                    .forEach(row => temp.push(row.IRDNT_NM));

                recipeIdToSecondaryList.set(recipeId, temp);
            }).fail(function(xhr, status, error) {
                console.log('Error:', error);
            });
        }
    }
}

function buildH2IngredientHtmlString(ingredientCount, irdntNm) {
    return `<input type="checkbox" id="secondary_${ingredientCount}" class="btn-check" autocomplete="off" />` +
    `<label class="btn btn-outline-dark" for="secondary_${ingredientCount}">${irdntNm}</label>`;
}

async function setupRecipeDecideWithMainModal() {
    const recipeDecideWithMainModal = document.getElementById('recipe_decide_with_main_modal');

    // 주재료 선택 모달(#main_ingredient_pick_modal)에서 다음 버튼을 클릭했을 때
    recipeDecideWithMainModal.addEventListener('show.bs.modal', event => {
        ajaxRecipeIdToSecondaryList();

        recipeDecideWithMainModal.querySelector('#decide_with_main_modal_label>label').textContent = event.relatedTarget.getAttribute('data-bs-ingredient');
    });
    recipeDecideWithMainModal.addEventListener('shown.bs.modal', async () => {
        const modalBody = recipeDecideWithMainModal.querySelector('.modal-body');

        while (recipeIdToSecondaryList.size != recipeIds.length)
        {
            await new Promise(r => setTimeout(r, 300));     // recipeIdToSecondaryList에 대한 요청(ajaxRecipeIdToSecondaryList())이 완료되기를 기다리기
        }

        const secondaries = new Set();
        for (const [_, secondaryList] of recipeIdToSecondaryList) {
            secondaryList.forEach(secondary => secondaries.add(secondary));
        }

        const h2SecondaryList = [...secondaries].sort();

        let temp = ' ';
        h2SecondaryList.forEach((irdntNm, idx) => temp += buildH2IngredientHtmlString(idx + 1, irdntNm));
        temp += (h2SecondaryList.length) ? '들 중에서 선택하실 수 있습니다.' : '필요하지 않습니다!';

        modalBody.querySelector('h2').lastChild.innerHTML = temp;
    });
    recipeDecideWithMainModal.addEventListener('hidden.bs.modal', () => {
        recipeDecideWithMainModal.querySelector('#decide_with_main_modal_label>label').textContent = '';
    });
}

{
    const $ = jQuery;

    $(document).ready(setupRecipeDecideWithMainModal);
}