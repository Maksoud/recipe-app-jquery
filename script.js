let GLOBAL = {};

const searchTerm    = null;
const searchBtn     = null;
const mealsEl       = null;
const mealPopup     = null;
const mealInfoEl    = null;
const mealContent   = null;
const mealFavBtn    = null;
const favContainer  = null;
const favMealContent= null;
const favClearBtn   = null;
const popupCloseBtn = null;
const mealShareBtn  = null;

$(document).ready(function() {
    
    GLOBAL.container        = $('<div>').addClass('mobile-container');
    GLOBAL.searchTerm       = $('<input type="text" placeholder="Pesquisar...">').keypress(async (event) => {
                                                                                                             if (event.which == 13) {
                                                                                                                const search = $(GLOBAL.searchTerm).val();
                                                                                                                const meals  = await getMealsBySearch(search);
                                                                                                                if (meals) {
                                                                                                                    meals.forEach((meal) => {
                                                                                                                        addMeal(meal);
                                                                                                                    })
                                                                                                                }// if (meals) 
                                                                                                             }// if (event.which == 13)
                                                                                                            });
    GLOBAL.searchBtn        = $('<button title="Pesquisar"><i class="fas fa-search"></i></button>').click(async () => {
                                                                                                                        const search = $(GLOBAL.searchTerm).val();
                                                                                                                        const meals  = await getMealsBySearch(search);
                                                                                                                        if (meals) {
                                                                                                                            meals.forEach((meal) => {
                                                                                                                                addMeal(meal);
                                                                                                                            })
                                                                                                                        }// if (meals)        
                                                                                                                      });
    GLOBAL.favContainer     = $('<ul>').addClass('fav-meals');
    GLOBAL.mealsEl          = $('<div>').addClass('meals');
    GLOBAL.mealPopup        = $('<div>').addClass('popup-container hidden');
    GLOBAL.mealInfoEl       = $('<div>').addClass('meal-info');
    GLOBAL.popupCloseBtn    = $('<button><i class="fas fa-times"></i></button>').addClass('close-popup').click( () => {
                                                                                                                       $(GLOBAL.mealPopup).addClass("hidden");
                                                                                                                      });
    
    $('body').html('').append(
        $(GLOBAL.container).append(
            $('<header>').append(
                $('<button title="Carregar novos dados"><i class="fas fa-redo-alt"></i></button>').click( () => {
                                                                                                                 getRandomMeal();
                                                                                                                 $(GLOBAL.searchTerm).val("")
                                                                                                                }),
                $(GLOBAL.searchTerm),
                $(GLOBAL.searchBtn)
            ),// header
            $('<div>').addClass('fav-container').append(
                $('<h3>').text("Refeições Favoritas"),
                $('<div>').addClass('fav-cont-list').append(
                    $(GLOBAL.favContainer)
                )
            ),// fav-container
            $(GLOBAL.mealsEl)
        ),// $(GLOBAL.pai)
        $(GLOBAL.mealPopup).append(
            $('<div>').addClass('popup').append(
                $(GLOBAL.popupCloseBtn),
                $(GLOBAL.mealInfoEl)
            )// popup
        )// mealPopup
    );
    
    /*
    <div class="mobile-container">
        <header>
            <input type="text" id="search-term" placeholder="Pesquisar..." />
            <button id="search"><i class="fas fa-search"></i></button>
        </header>
        <div class="fav-container">
            <div>
                <h3>Refeições Favoritas</h3>
            </div>
            <div class="fav-cont-list">
            	<ul class="fav-meals" id="fav-meals">
                    <!-- List of favourite meals -->
                </ul>
            </div>
        </div>
        <div class="meals" id="meals">
            <!-- Random Meals -->
        </div>
    </div>
    <div id="meal-popup" class="popup-container hidden">
        <div class="popup">
            <button id="close-popup" class="close-popup"><i class="fas fa-times"></i></button>
            <div class="meal-info" id="meal-info">
            	<!-- Show meal info popup here -->
            </div>
        </div>    
    </div>
    */
    
    // Find meal id in URL parameters
    let term = getUrlParam('term');
    
    // Get a URL meal or a random meal
    getRandomMeal(term);
    
    // Fetch favourite meals
    fetchFavMeals();
    
});

