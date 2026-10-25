const API_URL     = 'https://www.themealdb.com/api/json/v1/1';
const STORAGE_KEY = 'mealIds';

// Elementos e estado compartilhados entre as funções
const GLOBAL = {};

$(document).ready(function() {

    GLOBAL.container     = $('<main>').addClass('mobile-container');
    GLOBAL.searchTerm    = $('<input type="search" placeholder="Pesquisar receitas..." aria-label="Pesquisar receitas">');
    GLOBAL.favContainer  = $('<ul>').addClass('fav-meals');
    GLOBAL.mealsEl       = $('<div>').addClass('meals').attr('aria-live', 'polite');
    GLOBAL.mealPopup     = $('<div>').addClass('popup-container hidden');
    GLOBAL.mealInfoEl    = $('<div>').addClass('meal-info');
    GLOBAL.popupCloseBtn = $('<button type="button" title="Fechar" aria-label="Fechar"><i class="fas fa-times"></i></button>').addClass('close-popup').on('click', closePopup);
    GLOBAL.toast         = $('<div>').addClass('toast').attr('role', 'status');

    $('body').empty().append(
        $(GLOBAL.container).append(
            // Um <form> faz o Enter e o botão de busca funcionarem do mesmo jeito
            $('<form>').attr('role', 'search').append(
                $('<button type="button" title="Nova receita aleatória" aria-label="Nova receita aleatória"><i class="fas fa-redo-alt"></i></button>').on('click', () => {
                    $(GLOBAL.searchTerm).val('');
                    getRandomMeal();
                }),
                $(GLOBAL.searchTerm),
                $('<button type="submit" title="Pesquisar" aria-label="Pesquisar"><i class="fas fa-search"></i></button>')
            ).on('submit', (event) => {
                event.preventDefault();
                searchMeals($(GLOBAL.searchTerm).val());
            }),// form
            $('<section>').addClass('fav-container').append(
                $('<h2>').text('Receitas favoritas'),
                $('<div>').addClass('fav-cont-list').append(
                    $(GLOBAL.favContainer)
                )
            ),// fav-container
            $(GLOBAL.mealsEl)
        ),// mobile-container
        $(GLOBAL.mealPopup).append(
            $('<div>').addClass('popup').attr({ role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'meal-info-title' }).append(
                $(GLOBAL.popupCloseBtn),
                $(GLOBAL.mealInfoEl)
            )// popup
        ),// mealPopup
        $(GLOBAL.toast)
    );

    // Fecha o popup clicando fora dele ou apertando Esc
    $(GLOBAL.mealPopup).on('click', (event) => {
        if (event.target === event.currentTarget) closePopup();
    });

    $(document).on('keydown', (event) => {
        if (event.key === 'Escape') closePopup();
    });

    //******************//

    // Um link compartilhado (?term=...) abre aquela receita; senão, carrega uma aleatória
    const term = new URLSearchParams(window.location.search).get('term');

    if (term) {
        $(GLOBAL.searchTerm).val(term);
        searchMeals(term);
    } else {
        getRandomMeal();
    }

    // Carrega os favoritos salvos
    fetchFavMeals();

});

//******************//
// API
//******************//

async function fetchMeals(path) {

    const resp = await fetch(API_URL + path);

    if (!resp.ok) throw new Error(`Falha na requisição: ${resp.status}`);

    const respData = await resp.json();

    // A API devolve { meals: null } quando não encontra nada
    return respData.meals || [];

}

async function getMealById(id) {

    const meals = await fetchMeals('/lookup.php?i=' + encodeURIComponent(id));

    return meals[0] || null;

}

// Cada busca recebe um número; respostas de buscas antigas são ignoradas
function newMealsRequest() {

    GLOBAL.mealsRequestId = (GLOBAL.mealsRequestId || 0) + 1;

    return GLOBAL.mealsRequestId;

}

async function getRandomMeal() {

    const requestId = newMealsRequest();

    showMessage('Carregando...');

    try {

        const meals = await fetchMeals('/random.php');

        if (requestId !== GLOBAL.mealsRequestId) return;

        $(GLOBAL.mealsEl).empty();

        if (meals.length) addMeal(meals[0], true);

    } catch (error) {

        console.error(error);
        if (requestId === GLOBAL.mealsRequestId) showMessage('Não foi possível carregar uma receita. Tente novamente.');

    }

}

