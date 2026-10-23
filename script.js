const API_URL     = 'https://www.themealdb.com/api/json/v1/1';
const STORAGE_KEY = 'mealIds';

const GLOBAL = {};

$(document).ready(function() {

    GLOBAL.gTranslate       = $('<div>').attr('id', 'gtranslate').append(`
                                <!-- GTranslate: https://gtranslate.io/ -->
                                <a href="#" onclick="doGTranslate('pt|en');return false;" title="English" class="gflag nturl" style="background-position:-0px -0px;">
                                    <img src="//gtranslate.net/flags/blank.png" height="16" width="16" alt="English" />
                                </a>
                                <a href="#" onclick="doGTranslate('pt|fr');return false;" title="French" class="gflag nturl" style="background-position:-200px -100px;">
                                    <img src="//gtranslate.net/flags/blank.png" height="16" width="16" alt="French" />
                                </a>
                                <a href="#" onclick="doGTranslate('pt|de');return false;" title="German" class="gflag nturl" style="background-position:-300px -100px;">
                                    <img src="//gtranslate.net/flags/blank.png" height="16" width="16" alt="German" />
                                </a>
                                <a href="#" onclick="doGTranslate('pt|it');return false;" title="Italian" class="gflag nturl" style="background-position:-600px -100px;">
                                    <img src="//gtranslate.net/flags/blank.png" height="16" width="16" alt="Italian" />
                                </a>
                                <a href="#" onclick="doGTranslate('pt|pt');return false;" title="Portuguese" class="gflag nturl" style="background-position:-300px -200px;">
                                    <img src="//gtranslate.net/flags/blank.png" height="16" width="16" alt="Portuguese" />
                                </a>
                                <a href="#" onclick="doGTranslate('pt|es');return false;" title="Spanish" class="gflag nturl" style="background-position:-600px -200px;">
                                    <img src="//gtranslate.net/flags/blank.png" height="16" width="16" alt="Spanish" />
                                </a>
                                <div id="google_translate_element2"></div>
                            `);

    GLOBAL.container        = $('<div>').addClass('mobile-container');
    GLOBAL.searchTerm       = $('<input type="search" placeholder="Search..." aria-label="Search meals">').on('keydown', (event) => {
                                  if (event.key === 'Enter') searchMeals($(GLOBAL.searchTerm).val());
                              });
    GLOBAL.searchBtn        = $('<button title="Search" aria-label="Search"><i class="fas fa-search"></i></button>').on('click', () => {
                                  searchMeals($(GLOBAL.searchTerm).val());
                              });
    GLOBAL.favContainer     = $('<ul>').addClass('fav-meals');
    GLOBAL.mealsEl          = $('<div>').addClass('meals');
    GLOBAL.mealPopup        = $('<div>').addClass('popup-container hidden');
    GLOBAL.mealInfoEl       = $('<div>').addClass('meal-info');
    GLOBAL.popupCloseBtn    = $('<button title="Close" aria-label="Close"><i class="fas fa-times"></i></button>').addClass('close-popup').on('click', closePopup);
    GLOBAL.toast            = $('<div>').addClass('toast').attr('role', 'status');

    $('body').empty().append(
        $(GLOBAL.gTranslate),
        $(GLOBAL.container).append(
            $('<header>').append(
                $('<button title="Load new random meal" aria-label="Load new random meal"><i class="fas fa-redo-alt"></i></button>').on('click', () => {
                    $(GLOBAL.searchTerm).val('');
                    getRandomMeal();
                }),
                $(GLOBAL.searchTerm),
                $(GLOBAL.searchBtn)
            ),// header
            $('<div>').addClass('fav-container').append(
                $('<h3>').text('Favorite Meals'),
                $('<div>').addClass('fav-cont-list').append(
                    $(GLOBAL.favContainer)
                )
            ),// fav-container
            $(GLOBAL.mealsEl)
        ),// mobile-container
        $(GLOBAL.mealPopup).append(
            $('<div>').addClass('popup').append(
                $(GLOBAL.popupCloseBtn),
                $(GLOBAL.mealInfoEl)
            )// popup
        ),// mealPopup
        $(GLOBAL.toast)
    );

    // Close the popup by clicking outside it or pressing Esc
    $(GLOBAL.mealPopup).on('click', (event) => {
        if (event.target === event.currentTarget) closePopup();
    });

    $(document).on('keydown', (event) => {
        if (event.key === 'Escape') closePopup();
    });

    //******************//

    // A shared link (?term=...) opens that meal, otherwise load a random one
    const term = new URLSearchParams(window.location.search).get('term');

    if (term) {
        $(GLOBAL.searchTerm).val(term);
        searchMeals(term);
    } else {
        getRandomMeal();
    }

    // Fetch favourite meals
    fetchFavMeals();

});

