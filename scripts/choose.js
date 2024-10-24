const TY_CODE_MAIN = '3060001';             // 주재료와 부재료의 재료타입 코드는 각각 3060001과 3060002입니다.
const TY_CODE_SECONDARY = '3060002';

let xhrList = [];

/**
 * < 페이지 >
 */
let recipeIdsForMainIngredient;             // 주재료 먼저 선택하기
let recipeIdsForSecondaryIngredient;        // TODO: 부재료 먼저 선택하기

{
    const $ = jQuery;

    function getRecipeIdsForMainIngredient() {
        $.ajax({
            async: false,
            url: 'https://gist.githubusercontent.com/koreandroid/0bda18f1fa593e95d7b5a18cffe4e230/raw/4a0a4732f8d992434015b8bc1efdbec3eb5fd0c0/recipeIdsForMainIngredient.json',
            dataType: 'text',
            success: function(response) {
                recipeIdsForMainIngredient = JSON.parse(response);
                if (localStorage) {
                    localStorage.setItem('recipeIdsForMainIngredient', response);
                }
            },
            error: function(xhr, status, error) {
                console.log('Error:', error);
            }
        });
    }

    $(document).ready(function() {
        // 재료 입력란이 포커스 되었을 때
        $('#main_ingredient_input').on('focus', function() {
            $('#secondary_ingredient_input').val('');
        }).one('focus', function() {
            if (data = localStorage?.getItem('recipeIdsForMainIngredient')) {
                recipeIdsForMainIngredient = JSON.parse(data);
            } else {
                getRecipeIdsForMainIngredient();
            }
        });
        $('#secondary_ingredient_input').on('focus', function() {
            $('#main_ingredient_input').val('');
        });

        // 재료 입력란에서 엔터 키를 눌렀을 때
        $('main>section input[type="text"]').on('keypress', function(event) {
            if (event.key == 'Enter') {
                event.target.nextElementSibling.click();
            }
        });
    });
}

/**
 * < 주재료 선택 모달 >
 */
let recipeIds;