async function searchMeals(term) {

    term = (term || '').trim();

    // Busca vazia: mostra uma receita aleatória
    if (!term) return getRandomMeal();

    const requestId = newMealsRequest();

    showMessage('Pesquisando...');

    try {

        const meals = await fetchMeals('/search.php?s=' + encodeURIComponent(term));

        if (requestId !== GLOBAL.mealsRequestId) return;

        if (!meals.length) {
            // .text() mostra o termo como texto, mesmo que tenha HTML
            showMessage(`Nenhuma receita encontrada para "${term}".`);
            return;
        }

        $(GLOBAL.mealsEl).empty();

        meals.forEach((meal) => addMeal(meal));

    } catch (error) {

        console.error(error);
        if (requestId === GLOBAL.mealsRequestId) showMessage('A pesquisa falhou. Tente novamente.');

    }

}

//******************//
// Lista de receitas
//******************//

// Mostra uma mensagem na área das receitas (carregando, erros, sem resultados)
function showMessage(text) {

    $(GLOBAL.mealsEl).empty().append(
        $('<p>').addClass('meals-message').text(text)
    );

}

function addMeal(mealData, random = false) {

    const mealHeader = $('<div>').addClass('meal-header');

    if (random) mealHeader.append($('<span>').addClass('random').text('Receita aleatória'));

    mealHeader.append(
        $('<img>').attr({ src: mealData.strMealThumb, alt: '', loading: 'lazy' })
    );

    //******************//

    // O título é um botão para quem navega pelo teclado; o card inteiro também é clicável
    const mealContent = $('<article>').addClass('meal').append(
        mealHeader,
        $('<div>').addClass('meal-body').append(
            $('<h3>').append(
                $('<button type="button">').addClass('meal-title').text(mealData.strMeal)
            ),
            $('<div>').addClass('action-buttons').append(
                createShareButton(mealData),
                createFavButton(mealData)
            )
        )
    ).on('click', () => showMealInfo(mealData));

    //******************//

    $(GLOBAL.mealsEl).append(mealContent);

}

//******************//
// Botões
//******************//

function createShareButton(mealData) {

    return $('<button type="button" title="Copiar link" aria-label="Copiar link da receita"><i class="fas fa-share-alt"></i></button>')
        .addClass('meal-share-btn')
        .on('click', (event) => {
            event.stopPropagation(); // Não abre o popup
            shareMeal(mealData);
        });

}

function createFavButton(mealData) {

    const button = $('<button type="button"><i class="fas fa-heart"></i></button>')
        .addClass('meal-fav-btn')
        .attr('data-id', mealData.idMeal)
        .on('click', (event) => {

            event.stopPropagation(); // Não abre o popup

            if (isFavorite(mealData.idMeal)) {
                if (removeMealLS(mealData.idMeal)) showToast('Removida dos favoritos.');
            } else {
                if (addMealLS(mealData.idMeal)) showToast('Adicionada aos favoritos!');
            }

            fetchFavMeals();

        });

    setFavButtonState(button, mealData.idMeal);

    return button;

}

// Atualiza cor, título e aria-pressed de um botão de favorito
function setFavButtonState(button, mealId) {

    const active = isFavorite(mealId);
    const label  = active ? 'Remover dos favoritos' : 'Adicionar aos favoritos';

    $(button).toggleClass('active', active).attr({ title: label, 'aria-label': label, 'aria-pressed': active });

}

// Mantém sincronizados todos os botões de favorito dessa receita (card e popup)
function updateFavButtons(mealId) {

    $('.meal-fav-btn')
        .filter((index, button) => $(button).attr('data-id') === mealId)
        .each((index, button) => setFavButtonState(button, mealId));

}

async function shareMeal(mealData) {

    const shareURL = window.location.origin + window.location.pathname + '?term=' + encodeURIComponent(mealData.strMeal.toLowerCase());

    try {

        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(shareURL);
        } else {
            // Alternativa para navegadores antigos / sem HTTPS
            const copyShareURL = $('<input>').val(shareURL).appendTo('body').select();
            document.execCommand('copy');
            copyShareURL.remove();
        }

        showToast('Link copiado!');

    } catch (error) {

        console.error(error);
        showToast('Não foi possível copiar o link.');

    }

}

function showToast(text) {

    clearTimeout(GLOBAL.toastTimer);

    $(GLOBAL.toast).text(text).addClass('visible');

    GLOBAL.toastTimer = setTimeout(() => $(GLOBAL.toast).removeClass('visible'), 2500);

}

//******************//
// Local Storage
//******************//

// Lê os ids favoritos salvos no navegador
function getMealsLS() {

    try {
        const mealIds = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(mealIds) ? mealIds : [];
    } catch (error) {
        return [];
    }

}

