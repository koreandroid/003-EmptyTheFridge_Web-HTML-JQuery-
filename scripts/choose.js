let recipeIdsForMainIngredient;             // 주재료 먼저 선택하기
let recipeIdsForSecondaryIngredient;        // 부재료 먼저 선택하기

/*
 * 페이지
 */
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

/*
 * 주재료 선택 모달
 */
function buildIngredientHtmlString(ingredientCount, irdntNm) {
    return `<input type="radio" id="ingredient_${ingredientCount}" class="btn-check" name="ingredient" autocomplete="off" />` +
    `<label class="btn btn-outline-primary" for="ingredient_${ingredientCount}">${irdntNm}</label>`;
}

function setupMainIngredientPickModal() {
    const mainIngredientPickModal = document.getElementById('main_ingredient_pick_modal');

    // 다음 버튼을 클릭했을 때
    mainIngredientPickModal.addEventListener('show.bs.modal', event => {        // This event fires immediately when the show instance method is called.
        const modalBody = mainIngredientPickModal.querySelector('.modal-body');

        let ingredientCount = 0;
        if ((input = document.getElementById('main_ingredient_input').value) && recipeIdsForMainIngredient) {
            for (const irdntNm in recipeIdsForMainIngredient) {
                if (irdntNm.replace(/ /g, '').includes(input.replace(/ /g, ''))) {
                    modalBody.innerHTML += buildIngredientHtmlString(++ingredientCount, irdntNm);
                }
            }
        }

        if (ingredientCount == 0) {
            modalBody.appendChild(document.createElement('p'))
                .textContent = '검색된 재료가 없습니다ㅠㅠ';
            mainIngredientPickModal.querySelector('#main_pick_modal_next').disabled = true;
        }
    });
    mainIngredientPickModal.addEventListener('hidden.bs.modal', event => {      // This event is fired when the modal has finished being hidden from the user (will wait for CSS transitions to complete).
        const modalBody = mainIngredientPickModal.querySelector('.modal-body');
        while (modalBody.firstChild)
        {
            modalBody.removeChild(modalBody.firstChild);
        }
        mainIngredientPickModal.querySelector('#main_pick_modal_next').disabled = false;
    });
}

{
    const $ = jQuery;

    $(document).ready(setupMainIngredientPickModal);
}