//******************//
// API
//******************//

async function fetchMeals(path) {

    const resp = await fetch(API_URL + path);

    if (!resp.ok) throw new Error(`Request failed: ${resp.status}`);

    const respData = await resp.json();

    // The API returns { meals: null } when nothing is found
    return respData.meals || [];

}

async function getMealById(id) {

    const meals = await fetchMeals('/lookup.php?i=' + encodeURIComponent(id));

    return meals[0] || null;

}

async function getRandomMeal() {

    showMessage('Loading...');

    try {

        const meals = await fetchMeals('/random.php');

        $(GLOBAL.mealsEl).empty();

        if (meals.length) addMeal(meals[0], true);

    } catch (error) {

        console.error(error);
        showMessage('Could not load a meal. Please try again.');

    }

}

async function searchMeals(term) {

    term = (term || '').trim();

    // Empty search: show a random meal
    if (!term) return getRandomMeal();

    showMessage('Searching...');

    try {

        const meals = await fetchMeals('/search.php?s=' + encodeURIComponent(term));

        $(GLOBAL.mealsEl).empty();

        if (!meals.length) {
            showMessage(`No meals found for "${term}".`);
            return;
        }

        meals.forEach((meal) => addMeal(meal));

    } catch (error) {

        console.error(error);
        showMessage('Search failed. Please try again.');

    }

}

//******************//
// Meals list
//******************//

// Show a text message in the meals area (loading, errors, empty results)
function showMessage(text) {

    $(GLOBAL.mealsEl).empty().append(
        $('<p>').addClass('meals-message').text(text)
    );

}

function addMeal(mealData, random = false) {

    const mealHeader = $('<div>').addClass('meal-header');

    if (random) mealHeader.append($('<span>').addClass('random').text('Random Recipe'));

    mealHeader.append(
        $('<img>').attr({ src: mealData.strMealThumb, alt: mealData.strMeal, loading: 'lazy' })
    );

    //******************//

    // Creating meal content structure
    const mealContent = $('<div>').addClass('meal').append(
        mealHeader,
        $('<div>').addClass('meal-body').append(
            $('<h4>').text(mealData.strMeal),
            $('<div>').addClass('action-buttons').append(
                createShareButton(mealData),
                createFavButton(mealData)
            )
        )
    );

    //******************//

    // Show meal details
    mealContent.on('click', () => showMealInfo(mealData));

    //******************//

    $(GLOBAL.mealsEl).append(mealContent);

}

//******************//
// Buttons
//******************//

function createShareButton(mealData) {

    return $('<button title="Share" aria-label="Share"><i class="fas fa-share-alt"></i></button>')
        .addClass('meal-share-btn')
        .on('click', (event) => {
            event.stopPropagation(); // Don't open the popup
            shareMeal(mealData);
        });

}

function createFavButton(mealData) {

    return $('<button title="Add to favorites" aria-label="Add to favorites"><i class="fas fa-heart"></i></button>')
        .addClass('meal-fav-btn')
        .attr('data-id', mealData.idMeal)
        .toggleClass('active', isFavorite(mealData.idMeal))
        .on('click', (event) => {

            event.stopPropagation(); // Don't open the popup

            if (isFavorite(mealData.idMeal)) {
                removeMealLS(mealData.idMeal);
            } else {
                addMealLS(mealData.idMeal);
            }

            fetchFavMeals();

        });

}