// Salva a lista de ids; devolve false se o navegador bloquear o localStorage
function saveMealsLS(mealIds) {

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mealIds));
        return true;
    } catch (error) {
        console.error(error);
        showToast('Não foi possível salvar os favoritos neste navegador.');
        return false;
    }

}

function isFavorite(mealId) {

    return getMealsLS().includes(mealId);

}

function addMealLS(mealId) {

    const mealIds = getMealsLS();
    const saved   = mealIds.includes(mealId) || saveMealsLS([...mealIds, mealId]);

    updateFavButtons(mealId);

    return saved;

}

function removeMealLS(mealId) {

    const saved = saveMealsLS(getMealsLS().filter((id) => id !== mealId));

    updateFavButtons(mealId);

    return saved;

}

//******************//
// Favoritos
//******************//

async function fetchFavMeals() {

    // Ignora o resultado de chamadas antigas que terminem depois de uma mais nova
    const requestId = (GLOBAL.favRequestId = (GLOBAL.favRequestId || 0) + 1);

    const mealIds = getMealsLS();

    // Carrega todos os favoritos em paralelo; pula os que falharem
    const meals = await Promise.all(
        mealIds.map((id) => getMealById(id).catch(() => null))
    );

    if (requestId !== GLOBAL.favRequestId) return;

    //******************//

    $(GLOBAL.favContainer).empty();

    const validMeals = meals.filter(Boolean);

    if (!validMeals.length) {
        $(GLOBAL.favContainer).append($('<li>').addClass('fav-empty').text('Nenhum favorito ainda. Toque no ♥ de uma receita para salvar.'));
        return;
    }

    validMeals.forEach(addMealFav);

}

function addMealFav(mealData) {

    // Botão: remove a receita dos favoritos
    const favClearBtn = $('<button type="button"><i class="fas fa-times"></i></button>')
        .addClass('clear')
        .attr({ title: 'Remover dos favoritos', 'aria-label': 'Remover ' + mealData.strMeal + ' dos favoritos' })
        .on('click', () => {
            if (removeMealLS(mealData.idMeal)) showToast('Removida dos favoritos.');
            fetchFavMeals();
        });

    //******************//

    // Botão: abre os detalhes da receita
    const favMealContent = $('<button type="button">').addClass('fav-meal-body').attr('title', mealData.strMeal).append(
        $('<img>').attr({ src: mealData.strMealThumb, alt: '', loading: 'lazy' }),
        $('<span>').text(mealData.strMeal)
    ).on('click', () => showMealInfo(mealData));

    //******************//

    $(GLOBAL.favContainer).append(
        $('<li>').append(favMealContent, favClearBtn)
    );

}

//******************//
// Popup
//******************//

function showMealInfo(mealData) {

    const ingredients = [];

    // Junta os ingredientes e as medidas (a API tem até 20 de cada)
    for (let i = 1; i <= 20; i++) {

        const ingredient = (mealData['strIngredient' + i] || '').trim();
        const measure    = (mealData['strMeasure' + i] || '').trim();

        if (!ingredient) break;

        ingredients.push(measure ? `${ingredient} - ${measure}` : ingredient);

    }

    //******************//

    // Monta o conteúdo (sempre com .text() para os dados da API)
    $(GLOBAL.mealInfoEl).empty().append(
        $('<h2>').attr('id', 'meal-info-title').text(mealData.strMeal),
        $('<div>').addClass('action-buttons').append(
            createShareButton(mealData),
            createFavButton(mealData)
        ),
        $('<img>').attr({ src: mealData.strMealThumb, alt: mealData.strMeal }),
        $('<h3>').text('Ingredientes'),
        $('<ul>').append(ingredients.map((ing) => $('<li>').text(ing))),
        $('<h3>').text('Modo de preparo'),
        $('<p>').addClass('instructions').text(mealData.strInstructions || '')
    );

    //******************//

    // Guarda quem estava com o foco para devolvê-lo ao fechar
    GLOBAL.lastFocus = document.activeElement;

    $('body').addClass('no-scroll');
    $(GLOBAL.mealPopup).removeClass('hidden').find('.popup').scrollTop(0);
    $(GLOBAL.popupCloseBtn).trigger('focus');

}

function closePopup() {

    if ($(GLOBAL.mealPopup).hasClass('hidden')) return;

    $('body').removeClass('no-scroll');
    $(GLOBAL.mealPopup).addClass('hidden');

    if (GLOBAL.lastFocus && document.body.contains(GLOBAL.lastFocus)) GLOBAL.lastFocus.focus();

}