function getUrlVars() {
    
    let vars  = {};
    let parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
        vars[key] = value;
    });
    
    return vars;
    
}// getUrlVars()

function getUrlParam(parameter) {
    
    let urlParameter = null;
    
    //******************//
    
    if (window.location.href.indexOf(parameter) > -1) {
        urlParameter = getUrlVars()[parameter];
    }// if (window.location.href.indexOf(parameter) > -1)
    
    //******************//
    
    return (urlParameter) ? urlParameter : null;
    
}// getUrlParam(parameter)

async function getRandomMeal(term = null) {
    
    // IF defined a term to search, find it, otherwise get a random meal
    if (term) {
        
        const meals = await getMealsBySearch(term);
        
        if (meals) {
            meals.forEach((meal) => {
                addMeal(meal);
            })
        }// if (meals)
        
        return;
        
    }// if (term)
    
    //******************//

    // Clean the container
    $(GLOBAL.mealsEl).html("");
    
    //******************//

    const resp       = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
    const respData   = await resp.json();
    const randomMeal = respData.meals[0];
    
    //******************//
    
    addMeal(randomMeal, true);
    
}

async function getMealById(id) {

    const resp      = await fetch('https://www.themealdb.com/api/json/v1/1/lookup.php?i=' + id);
    const respData  = await resp.json();
    
    if (respData) {
        
        const meal = respData.meals[0];
    
        return meal;
        
    } else {
        
        return false;
        
    }// else if (respData)
    
}

async function getMealsBySearch(term) {

    //Clean the container
    $(GLOBAL.mealsEl).html("");

    const resp      = await fetch('https://www.themealdb.com/api/json/v1/1/search.php?s=' + decodeURI(term).toLowerCase());
    const respData  = await resp.json();
    const meals     = respData.meals;
    
    return meals;
    
}

function addMeal(mealData, random = false) {
    
    // Creating the share button structure
    GLOBAL.mealShareBtn = $('<button title="Copiar Link"><i class="fas fa-share-alt"></i></button>').addClass('meal-share-btn').attr('id', mealData.idMeal);
    
    $(GLOBAL.mealShareBtn).click((event) => {
        
        // Get current URL + idMeal
        let shareURL = $(location).attr('origin') + $(location).attr('pathname') + '?term=' + encodeURI(mealData.strMeal).toLowerCase();
        
        //console.log(shareURL);
        
        // Copy URL to clipboard
        let copyShareURL = $('<input>').val(shareURL).appendTo('body').select();//.setSelectionRange(0, 99999); // Used in mobile devices
        document.execCommand('copy');
        copyShareURL.remove();
        
        alert('Link copiado para área de transferência!');
        
    });
    
    //******************//
    // Favourite Button
    
    // Creating the like buttton structure
    GLOBAL.mealFavBtn = $('<button><i class="fas fa-heart"></i></button>').addClass('meal-fav-btn').attr('id', mealData.idMeal);
    
    // Like button
    $(GLOBAL.mealFavBtn).click((event) => {
        
        //Control like button appearance and behavior
        if ($(event.currentTarget).hasClass('active')) {
            
            removeMealLS(mealData.idMeal);
            $(event.currentTarget).removeClass('active');
            
        } else {
            
            addMealLS(mealData.idMeal);
            $(event.currentTarget).addClass('active');
            
        }// else if ($(this).hasClass('active'))
        
        //List favourite meals
        fetchFavMeals();
    
    });
    
    //******************//
    // Active like button if the item is in favourite list
    
    const mealIds = getMealsLS();
    let found     = false;
    
    mealIds.forEach((meal) => {
        if (meal == mealData.idMeal) found = true; 
    });
    
    if (found) $(GLOBAL.mealFavBtn).addClass('active');
    
    //******************//
    
    // Creating meal content structure
    GLOBAL.mealContent = $('<div>').addClass('meal').append(
        $('<div>').addClass('meal-header').append(`${random ? `
                                                        <span class="random">
                                                            Receitas Diversas
                                                        </span>` : ''}
                                                        <img src="${mealData.strMealThumb}" alt="${mealData.strMeal}">
                                                  `),
                                                  $('<div>').addClass('meal-body').append($('<h4>').html(`${mealData.strMeal}`))
    );
    
    //******************//
        
    // Show meal details
    $(GLOBAL.mealContent).click(() => {
        showMealInfo(mealData);
    });
    
    //******************//
    
    //Insert content and button to HTML element
    $(GLOBAL.mealsEl).append($(GLOBAL.mealContent),
                             $(GLOBAL.mealShareBtn),
                             $(GLOBAL.mealFavBtn)
                            );
    
}

