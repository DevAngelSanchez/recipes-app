function App() {

  // variables
  const selectCategories = document.querySelector('#categorias');
  const favoritesContainer = document.querySelector('.favoritos');
  const resultsContainer = document.querySelector('#resultado');
  const modal = new bootstrap.Modal('#modal', {});

  // listeners
  if (selectCategories) {
    selectCategories.addEventListener('change', selectCategory);

    // Show Categories when the dom is ready
    getCategories();
  }

  // If exist favorites, show it
  if (favoritesContainer) {
    getFavorites();
  }

  // Functions

  function getCategories() {
    const URL = 'https://www.themealdb.com/api/json/v1/1/categories.php';

    fetch(URL)
      .then(response => response.json())
      .then(({ categories }) => showCategories(categories));
  }

  function getFavorites() {
    const favorites = getFromLS();

    if (favorites.length) {
      showMeal(favorites);
      return;
    }

    const noFavoritesText = document.createElement("P");
    noFavoritesText.classList.add("fs-4", "fw-bold", "text-center", "mt-5");
    noFavoritesText.textContent = "No favorites recipes found!";

    resultsContainer.appendChild(noFavoritesText);
  }

  function showCategories(categories = []) {
    categories.forEach(category => {
      const option = document.createElement('OPTION');
      const { strCategory } = category;
      option.value = strCategory;
      option.textContent = strCategory;
      selectCategories.appendChild(option);
    });
  }

  function selectCategory(e) {
    const category = e.target.value;
    const URL = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`;

    fetch(URL)
      .then(response => response.json())
      .then(({ meals }) => showMeal(meals))
  }

  function showMeal(meals = []) {

    // Clear old results
    clearHTML(resultsContainer);

    const heading = document.createElement('DIV');
    heading.classList.add('fs-4', 'fw-bold', 'text-center', 'text-black', 'my-5');
    heading.textContent = meals.length ? `Recipes: ${meals.length}` : 'No recipes found!';

    resultsContainer.appendChild(heading);

    meals.forEach(meal => {
      const { idMeal, strMeal, strMealThumb } = meal;

      const recipesResultsContainer = document.createElement('DIV');
      recipesResultsContainer.classList.add('col-md-4');

      const cardRecipe = document.createElement('DIV');
      cardRecipe.classList.add('card', 'mb-4');

      const cardImg = document.createElement('IMG');
      cardImg.classList.add('card-img-top');
      cardImg.alt = `Imagen ${strMeal ?? meal.title}`
      cardImg.src = strMealThumb ?? meal.img;

      const cardBody = document.createElement('DIV');
      cardBody.classList.add('card-body');

      const cardRecipeHeading = document.createElement('H3');
      cardRecipeHeading.classList.add('card-title', 'mb-3');
      cardRecipeHeading.textContent = strMeal ?? meal.title;

      const cardButton = document.createElement('BUTTON');
      cardButton.classList.add('btn', 'btn-danger', 'w-100');
      cardButton.textContent = 'View Recipe';
      cardButton.onclick = function () {
        selectRecipe(idMeal ?? meal.id);
      }


      cardBody.appendChild(cardRecipeHeading);
      cardBody.appendChild(cardButton);

      cardRecipe.appendChild(cardImg);
      cardRecipe.appendChild(cardBody);

      recipesResultsContainer.appendChild(cardRecipe);

      resultsContainer.appendChild(recipesResultsContainer);
    });
  }

  function selectRecipe(id) {
    const URL = `https://themealdb.com/api/json/v1/1/lookup.php?i=${id}`;
    fetch(URL)
      .then(response => response.json())
      .then(({ meals }) => showRecipe(meals[0]));
  }

  function showRecipe(recipe) {
    const { strMeal, idMeal, strInstructions, strMealThumb } = recipe;

    const modalTitle = document.querySelector(".modal .modal-title");
    const modalBody = document.querySelector(".modal .modal-body");
    const modalFooter = document.querySelector(".modal .modal-footer");

    clearHTML(modalFooter);

    modalTitle.textContent = strMeal;
    modalBody.innerHTML = `
      <img class="img-fluid" src="${strMealThumb}" alt="Recipe ${strMeal}" />
      <h3 class="mt-3">Instructions</h3>
      <p>${strInstructions}</p>
      <h3 class="mt-3">Ingredients and Measures</h3>
    `;

    // Add ingredient and measure
    const listGroup = document.createElement('UL');
    listGroup.classList.add('list-group');

    for (let i = 1; i <= 20; i++) {
      if (recipe[`strIngredient${i}`]) {
        const ingredient = recipe[`strIngredient${i}`];
        const measure = recipe[`strMeasure${i}`];

        const listItem = document.createElement('LI');
        listItem.classList.add('list-group-item');
        listItem.textContent = `${ingredient} - ${measure}`

        listGroup.appendChild(listItem);
      }
    }

    modalBody.appendChild(listGroup);

    // Buttons to save as favorite and close modal
    const btnFavorite = document.createElement('BUTTON');
    btnFavorite.classList.add('btn', 'col');
    itExist(idMeal) ? (
      btnFavorite.classList.add('btn-danger')
    ) : (
      btnFavorite.classList.add('btn-success')
    )
    btnFavorite.textContent = itExist(idMeal) ? "Delete From Favorites" : "Save as Favorite";

    // save on localStorage
    btnFavorite.onclick = function () {

      // Check if the item exist
      if (itExist(idMeal)) {
        deleteFromFavorite(idMeal);
        btnFavorite.classList.add('btn-success');
        btnFavorite.classList.remove('btn-danger');
        btnFavorite.textContent = "Save as Favorite";
        showToast("Delete successfully");
        return;
      };

      addToFavorite({
        id: idMeal,
        title: strMeal,
        img: strMealThumb
      });
      btnFavorite.classList.add('btn-danger');
      btnFavorite.classList.remove('btn-success');
      btnFavorite.textContent = "Delete from favorites";
      showToast("Add successfully");
    }

    const btnClose = document.createElement('BUTTON');
    btnClose.classList.add('btn', 'btn-secondary', 'col');
    btnClose.textContent = "Close";
    btnClose.onclick = function () {
      modal.hide();
    }

    modalFooter.appendChild(btnFavorite);
    modalFooter.appendChild(btnClose);

    // show modal
    modal.show();
  }

  function addToFavorite(recipe) {
    const favorites = getFromLS();
    localStorage.setItem("favorites", JSON.stringify([...favorites, recipe]));
  }

  function deleteFromFavorite(id) {
    const favorites = getFromLS();
    const newFavorites = favorites.filter(favorite => favorite.id !== id);
    localStorage.setItem("favorites", JSON.stringify(newFavorites));
  }

  function itExist(id) {
    const favorites = getFromLS();
    return favorites.some(favorite => favorite.id === id);
  }

  function showToast(msg) {
    const toastDiv = document.querySelector("#toast");
    const toastBody = document.querySelector(".toast-body");
    const toast = new bootstrap.Toast(toastDiv);
    toastBody.textContent = msg;

    toast.show();
  }

  function clearHTML(selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  }

  // Get or create favorites items from local storage
  function getFromLS() {
    return JSON.parse(localStorage.getItem("favorites")) ?? [];
  }
}

document.addEventListener('DOMContentLoaded', App);