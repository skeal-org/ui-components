class FoodItemManager extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.classList.add('tab-content');    
    }
  
    connectedCallback() {
      this.render();
      this.fetchFoodItems();
      this.shadowRoot.querySelector('form').addEventListener('submit', this.createFoodItem.bind(this));
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
          <td>${foodItem.family}</td>
          <td>${foodItem.category}</td>
          <td>${foodItem.type}</td>
          <td>${foodItem.sub_type}</td>
          <td>${foodItem.eater_type}</td>
          <td>${foodItem.portion_g}</td>
          <td>${foodItem.energy_kcal}</td>
          <td>${foodItem.proteins_g}</td>
          <td>${foodItem.carbs_g}</td>
          <td>${foodItem.fats_g}</td>
          <td>${foodItem.portion_share}</td>
          <td>${foodItem.organization_id}</td>
          <td>
            <button class="edit-btn" data-id="${foodItem.id}">Edit</button>
            <button class="delete-btn" data-id="${foodItem.id}">Delete</button>
          </td>
        </tr>
      `).join('');
  
      this.shadowRoot.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', this.editFoodItem.bind(this));
      });
  
      this.shadowRoot.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', this.deleteFoodItem.bind(this));
      });
    }
    
    async editFoodItem(event) {
        const foodItemId = event.target.dataset.id;
        const { data: foodItem, error } = await supabaseClient
            .from('fooditem')
            .select('*')
            .eq('id', foodItemId)
            .single();
        if (error) {
            console.error(`Error fetching food item ${foodItemId}:`, error);
            return;
        }

        const form = this.shadowRoot.querySelector('form');
        form.querySelector('input[name="id"]').value = foodItemId;

        form.querySelector('input[name="description"]').value = foodItem.description;
        form.querySelector('input[name="family"]').value = foodItem.family;
        form.querySelector('input[name="category"]').value = foodItem.category;
        form.querySelector('input[name="type"]').value = foodItem.type;
        form.querySelector('input[name="sub_type"]').value = foodItem.sub_type;
        form.querySelector('input[name="eater_type"]').value = foodItem.eater_type;
        form.querySelector('input[name="portion_g"]').value = foodItem.portion_g;
        form.querySelector('input[name="energy_kcal"]').value = foodItem.energy_kcal;
        form.querySelector('input[name="proteins_g"]').value = foodItem.proteins_g;
        form.querySelector('input[name="carbs_g"]').value = foodItem.carbs_g;
        form.querySelector('input[name="fats_g"]').value = foodItem.fats_g;
        form.querySelector('input[name="portion_share"]').value = foodItem.portion_share;
        form.querySelector('input[name="organization_id"]').value = foodItem.organization_id;

        form.querySelector('button[type="submit"]').textContent = 'Update Food Item';
        form.dataset.editing = foodItemId;
    }

    async createFoodItem(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const organization_id = formData.get('organization_id')? parseInt(formData.get('organization_id').trim()) : null;
        const newFoodItem = {
            description: formData.get('description').trim(),
            family: formData.get('family').trim(),
            category: formData.get('category').trim(),
            type: formData.get('type').trim(),
            sub_type: formData.get('sub_type').trim(),
            eater_type: formData.get('eater_type').trim(),
            portion_g: formData.get('portion_g').trim() ?? 0,
            energy_kcal: formData.get('energy_kcal').trim() ?? 0,
            proteins_g: formData.get('proteins_g').trim() ?? 0,
            carbs_g: formData.get('carbs_g').trim() ?? 0,
            fats_g: formData.get('fats_g').trim() ?? 0,
            portion_share: formData.get('portion_share').trim() ?? 0,
            organization_id: organization_id,
        };

        let response;
        if (form.dataset.editing) {
            const foodItemId = form.dataset.editing;
            response = await supabaseClient
                .from('fooditem')
                .update(newFoodItem)
                .eq('id', parseInt(foodItemId));
            form.querySelector('button[type="submit"]').textContent = 'Create Food Item';
        } else {
            response = await supabaseClient
                .from('fooditem')
                .insert([newFoodItem]);
        }

        const { error } = response;
        if (error) {
            console.error('Error saving food item:', error);
            return;
        }

        if (form.dataset.editing){
          delete form.dataset.editing;
        }

        form.reset();
        this.fetchFoodItems();
    }
  
    async deleteFoodItem(event) {
      const foodItemId = event.target.dataset.id;
      if (!foodItemId) {
        console.error('No food item ID found for deletion.');
        return;
      }
      const { error } = await supabaseClient
        .from('fooditem')
        .delete()
        .eq('id', parseInt(foodItemId));
        
      if (error) {
        console.error('Error deleting food item:', error);
        return;
      }
      this.fetchFoodItems();
    }
  
    render() {
      this.shadowRoot.innerHTML = `
        <style>
          .fooditem-table {
            width: 100%;
            border-collapse: collapse;
          }
          .fooditem-table th, .fooditem-table td {
            border: 1px solid #ddd;
            padding: 8px;
          }
          .fooditem-table th {
            background-color: #f2f2f2;
          }
        </style>
        <h2>Food Item Manager</h2>

        <div>
        <form>
          <input name="id" placeholder="ID" type="number" readonly>
          <input name="description" placeholder="Description" required>
          <input name="family" placeholder="Family">
          <input name="category" placeholder="Category">
          <input name="type" placeholder="Type">
          <input name="sub_type" placeholder="Sub Type">
          <input name="eater_type" placeholder="Eater Type">
          <input name="portion_g" placeholder="Portion (g)">
          <input name="energy_kcal" placeholder="Energy (kcal)">
          <input name="proteins_g" placeholder="Protein (g)">
          <input name="carbs_g" placeholder="Carbs (g)">
          <input name="fats_g" placeholder="Fats (g)">
          <input name="portion_share" placeholder="Portion Share">
          <input name="organization_id" placeholder="Organization ID" type="number">
          <button type="submit">Create Food Item</button>
        </form>        
        </div>
        <table class="fooditem-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Description</th>
              <th>Family</th>
              <th>Category</th>
              <th>Type</th>
              <th>Sub Type</th>
              <th>Eater Type</th>
              <th>Portion (g)</th>
              <th>Energy (kcal)</th>
              <th>Protein (g)</th>
              <th>Carbs (g)</th>
              <th>Fats (g)</th>
              <th>Portion Share</th>           
              <th>Organization ID</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      `;
    }
  }
  
  customElements.define('fooditem-manager', FoodItemManager);