function setupMainIngredientPickModal() {
    const mainIngredientPickModal = document.getElementById('main_ingredient_pick_modal');

    function buildH1IngredientHtmlString(ingredientCount, irdntNm) {
        return `<input type="radio" id="ingredient_${ingredientCount}" class="btn-check" name="ingredient" autocomplete="off" />` +
        `<label class="btn btn-outline-primary" for="ingredient_${ingredientCount}">${irdntNm}</label>`;
    }

    // 페이지에서 다음 버튼을 클릭했을 때
    mainIngredientPickModal.addEventListener('show.bs.modal', () => {       // This event fires immediately when the show instance method is called.
        const modalBody = mainIngredientPickModal.querySelector('.modal-body');

        let ingredientCount = 0;
        if (input = document.getElementById('main_ingredient_input').value) {
            for (const irdntNm in recipeIdsForMainIngredient) {
                if (irdntNm.replace(/ /g, '').includes(input.replace(/ /g, ''))) {
                    modalBody.innerHTML += buildH1IngredientHtmlString(++ingredientCount, irdntNm);
                }
            }
        }

        if (ingredientCount) {
            [...modalBody.getElementsByClassName('btn-check')].forEach(
                emt => emt.addEventListener('change', event => {
                    const main = event.target.nextSibling.textContent;

                    recipeIds = recipeIdsForMainIngredient[main];

                    document.getElementById('main_pick_modal_next').setAttribute('data-bs-ingredient', main);
                    document.getElementById('main_pick_modal_next').disabled = false;
                })
            );
        } else {
            modalBody.appendChild(document.createElement('p')).textContent = '검색된 재료가 없습니다ㅠㅠ';
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

let getRecipeNm;

{
    const $ = jQuery;

    ajaxRecipeIdToSecondaryList = () => {
        const maxQuantityPerRequest = 1000;     // 데이터요청은 한번에 최대 1000건을 넘을 수 없습니다.
        for (const recipeId of recipeIds) {
            const xhr = $.ajax({
                url: 'https://cors-anywhere.herokuapp.com/' +
                'http://211.237.50.150:7080/openapi/acc145806a281b75ba781114b41220d54cbdbd82d97e155035977df143e75a4c/json/Grid_20150827000000000227_1/' +
                '1/' + maxQuantityPerRequest + '?RECIPE_ID=' + recipeId,
                dataType: 'json'
            }).done(function(response) {
                if (!(response.Grid_20150827000000000227_1?.totalCnt > 0)) return;

                const temp = [];
                response.Grid_20150827000000000227_1.row.filter(row => row.IRDNT_TY_CODE == TY_CODE_SECONDARY).
                    forEach(row => temp.push(row.IRDNT_NM));

                recipeIdToSecondaryList.set(recipeId, temp);
            }).fail(function(xhr, status, error) {
                console.log('Error:', error);
            });

            xhrList.push(xhr);
        }
    };

    getRecipeNm = function(recipeId) {
        let recipeNm = localStorage?.getItem(recipeId.toString());

        if (!recipeNm) {
            $.ajax({
                async: false,
                url: 'https://cors-anywhere.herokuapp.com/' +
                'http://211.237.50.150:7080/openapi/acc145806a281b75ba781114b41220d54cbdbd82d97e155035977df143e75a4c/json/Grid_20150827000000000226_1/' +
                '1/1?RECIPE_ID=' + recipeId,
                dataType: 'json',
                success: function(response) {
                    if (!(response.Grid_20150827000000000226_1?.totalCnt > 0)) return;

                    recipeNm = response.Grid_20150827000000000226_1.row[0].RECIPE_NM_KO;
                    if (localStorage) {
                        localStorage.setItem(recipeId.toString(), recipeNm);
                    }
                },
                error: function(xhr, status, error) {
                    console.log('Error:', error);

                    recipeNm = null;
                }
            });
        }

        return recipeNm;
    };
}

function setupRecipeDecideWithMainModal() {
    const recipeDecideWithMainModal = document.getElementById('recipe_decide_with_main_modal');
    const checkedSecondaries = new Set();

    function buildH2IngredientHtmlString(ingredientCount, irdntNm) {
        return `<input type="checkbox" id="secondary_${ingredientCount}" class="btn-check" autocomplete="off" />` +
        `<label class="btn btn-outline-dark" for="secondary_${ingredientCount}">${irdntNm}</label>`;
    }

    function showRecipeBlocks() {
        const wrapper = document.getElementById('recipe_blocks_wrap');

        while (wrapper.firstChild)
        {
            wrapper.removeChild(wrapper.firstChild);
        }

        for (const recipeId of recipeIds) {
            if ((secondaryList = recipeIdToSecondaryList.get(recipeId)) &&
                (secondaryList.length == 0 || secondaryList.some(irdntNm => checkedSecondaries.has(irdntNm)))) {
                const el = document.createElement('button');
                el.setAttribute('type', 'button');
                el.setAttribute('class', 'btn btn-dark');

                if (recipeNm = getRecipeNm(recipeId)) {
                    wrapper.appendChild(el).
                        textContent = recipeNm;
                }
            }
        }
    }

    // 주재료 선택 모달에서 다음 버튼을 클릭했을 때
    recipeDecideWithMainModal.addEventListener('show.bs.modal', event => {
        const modalHeader = recipeDecideWithMainModal.querySelector('.modal-header');

        modalHeader.querySelector('.btn').textContent = event.relatedTarget.getAttribute('data-bs-ingredient');

        ajaxRecipeIdToSecondaryList();
    });
    recipeDecideWithMainModal.addEventListener('shown.bs.modal', async () => {
        const modalBody = recipeDecideWithMainModal.querySelector('.modal-body');

        while (recipeIdToSecondaryList.size != recipeIds.length)
        {
            await new Promise(r => setTimeout(r, 30));     // recipeIdToSecondaryList에 대한 요청(ajaxRecipeIdToSecondaryList())이 완료되기를 기다리기
        }

        const secondaries = new Set();
        for (const [_, secondaryList] of recipeIdToSecondaryList) {
            secondaryList.forEach(secondary => secondaries.add(secondary));
        }

        const h2SecondaryList = Array.from(secondaries).sort();

        // 선택 가능한 부재료 목록 또는 '필요하지 않습니다!' 문자열 나타내기
        let str = ' ';
        for (const [index, irdntNm] of h2SecondaryList.entries()) {
            str += buildH2IngredientHtmlString(index + 1, irdntNm);
        }
        str += (h2SecondaryList.length > 0) ? '들 중에서 선택하실 수 있습니다.' : '필요하지 않습니다!';
        modalBody.querySelector('h2').lastChild.innerHTML = str;

        showRecipeBlocks();     // 부재료가 없어도 만들 수 있는 레시피들을 미리 보여주게 됩니다.

        [...modalBody.getElementsByClassName('btn-check')].forEach(
            emt => emt.addEventListener('change', event => {
                const irdntNm = event.target.nextSibling.textContent;

                if (event.target.checked) {
                    checkedSecondaries.add(irdntNm);
                } else {
                    checkedSecondaries.delete(irdntNm);
                }

                showRecipeBlocks();
            })
        );
    });
    recipeDecideWithMainModal.addEventListener('hide.bs.modal', () => {         // This event is fired immediately when the hide instance method has been called.
        xhrList.forEach(xhr => xhr.abort());
        xhrList = [];

        recipeIdToSecondaryList.clear();
        checkedSecondaries.clear();
    });
    recipeDecideWithMainModal.addEventListener('hidden.bs.modal', () => {
        const modalHeader = recipeDecideWithMainModal.querySelector('.modal-header');
        const modalBody = recipeDecideWithMainModal.querySelector('.modal-body');

        modalHeader.querySelector('.btn').textContent = '';
        modalBody.querySelector('h2').lastChild.textContent = '...';
        const wrapper = document.getElementById('recipe_blocks_wrap');
        while (wrapper.firstChild)
        {
            wrapper.removeChild(wrapper.firstChild);
        }
    });

    // 헤더 부분의 주재료 이름 버튼을 클릭했을 때
    recipeDecideWithMainModal.querySelector('.modal-header').
        querySelector('.btn').addEventListener('click', () => document.getElementById('main_ingredient_input').nextElementSibling.click());
}

{
    const $ = jQuery;

    $(document).ready(setupRecipeDecideWithMainModal);
}