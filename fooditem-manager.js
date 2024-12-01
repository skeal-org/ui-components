class FoodItemManager extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.classList.add('tab-content');
  }

  connectedCallback() {
    this.render();
    this.fetchFoodItems();

    const form = this.shadowRoot.querySelector('form');
    const suggestButton = this.shadowRoot.querySelector('#suggest-nutrition-btn');
    const descriptionInput = this.shadowRoot.querySelector('input[name="description"]');

    form.addEventListener('submit', this.createFoodItem.bind(this));
    suggestButton.addEventListener('click', this.showSuggestionPopup.bind(this));
    this.shadowRoot.querySelector('#close-popup').addEventListener('click', () => {
      this.shadowRoot.querySelector('#nutrition-popup').classList.add('hidden');
    });

    // Enable/Disable Suggest Nutrition button based on description input length
    descriptionInput.addEventListener('input', () => {
      if (descriptionInput.value.trim().length > 3) {
        suggestButton.disabled = false;
      } else {
        suggestButton.disabled = true;
      }
    });

    // Initialize the button as disabled
    suggestButton.disabled = true;
  }

  getApiKey() {
    const secretManager = document.querySelector('secret-manager');
    if (!secretManager) {
      throw new Error('SecretManager component not found');
    }
    const apiKey = secretManager.getSecret('openai_api_key');
    if (!apiKey) {
      alert('Please set your OpenAI API key in the Secrets tab.');
    }
    return apiKey;
  }
  async fetchFoodItems() {
    const { data, error } = await supabaseClient
      .from('fooditem')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching food items:', error);
      return;
    }
    this.renderFoodItemList(data);
  }

  renderFoodItemList(foodItems) {
    const table = this.shadowRoot.querySelector('.fooditem-table tbody');
    table.innerHTML = foodItems.map(foodItem => `
        <tr>
            <td>${foodItem.id}</td>
            <td>${foodItem.description}</td>
            <td>${foodItem.category}</td>
            <td>${foodItem.energy_kcal}</td>
            <td>${foodItem.proteins_g}</td>
            <td>${foodItem.carbs_g}</td>
            <td>${foodItem.fats_g}</td>
        </tr>
    `).join('');
  }

  async showSuggestionPopup() {
    const description = this.shadowRoot.querySelector('input[name="description"]').value;
    const apiKey = this.getApiKey();
    if (!apiKey) return;

    const embedding = await this.computeEmbedding(description, apiKey);
    const suggestions = await this.fetchClosestItems(embedding);
    this.renderSuggestions(suggestions);
    this.shadowRoot.querySelector('#nutrition-popup').classList.remove('hidden');
  }

  async computeEmbedding(text, apiKey) {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-3-small'
      })
    });
    const data = await response.json();
    return data.data[0].embedding;
  }

  async fetchClosestItems(embedding) {
    const { data, error } = await supabaseClient
      .rpc('find_closest_ciqual_items', { query_embedding: embedding });

    if (error) {
      console.error('Error fetching closest items:', error);
      return [];
    }

    return data.map(item => ({
      foodItemCode: item.food_item_code,
      foodItemName: { en: item.food_item_name_en, fr: item.food_item_name_fr },
      categoryGroup: { en: item.category_group_name_en, fr: item.category_group_name_fr },
      categorySubGroup: { en: item.category_subgroup_name_en, fr: item.category_subgroup_name_fr },
      categorySubSubGroup: { en: item.category_subsubgroup_name_en, fr: item.category_subsubgroup_name_fr },
      similarity: item.similarity,
      energy_kcal: item.energy_kcal,
      proteins_g: item.proteins_g,
      carbs_g: item.carbs_g,
      fats_g: item.fats_g,
    }));
  }


  renderSuggestions(suggestions) {
    const list = this.shadowRoot.querySelector('#nutrition-suggestions');
    list.innerHTML = suggestions.map((suggestion, index) => `
      <li>
          <strong>${suggestion.foodItemName.en} / ${suggestion.foodItemName.fr}</strong><br>
          Group: ${suggestion.categoryGroup.en} / ${suggestion.categoryGroup.fr}<br>
          Subgroup: ${suggestion.categorySubGroup.en} / ${suggestion.categorySubGroup.fr}<br>
          Sub-subgroup: ${suggestion.categorySubSubGroup.en} / ${suggestion.categorySubSubGroup.fr}<br>
          Similarity: ${(suggestion.similarity * 100).toFixed(2)}%<br>
          Energy (kcal): ${suggestion.energy_kcal || 0}<br>
          Proteins (g): ${suggestion.proteins_g || 0}<br>
          Carbs (g): ${suggestion.carbs_g || 0}<br>
          Fats (g): ${suggestion.fats_g || 0}<br>
          <button id="select-suggestion-${index}">Select</button>
      </li>
  `).join('');

    // Attach event listeners to each "Select" button
    suggestions.forEach((suggestion, index) => {
      const button = this.shadowRoot.querySelector(`#select-suggestion-${index}`);
      button.addEventListener('click', () => {
        this.selectSuggestion(suggestion);
      });
    });
  }

  selectSuggestion(suggestion) {
    const descriptionInput = this.shadowRoot.querySelector('input[name="description"]');
    const categoryInput = this.shadowRoot.querySelector('input[name="category"]');
    const energyInput = this.shadowRoot.querySelector('input[name="energy_kcal"]');
    const proteinsInput = this.shadowRoot.querySelector('input[name="proteins_g"]');
    const carbsInput = this.shadowRoot.querySelector('input[name="carbs_g"]');
    const fatsInput = this.shadowRoot.querySelector('input[name="fats_g"]');

    // Populate input fields with selected suggestion values
    descriptionInput.value = suggestion.foodItemName.en || '';
    categoryInput.value = suggestion.categorySubGroup.en || '';
    energyInput.value = suggestion.energy_kcal || 0;
    proteinsInput.value = suggestion.proteins_g || 0;
    carbsInput.value = suggestion.carbs_g || 0;
    fatsInput.value = suggestion.fats_g || 0;

    // Close the popup
    this.shadowRoot.querySelector('#nutrition-popup').classList.add('hidden');

    // Notify user of the update
    alert(`Selected food item: ${suggestion.foodItemName.en}`);
  }


  async createFoodItem(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const newFoodItem = {
      description: formData.get('description').trim(),
      category: formData.get('category').trim(),
      energy_kcal: parseFloat(formData.get('energy_kcal')) || 0,
      proteins_g: parseFloat(formData.get('proteins_g')) || 0,
      carbs_g: parseFloat(formData.get('carbs_g')) || 0,
      fats_g: parseFloat(formData.get('fats_g')) || 0,
    };

    const { error } = await supabaseClient
      .from('fooditem')
      .insert([newFoodItem]);

    if (error) {
      console.error('Error creating food item:', error);
      return;
    }

    form.reset();
    this.fetchFoodItems();
  }

  render() {
    this.shadowRoot.innerHTML = `
          <style>
              .hidden {
                display: none;
              }
          </style>
          <h2>Food Item Manager</h2>
          <form>
              <input name="description" placeholder="Description" required>
              <input name="category" placeholder="Category">
              <input name="energy_kcal" placeholder="Energy (kcal)" type="number">
              <input name="proteins_g" placeholder="Proteins (g)" type="number">
              <input name="carbs_g" placeholder="Carbs (g)" type="number">
              <input name="fats_g" placeholder="Fats (g)" type="number">
              <button type="submit">Add Food Item</button>
          </form>
          <button id="suggest-nutrition-btn" disabled>Suggest Nutritional Content</button>
          <div id="nutrition-popup" class="hidden">
              <div class="popup-content">
                  <h3>Suggested Nutritional Content</h3>
                  <ul id="nutrition-suggestions"></ul>
                  <button id="close-popup">Close</button>
              </div>
          </div>
          <table class="fooditem-table">
              <thead>
                  <tr>
                      <th>ID</th>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Energy (kcal)</th>
                      <th>Proteins (g)</th>
                      <th>Carbs (g)</th>
                      <th>Fats (g)</th>
                  </tr>
              </thead>
              <tbody></tbody>
          </table>
      `;
  
    // Attach event listener for close button after rendering
    this.shadowRoot.querySelector('#close-popup').addEventListener('click', () => {
      console.log('Close button clicked');
      this.shadowRoot.querySelector('#nutrition-popup').classList.add('hidden');
    });
  }
  
}

customElements.define('fooditem-manager', FoodItemManager);
