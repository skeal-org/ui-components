class MenuManager extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.classList.add('tab-content');
    }
  
    connectedCallback() {
      this.render();
      this.fetchMenus();
      this.shadowRoot.querySelector('form').addEventListener('submit', this.createMenu.bind(this));
    }
  
    async fetchMenus() {
      const { data, error } = await supabaseClient
        .from('menu')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('Error fetching menus:', error);
        return;
      }
      this.renderMenuList(data);
    }
  
    renderMenuList(menus) {
      const table = this.shadowRoot.querySelector('.menu-table tbody');
      table.innerHTML = menus.map(menu => `
        <tr>
          <td>${menu.id}</td>
          <td>${menu.date}</td>
          <td>${menu.meal}</td>
          <td>${menu.item}</td>
          <td>${menu.organization_id}</td>     
          <td>
            <button class="edit-btn" data-id="${menu.id}">Edit</button>
            <button class="delete-btn" data-id="${menu.id}">Delete</button>
          </td>
        </tr>
      `).join('');
  
      this.shadowRoot.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', this.editMenu.bind(this));
      });
  
      this.shadowRoot.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', this.deleteMenu.bind(this));
      });
    }
    
    async editMenu(event) {
        const menuId = event.target.dataset.id;
        const { data: menu, error } = await supabaseClient
            .from('menu')
            .select('*')
            .eq('id', menuId)
            .single();
        if (error) {
            console.error(`Error fetching menu ${menuId}:`, error);
            return;
        }

        const form = this.shadowRoot.querySelector('form');

        form.querySelector('input[name="id"]').value = menu.id;
        form.querySelector('input[name="date"]').value = menu.date;
        form.querySelector('input[name="meal"]').value = menu.meal;
        form.querySelector('input[name="item"]').value = menu.item;
        form.querySelector('input[name="organization_id"]').value = menu.organization_id;

        form.querySelector('button[type="submit"]').textContent = 'Update Menu';
        form.dataset.editing = menuId;
    }

    async createMenu(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const organization_id = formData.get('organization_id')? parseInt(formData.get('organization_id').trim()) : null;
        const newMenu = {
            date: formData.get('date').trim(),
            meal: formData.get('meal').trim(),
            item: parseInt(formData.get('item').trim()),
            organization_id: organization_id,
        };

        let response;
        if (form.dataset.editing) {
            const menuId = form.dataset.editing;
            response = await supabaseClient
                .from('menu')
                .update(newMenu)
                .eq('id', parseInt(menuId));
            form.querySelector('button[type="submit"]').textContent = 'Create Menu';

        } else {
            response = await supabaseClient
                .from('menu')
                .insert([newMenu]);
        }

        const { error } = response;
        if (error) {
            console.error('Error saving menu:', error);
            return;
        }

        if (form.dataset.editing){
          delete form.dataset.editing;
        }


        form.reset();
        this.fetchMenus();
    }
  
    async deleteMenu(event) {
      const menuId = event.target.dataset.id;
      if (!menuId) {
        console.error('No menu ID found for deletion.');
        return;
      }
      const { error } = await supabaseClient
        .from('menu')
        .delete()
        .eq('id', parseInt(menuId));
        
      if (error) {
        console.error('Error deleting menu:', error);
        return;
      }
      this.fetchMenus();
    }
  
    render() {
      this.shadowRoot.innerHTML = `
        <style>
          .menu-table {
            width: 100%;
            border-collapse: collapse;
          }
          .menu-table th, .menu-table td {
            border: 1px solid #ddd;
            padding: 8px;
          }
          .menu-table th {
            background-color: #f2f2f2;
          }
        </style>
        <h2>Menu Manager</h2>

        <div>
          <form>
            <input name="id" placeholder="ID" type="number" readonly>
            <input name="date" placeholder="Date" required>
            <input name="meal" placeholder="Meal" required>
            <input name="item" placeholder="Item" required>
            <input name="organization_id" placeholder="Organization ID" type="number">
          <button type="submit">Create Menu</button>
        </form>
        </div>

        <table class="menu-table">
          <thead>
            <tr>
              <th>Id</th>
              <th>Date</th>
              <th>Meal</th>
              <th>Item</th>
              <th>Organization ID</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      `;
    }
  }
  
  customElements.define('menu-manager', MenuManager);