//Add meals to Local Storage
function addMealLS(mealId) {
    
    const mealIds = getMealsLS();
    let found     = false;
    
    // Look for registers in the list
    mealIds.forEach((meal) => {
        if (meal == mealId) found = true; 
    });
    
    if (!found) localStorage.setItem('mealIds', JSON.stringify([...mealIds, mealId]));
    
}

//Remove meals from Local Storage
function removeMealLS(mealId) {
    
    const mealIds = getMealsLS();
    
    localStorage.setItem('mealIds', JSON.stringify(mealIds.filter((id) => id !== mealId)));
    
}

//Get meals from Local Storage
function getMealsLS() {
    
    const mealIds = JSON.parse(localStorage.getItem('mealIds'));
    
    return mealIds === null ? [] : mealIds;
    
}

async function fetchFavMeals() {
            
    //Clean favourite meals container first
    $(GLOBAL.favContainer).html("");
    
    const mealIds = getMealsLS();
    
    for (let i = 0; i < mealIds.length; i++) {
        
        // Get meals id
        const mealId = mealIds[i];
        
        // Get meals details by id
        meal = await getMealById(mealId);
        
        // Add meals to HTML
        addMealFav(meal);
        
    }//for (let i = 0; i < mealIds.length; i++)
    
}

function addMealFav(mealData) {
    
    GLOBAL.favClearBtn    = $('<div>').append(
                                             $('<button><i class="fas fa-window-close"></i></button>').addClass('clear')
                                            );
    
    //******************//
    
    GLOBAL.favMealContent = $('<div>').addClass('fav-meal-body').append(
                                                                        `<img src="${mealData.strMealThumb}" alt="${mealData.strMeal}" />`,
                                                                        `<span>${mealData.strMeal}</span>`
                                                                       );
    
    //******************//
                                                                       
    const favMeal = $('<li>').append($(GLOBAL.favMealContent),
                                     $(GLOBAL.favClearBtn)
                                    );
    
    //******************//
    
    // Show details of the favourite meal
    $(GLOBAL.favMealContent).click( () => {
        showMealInfo(mealData);
    });
    
    //******************//
    
    // Remove favourite item
    $(GLOBAL.favClearBtn).click( () => {
        
        //Remove ID from array in local storage
        removeMealLS(mealData.idMeal);
        
        //List favourite meals
        fetchFavMeals();
        
    });
    
    //******************//
    
    //Add to favourite container
    $(GLOBAL.favContainer).append(
        favMeal
    );
    
}

function showMealInfo(mealData) {
    
    //Clean it up
    $(GLOBAL.mealInfoEl).html("");
    
    // update the meal info
    const mealEl = $('<div>');
    
    const ingredients = [];
    
    //get meal ingredients or measures
    for (let i = 1; i <= 20; i++) {
        
        if (mealData["strIngredient" + i]) {
            ingredients.push(`${mealData["strIngredient" + i]} - ${mealData["strMeasure" + i]}`);
        } else {
            break;
        }
        
    }//for (let i=0; i<20; i++)
    
    mealEl.html(`
        <h1>${mealData.strMeal}</h1>
    	<img src="${mealData.strMealThumb}" alt="${mealData.strMeal}">
    	<p>
        	${mealData.strInstructions}
    	</p>
    	<h3>Ingredients:</h3>
    	<ul>
    	    ${ingredients.map((ing) => `<li>${ing}</li>`).join("")}
    	</ul>
    `);
    
    $(GLOBAL.mealInfoEl).append(mealEl);
    
    //show the popup
    $(GLOBAL.mealPopup).removeClass('hidden');
    
}