class DeviceManager extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }
  
    connectedCallback() {
      this.render();
      this.fetchDevices();
      this.shadowRoot.querySelector('form').addEventListener('submit', this.createDevice.bind(this));
    }
  
    async fetchDevices() {
      const { data, error } = await supabaseClient
        .from('device')
        .select('*');
      if (error) {
        console.error('Error fetching devices:', error);
        return;
      }
      this.renderDeviceList(data);
    }
  
    renderDeviceList(devices) {
      const table = this.shadowRoot.querySelector('.device-table tbody');
      table.innerHTML = devices.map(device => `
        <tr>
          <td>${device.name}</td>
          <td>${device.serial}</td>
          <td>${device.brand}</td>
          <td>${device.model}</td>
          <td>${device.app_code}</td>
          <td>${device.client_id}</td>
          <td>${device.organization_id}</td>
          <td>${device.private_info}</td>
          <td>${device.last_connection}</td>
          <td>
            <button class="edit-btn" data-id="${device.id}">Edit</button>
            <button class="delete-btn" data-id="${device.id}">Delete</button>
          </td>
        </tr>
      `).join('');
  
      this.shadowRoot.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', this.editDevice.bind(this));
      });
  
      this.shadowRoot.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', this.deleteDevice.bind(this));
      });
    }
    
    async editDevice(event) {
        const deviceId = event.target.dataset.id;
        const { data: device, error } = await supabaseClient
            .from('device')
            .select('*')
            .eq('id', deviceId)
            .single();
        if (error) {
            console.error('Error fetching device:', error);
            return;
        }

        const form = this.shadowRoot.querySelector('form');
        form.querySelector('input[name="name"]').value = device.name;
        form.querySelector('input[name="serial"]').value = device.serial;
        form.querySelector('input[name="brand"]').value = device.brand;
        form.querySelector('input[name="model"]').value = device.model;
        form.querySelector('input[name="app_code"]').value = device.app_code;
        form.querySelector('input[name="client_id"]').value = device.client_id;
        form.querySelector('input[name="organization_id"]').value = device.organization_id;
        form.querySelector('input[name="private_info"]').value = device.private_info;
        form.querySelector('input[name="last_connection"]').value = device.last_connection;

        form.querySelector('button[type="submit"]').textContent = 'Update Device';
        form.dataset.editing = deviceId;
    }

    async createDevice(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const lastConnection = formData.get('last_connection') || null;
        const newDevice = {
            name: formData.get('name'),
            serial: formData.get('serial'),
            brand: formData.get('brand'),
            model: formData.get('model'),
            app_code: formData.get('app_code'),
            client_id: formData.get('client_id'),
            organization_id: formData.get('organization_id'),
            private_info: formData.get('private_info'),
            last_connection: lastConnection
        };

        let response;
        if (form.dataset.editing) {
            const deviceId = form.dataset.editing;
            response = await supabaseClient
                .from('device')
                .update(newDevice)
                .eq('id', deviceId);
            form.querySelector('button[type="submit"]').textContent = 'Create Device';
            delete form.dataset.editing;
        } else {
            response = await supabaseClient
                .from('device')
                .insert([newDevice]);
        }

        const { error } = response;
        if (error) {
            console.error('Error saving device:', error);
            return;
        }

        form.reset();
        this.fetchDevices();
    }
  
    async deleteDevice(event) {
      const deviceId = event.target.dataset.id;
      const { error } = await supabaseClient
        .from('device')
        .delete()
        .eq('id', deviceId);
      if (error) {
        console.error('Error deleting device:', error);
        return;
      }
      this.fetchDevices();
    }
  
    render() {
      this.shadowRoot.innerHTML = `
        <style>
          .device-table {
            width: 100%;
            border-collapse: collapse;
          }
          .device-table th, .device-table td {
            border: 1px solid #ddd;
            padding: 8px;
          }
          .device-table th {
            background-color: #f2f2f2;
          }
        </style>
        <h2>Device Manager</h2>
        <table class="device-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Serial</th>
              <th>Brand</th>
              <th>Model</th>
              <th>App Code</th>
              <th>Client ID</th>
              <th>organization ID</th>
              <th>Private Info</th>
              <th>Last Connection</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
        <form>
          <input name="name" placeholder="Name" required>
          <input name="serial" placeholder="Serial" required>
          <input name="brand" placeholder="Brand" required>
          <input name="model" placeholder="Model" required>
          <input name="app_code" placeholder="App Code" required>
          <input name="client_id" placeholder="Client ID" type="number" required>
          <input name="organization_id" placeholder="organization ID" type="number">
          <input name="private_info" placeholder="Private Info">
          <input name="last_connection" placeholder="Last Connection" type="datetime-local">
          <button type="submit">Create Device</button>
        </form>
      `;
    }
  }
  
  customElements.define('device-manager', DeviceManager);