// Keep every like button of this meal (card and popup) in sync
function updateFavButtons(mealId) {

    $(`.meal-fav-btn[data-id="${mealId}"]`).toggleClass('active', isFavorite(mealId));

}

async function shareMeal(mealData) {

    const shareURL = window.location.origin + window.location.pathname + '?term=' + encodeURIComponent(mealData.strMeal.toLowerCase());

    try {

        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(shareURL);
        } else {
            // Fallback for old browsers / non-HTTPS
            const copyShareURL = $('<input>').val(shareURL).appendTo('body').select();
            document.execCommand('copy');
            copyShareURL.remove();
        }

        showToast('Link copied to the clipboard!');

    } catch (error) {

        console.error(error);
        showToast('Could not copy the link.');

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

// Get meals from Local Storage
function getMealsLS() {

    try {
        const mealIds = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(mealIds) ? mealIds : [];
    } catch (error) {
        return [];
    }

}

function isFavorite(mealId) {

    return getMealsLS().includes(mealId);

}

// Add meals to Local Storage
function addMealLS(mealId) {

    const mealIds = getMealsLS();

    if (!mealIds.includes(mealId)) localStorage.setItem(STORAGE_KEY, JSON.stringify([...mealIds, mealId]));

    updateFavButtons(mealId);

}

// Remove meals from Local Storage
function removeMealLS(mealId) {

    const mealIds = getMealsLS();

    localStorage.setItem(STORAGE_KEY, JSON.stringify(mealIds.filter((id) => id !== mealId)));

    updateFavButtons(mealId);

}

//******************//
// Favourites
//******************//

async function fetchFavMeals() {

    // Ignore results of older calls that finish after a newer one
    const requestId = (GLOBAL.favRequestId = (GLOBAL.favRequestId || 0) + 1);

    const mealIds = getMealsLS();

    // Load all favourites in parallel; skip the ones that fail
    const meals = await Promise.all(
        mealIds.map((id) => getMealById(id).catch(() => null))
    );

    if (requestId !== GLOBAL.favRequestId) return;

    //******************//

    $(GLOBAL.favContainer).empty();

    const validMeals = meals.filter(Boolean);

    if (!validMeals.length) {
        $(GLOBAL.favContainer).append($('<li>').addClass('fav-empty').text('No favorites yet. Tap ♥ to add one.'));
        return;
    }

    validMeals.forEach(addMealFav);

}

function addMealFav(mealData) {

    // Button: Remove item from favourite items
    const favClearBtn = $('<button title="Remove from favorites" aria-label="Remove from favorites"><i class="fas fa-window-close"></i></button>')
        .addClass('clear')
        .on('click', () => {
            removeMealLS(mealData.idMeal);
            fetchFavMeals();
        });

    //******************//

    // Favourite meal content
    const favMealContent = $('<div>').addClass('fav-meal-body').append(
        $('<img>').attr({ src: mealData.strMealThumb, alt: mealData.strMeal, loading: 'lazy' }),
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

    // Get meal ingredients and measures
    for (let i = 1; i <= 20; i++) {

        const ingredient = (mealData['strIngredient' + i] || '').trim();
        const measure    = (mealData['strMeasure' + i] || '').trim();

        if (!ingredient) break;

        ingredients.push(measure ? `${ingredient} - ${measure}` : ingredient);

    }

    //******************//

    // Create the structure
    $(GLOBAL.mealInfoEl).empty().append(
        $('<h1>').text(mealData.strMeal),
        $('<div>').addClass('action-buttons').append(
            createShareButton(mealData),
            createFavButton(mealData)
        ),
        $('<img>').attr({ src: mealData.strMealThumb, alt: mealData.strMeal }),
        $('<p>').addClass('instructions').text(mealData.strInstructions || ''),
        $('<h3>').text('Ingredients:'),
        $('<ul>').append(ingredients.map((ing) => $('<li>').text(ing)))
    );

    //******************//

    // Show the popup modal
    $(GLOBAL.mealPopup).removeClass('hidden').find('.popup').scrollTop(0);
    $(GLOBAL.popupCloseBtn).trigger('focus');

}

function closePopup() {

    $(GLOBAL.mealPopup).addClass('hidden');

}
