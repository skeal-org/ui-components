class OrganizationManager extends HTMLElement {
  constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.types = [];
      this.instances = [];
      this.currentMainTab = 'types';
      this.currentHierarchyTab = 'table';
      this.selectedInstanceType = 'root';
      this.useLocalStorage = sessionStorage.getItem('useLocalStorage') === 'true';
      this.classList.add('tab-content');
      this.loadData();
  }

  async loadData() {
      if (this.useLocalStorage) {
          // Load from localStorage
          const typesData = localStorage.getItem('organizationTypes');
          const instancesData = localStorage.getItem('organizationInstances');
          this.types = typesData ? JSON.parse(typesData) : [];
          this.instances = instancesData ? JSON.parse(instancesData) : [];
          if (this.types.length === 0) {
              this.initializeDefaultTypes();
          }
          this.render();
      } else {
          // Load from Supabase
          const { data: { user }, error } = await supabaseClient.auth.getUser();
          if (error) {
              console.error('Error fetching user:', error);
              window.location.href = 'signin.html';
              return;
          }
          if (!user) {
              window.location.href = 'signin.html';
              return;
          }
          // Fetch profile
          const { data: profiles, error: profileError } = await supabaseClient
              .from('profile')
              .select('*')
              .eq('user_id', user.id);
          if (profileError || profiles.length === 0) {
              alert('Error fetching profile');
              return;
          }
          const profile = profiles[0];

          // Fetch client
          const { data: clients, error: clientError } = await supabaseClient
              .from('client')
              .select('id,hierarchy')
              .eq('id', profile.client_id);
          if (clientError || clients.length === 0) {
              alert('Error fetching client');
              return;
          }
          const client = clients[0];

          // Load hierarchy JSON from client (assuming client.hierarchy contains types data)
          this.types = client.hierarchy ? client.hierarchy : [];
          if (this.types.length === 0) {
              this.initializeDefaultTypes();
              // Save default types to client.hierarchy
              await supabaseClient.from('client').update({
                  hierarchy: this.types
              }).eq('id', client.id);
          }

          // Fetch organizations
          const { data: organizations, error: orgError } = await supabaseClient
              .from('organization')
              .select('*')
              .eq('client_id', client.id);
          if (orgError) {
              alert('Error fetching organizations');
              return;
          }
          this.instances = organizations;
          this.clientId = client.id;
          this.render();
      }
  }

  initializeDefaultTypes() {
      this.types = [
          { id: 'root', name: 'Headquarters', parent: [], data_access: 'children', color: 'red' },
          { id: 'region', name: 'Regions', parent: ['root'], data_access: 'children', color: 'orange' },
          { id: 'facility', name: 'Facilities', parent: ['region'], data_access: 'descendants', color: 'green' },
          { id: 'unit', name: 'Units', parent: ['facility', 'region'], data_access: 'own', color: 'blue' },
      ];
      if (this.useLocalStorage) {
          this.saveTypesLocal();
      }
  }

  saveTypesLocal() {
      localStorage.setItem('organizationTypes', JSON.stringify(this.types));
  }

  saveInstancesLocal() {
      localStorage.setItem('organizationInstances', JSON.stringify(this.instances));
  }

  async saveTypes() {
      if (this.useLocalStorage) {
          this.saveTypesLocal();
      } else {
          // Save to Supabase
          await supabaseClient.from('client').update({
              hierarchy: this.types
          }).eq('id', this.clientId);
      }
  }

  render() {
      const styles = `
        /* Styles for the component */
        .container {
          display: flex;
          flex-direction: column;
          height: 100vh;
        }
        .main-tabs {
          display: flex;
          background-color: #f1f1f1;
          cursor: pointer;
        }
        .main-tabs div {
          padding: 14px 16px;
          flex: 1;
          text-align: center;
          border-bottom: 2px solid transparent;
        }
        .main-tabs div.active {
          border-bottom: 2px solid #0078D7;
          font-weight: bold;
        }
        .panel {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .column-container {
          display: flex;
          flex: 1;
          overflow-y: auto;
        }
        .column {
          flex: 1;
          padding: 10px;
          overflow-y: auto;
        }
        .hierarchy-tabs {
          display: flex;
          background-color: #f9f9f9;
          border-bottom: 1px solid #ccc;
        }
        .hierarchy-tabs div {
          padding: 10px 15px;
          cursor: pointer;
          border: 1px solid #ccc;
          border-bottom: none;
          background-color: #f9f9f9;
          margin-right: 2px;
        }
        .hierarchy-tabs div.active {
          background-color: #fff;
          border-bottom: 1px solid #fff;
          font-weight: bold;
        }
        .hierarchy-content {
          flex: 1;
          overflow-y: auto;
          padding: 10px;
        }
        .instances-table-container {
          overflow-x: auto;
        }
        .instances-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .instances-table th, .instances-table td {
          border: 1px solid #ddd;
          padding: 8px;
        }
        .instances-table th {
          background-color: #f2f2f2;
        }
        .form-group {
          margin-bottom: 10px;
        }
        label {
          display: block;
          margin-bottom: 4px;
        }
        input[type="text"], select {
          width: 100%;
          padding: 6px;
          box-sizing: border-box;
        }
        button {
          padding: 8px 12px;
          cursor: pointer;
        }
        /* Additional styles for tree and graph */
        .tree ul {
          list-style-type: none;
          padding-left: 20px;
        }
        .tree li {
          margin: 4px 0;
          position: relative;
        }
        .tree li::before {
          content: '';
          position: absolute;
          top: 14px;
          left: -20px;
          border-left: 1px solid #ccc;
          height: 100%;
        }
        .tree li::after {
          content: '';
          position: absolute;
          top: 14px;
          left: -20px;
          border-top: 1px solid #ccc;
          width: 20px;
        }
        .tree li:first-child::before {
          top: 14px;
          height: 50%;
        }
        .tree li:last-child::before {
          height: 14px;
        }
        .tree span {
          padding: 4px 8px;
          border-radius: 4px;
          background-color: #e9e9e9;
          cursor: pointer;
          display: inline-block;
        }
      `;
      const html = `
        <div class="container">
          <div class="main-tabs">
            <div class="${this.currentMainTab === 'types' ? 'active' : ''}" id="tab-types">Hierarchy</div>
            <div class="${this.currentMainTab === 'hierarchy' ? 'active' : ''}" id="tab-hierarchy">Organizations</div>
          </div>
          <div class="panel">
            ${this.currentMainTab === 'types' ? this.renderTypesTab() : this.renderHierarchyTab()}
          </div>
        </div>
      `;
      this.shadowRoot.innerHTML = `<style>${styles}</style>${html}`;
      this.addTopEventListeners();
      if (this.currentMainTab === 'types') {
        this.addTypeEventListeners();
      }
      if (this.currentMainTab === 'hierarchy') {
        this.addInstanceEventListeners();
      }
  }

  renderTypesTab() {
      return `
        <div class="column-container">
          <div class="column">
            <h3>Create Organization Type</h3>
            <div class="form-group">
              <label for="type-name">Name:</label>
              <input type="text" id="type-name" />
            </div>
            <div class="form-group">
              <label for="type-parents">Parent Types:</label>
              <select id="type-parents" multiple>
                ${this.types.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="type-data-access">Data Access Mode:</label>
              <select id="type-data-access">
                <option value="own">Own</option>
                <option value="children">Children</option>
                <option value="descendants">Descendants</option>
              </select>
            </div>
            <div class="form-group">
              <label for="type-color">Color:</label>
              <select id="type-color">
                <option value="white">White</option>
                <option value="red">Red</option>
                <option value="orange">Orange</option>
                <option value="yellow">Yellow</option>
                <option value="green">Green</option>
                <option value="blue">Blue</option>
                <option value="violet">Violet</option>
                <option value="brown">Brown</option>
                <option value="black">Black</option>
              </select>
            </div>
            <button id="create-type-btn">Create Type</button>
          </div>
          <div class="column">
            <h3>Organization Types</h3>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Parents</th>
                  <th>Data Access</th>
                  <th>Color</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${this.types.map(t => `
                  <tr data-id="${t.id}">
                    <td contenteditable="true" class="edit-name">${t.name}</td>
                    <td>${t.parent.map(pid => this.getTypeName(pid)).join(', ')}</td>
                    <td>${t.data_access}</td>
                    <td>${t.color}</td>
                    <td><button class="delete-type-btn">Delete</button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
  }

  renderHierarchyTab() {
      return `
        <div class="hierarchy-tabs">
          <div class="${this.currentHierarchyTab === 'table' ? 'active' : ''}" id="tab-table">Table</div>
          <div class="${this.currentHierarchyTab === 'tree' ? 'active' : ''}" id="tab-tree">Tree</div>
          <div class="${this.currentHierarchyTab === 'graph' ? 'active' : ''}" id="tab-graph">Graph</div>
        </div>
        <div class="hierarchy-content">
          ${this.currentHierarchyTab === 'table' ? this.renderInstancesTab()
              : this.currentHierarchyTab === 'tree' ? this.renderTreeTab()
                  : '<div id="graph"></div>'}
        </div>
      `;
  }

  renderInstancesTab() {
      return `
        <div class="column-container">
          <div class="column">
            <h3>Create Organization Instance</h3>
            <div class="form-group">
              <label for="instance-name">Name:</label>
              <input type="text" id="instance-name" />
            </div>
            <div class="form-group">
              <label for="instance-type">Type:</label>
              <select id="instance-type">
                ${this.types.map(t => `
                  <option value="${t.id}" ${t.id === this.selectedInstanceType ? 'selected' : ''}>${t.name}</option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="instance-parent">Parent:</label>
              <select id="instance-parent">
                ${this.getParentOptions()}
              </select>
            </div>
            <button id="create-instance-btn">Create Instance</button>
          </div>
          <div class="column">
            <h3>Organization Instances</h3>
            <div class="instances-table-container">
              <table class="instances-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Parent</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${this.instances.map(inst => `
                    <tr data-id="${inst.id}">
                      <td contenteditable="true" class="edit-instance-name">${inst.name}</td>
                      <td>${this.renderInstanceTypeSelect(inst)}</td>
                      <td>${this.renderInstanceParentSelect(inst)}</td>
                      <td><button class="delete-instance-btn">Delete</button></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
  }

  getTypeName(typeId) {
      const type = this.types.find(t => t.id === typeId);
      return type ? type.name : '';
  }

  getParentOptions(selectedTypeId = null, excludeInstanceId = null) {
      // Get the selected type
      selectedTypeId = selectedTypeId || this.selectedInstanceType || 'root';
      const selectedType = this.types.find(t => t.id === selectedTypeId);
      if (!selectedType) return '<option value="">None</option>';
      // Get parent types
      const parentTypeIds = selectedType.parent;
      const parentInstances = this.instances.filter(inst =>
          parentTypeIds.includes(inst.type) && inst.id !== excludeInstanceId
      );
      let options = '';
      if (parentInstances.length === 0) {
          options = '<option value="">None</option>';
      } else {
          let firstOption = true;
          parentInstances.forEach(inst => {
              options += `<option value="${inst.id}" ${firstOption ? 'selected' : ''}>${inst.name}</option>`;
              firstOption = false;
          });
      }
      return options;
  }

  buildHierarchy() {
      // Build hierarchy tree from instances
      const instanceMap = {};
      this.instances.forEach(inst => {
          instanceMap[inst.id] = { ...inst, children: [] };
      });
      const roots = [];
      this.instances.forEach(inst => {
          if (inst.parent_organization_id) {
              const parent = instanceMap[inst.parent_organization_id];
              if (parent) {
                  parent.children.push(instanceMap[inst.id]);
              }
          } else {
              roots.push(instanceMap[inst.id]);
          }
      });
      return roots;
  }

  renderTreeTab() {
      const hierarchy = this.buildHierarchy();
      return `
        <div class="tree">
          ${this.renderTree(hierarchy)}
        </div>
      `;
  }

  renderTree(nodes) {
      if (!nodes || nodes.length === 0) return '';
      return `<ul>
        ${nodes.map(node => `
          <li>
            <span style="background-color: ${this.getTypeColor(node.type)}">${node.name}</span>
            ${this.renderTree(node.children)}
          </li>
        `).join('')}
      </ul>`;
  }

  getTypeColor(typeId) {
      const type = this.types.find(t => t.id === typeId);
      return type ? type.color : 'grey';
  }

  renderInstanceTypeSelect(inst) {
      return `<select class="edit-instance-type">
        ${this.types.map(t => `
          <option value="${t.id}" ${t.id === inst.type ? 'selected' : ''}>${t.name}</option>
        `).join('')}
      </select>`;
  }

  renderInstanceParentSelect(inst) {
      const selectedType = this.types.find(t => t.id === inst.type);
      const parentTypeIds = selectedType ? selectedType.parent : [];
      const parentInstances = this.instances.filter(i => parentTypeIds.includes(i.type) && i.id !== inst.id);
      let options = '<option value="">None</option>';
      parentInstances.forEach(pInst => {
          options += `<option value="${pInst.id}" ${pInst.id === inst.parent_organization_id ? 'selected' : ''}>${pInst.name}</option>`;
      });
      return `<select class="edit-instance-parent">${options}</select>`;
  }
  
  // Utility function to safely add event listeners
  addEventListenerIfExists = (selector, event, handler) => {
        const element = this.shadowRoot.querySelector(selector);
        if (element) {
            element.addEventListener(event, handler);
        }
        else {
          console.warn('No element found for selector:', selector);
        }
    };

  addTopEventListeners() {
      // Main Tabs
    this.addEventListenerIfExists('#tab-types', 'click', () => {
        this.currentMainTab = 'types';
        this.render();
    });

    this.addEventListenerIfExists('#tab-hierarchy', 'click', () => {
        this.currentMainTab = 'hierarchy';
        this.render();
    });
  }

  addTypeEventListeners() {
    
      // Create Type
      this.addEventListenerIfExists('#create-type-btn', 'click', async () => {
        const name = this.shadowRoot.querySelector('#type-name').value.trim();
        if (!name) {
            alert('Name is required');
            return;
        }
        const parents = Array.from(this.shadowRoot.querySelector('#type-parents').selectedOptions).map(opt => opt.value);
        const dataAccess = this.shadowRoot.querySelector('#type-data-access').value;
        const color = this.shadowRoot.querySelector('#type-color').value;
        const id = name.toLowerCase().replace(/\s+/g, '_');
        if (this.types.some(t => t.name === name)) {
            alert('Type with this name already exists');
            return;
        }
        this.types.push({ id, name, parent: parents, data_access: dataAccess, color });
        await this.saveTypes();
        this.render();
    });

    // Delete Type
    this.shadowRoot.querySelectorAll('.delete-type-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.closest('tr').dataset.id;
            const type = this.types.find(t => t.id === id);
            if (confirm(`Are you sure you want to delete the organization type "${type.name}"? This action cannot be undone.`)) {
                this.types = this.types.filter(t => t.id !== id);
                await this.saveTypes();
                this.render();
            }
        });
    });

    // Edit Type Name
    this.shadowRoot.querySelectorAll('.edit-name').forEach(cell => {
        cell.addEventListener('blur', async (e) => {
            const id = e.target.closest('tr').dataset.id;
            const type = this.types.find(t => t.id === id);
            if (type) {
                type.name = e.target.textContent.trim();
                await this.saveTypes();
            }
        });
    });

  }


   addInstanceEventListeners(){
      // Hierarchy Tabs
      this.addEventListenerIfExists('#tab-table', 'click', () => {
          this.currentHierarchyTab = 'table';
          this.render();
      });

      this.addEventListenerIfExists('#tab-tree', 'click', () => {
          this.currentHierarchyTab = 'tree';
          this.render();
      });

      this.addEventListenerIfExists('#tab-graph', 'click', () => {
          this.currentHierarchyTab = 'graph';
          this.render();
          this.renderGraph();
      });

      // Create Instance
      this.addEventListenerIfExists('#create-instance-btn', 'click', async () => {
          const name = this.shadowRoot.querySelector('#instance-name').value.trim();
          if (!name) {
              alert('Name is required');
              return;
          }
          const type = this.shadowRoot.querySelector('#instance-type').value;
          const parentId = this.shadowRoot.querySelector('#instance-parent').value || null;

          const newInstance = { name, type, parent_organization_id: parentId,client_id: this.clientId };

          if (this.useLocalStorage) {
              this.instances.push(newInstance);
              this.selectedInstanceType = type;
              this.saveInstancesLocal();
              this.render();
          } else {
              // Save to Supabase
              const { data, error } = await supabaseClient.from('organization').insert(newInstance);
              if (error) {
                  console.error('Error inserting organization:', error);
                  alert('Error creating organization');
                  return;
              }
              this.instances.push(newInstance);
              this.selectedInstanceType = type;
              this.render();
          }
      });

      // Update Parent Options when Type changes
      this.addEventListenerIfExists('#instance-type', 'change', (e) => {
          this.selectedInstanceType = e.target.value;
          const parentSelect = this.shadowRoot.querySelector('#instance-parent');
          parentSelect.innerHTML = this.getParentOptions(e.target.value);
      });

      // Instances Table - Inline Editing and Deletion
      const instanceTable = this.shadowRoot.querySelector('table.instances-table');
      if (instanceTable) {
          // Edit Instance Name
          instanceTable.querySelectorAll('.edit-instance-name').forEach(cell => {
              cell.addEventListener('blur', async (e) => {
                  const id = parseInt(e.target.closest('tr').dataset.id);
                  const instance = this.instances.find(inst => inst.id === id);
                  if (instance) {
                      instance.name = e.target.textContent.trim();
                      if (this.useLocalStorage) {
                          this.saveInstancesLocal();
                      } else {
                          // Update in Supabase
                          const { data, error } = await supabaseClient.from('organization').update({
                              name: instance.name
                          }).eq('id', id);
                          if (error) {
                              console.error('Error updating organization name:', error);
                              alert('Error updating organization name');
                          }
                      }
                      // No need to re-render as the change is inline
                  }
              });
          });

          // Edit Instance Type
          instanceTable.querySelectorAll('.edit-instance-type').forEach(select => {
              select.addEventListener('change', async (e) => {
                  const id = e.target.closest('tr').dataset.id;
                  const instance = this.instances.find(inst => inst.id === id);
                  if (instance) {
                      instance.type = e.target.value;
                      // Update the parent select options
                      const parentSelect = e.target.closest('tr').querySelector('.edit-instance-parent');
                      const selectedType = this.types.find(t => t.id === instance.type);
                      const parentTypeIds = selectedType ? selectedType.parent : [];
                      const parentInstances = this.instances.filter(i => parentTypeIds.includes(i.type) && i.id !== instance.id);
                      let options = '<option value="">None</option>';
                      parentInstances.forEach(pInst => {
                          options += `<option value="${pInst.id}" ${pInst.id === instance.parent_organization_id ? 'selected' : ''}>${pInst.name}</option>`;
                      });
                      parentSelect.innerHTML = options;
                      // Reset parent if it's no longer compatible
                      if (instance.parent_organization_id && !parentTypeIds.includes(this.instances.find(i => i.id === instance.parent_organization_id).type)) {
                          instance.parent_organization_id = null;
                          parentSelect.value = '';
                      }
                      if (this.useLocalStorage) {
                          this.saveInstancesLocal();
                      } else {
                          // Update in Supabase
                          const { data, error } = await supabaseClient.from('organization').update({
                              type: instance.type,
                              parent_organization_id: instance.parent_organization_id
                          }).eq('id', id);
                          if (error) {
                              console.error('Error updating organization type:', error);
                              alert('Error updating organization type');
                          }
                      }
                      // No need to re-render as the change is inline
                  }
              });
          });

          // Edit Instance Parent
          instanceTable.querySelectorAll('.edit-instance-parent').forEach(select => {
              select.addEventListener('change', async (e) => {
                  const id = parseInt(e.target.closest('tr').dataset.id);
                  const instance = this.instances.find(inst => inst.id === id);
                  if (instance) {
                      const parentId = e.target.value || null;
                      instance.parent_organization_id = parentId;
                      if (this.useLocalStorage) {
                          this.saveInstancesLocal();
                      } else {
                          // Update in Supabase
                          const { data, error } = await supabaseClient.from('organization').update({
                              parent_organization_id: parentId
                          }).eq('id', id);
                          if (error) {
                              console.error('Error updating organization parent:', error);
                              alert('Error updating organization parent');
                          }
                      }
                  }
              });
          });

          // Delete Instance
          instanceTable.querySelectorAll('.delete-instance-btn').forEach(btn => {
              btn.addEventListener('click', async (e) => {
                  const id = parseInt(e.target.closest('tr').dataset.id);
                  const instance = this.instances.find(inst => inst.id === id);
                  if (confirm(`Are you sure you want to delete the organization "${instance.name}"? This action cannot be undone.`)) {
                      if (this.useLocalStorage) {
                          this.instances = this.instances.filter(inst => inst.id !== id);
                          this.saveInstancesLocal();
                      } else {
                          // Delete from Supabase
                          const { data, error } = await supabaseClient.from('organization').delete().eq('id', id);
                          if (error) {
                              console.error('Error deleting organization:', error);
                              alert('Error deleting organization');
                              return;
                          }
                          this.instances = this.instances.filter(inst => inst.id !== id);
                      }
                      this.render();
                  }
              });
          });
      }
  }

  renderGraph() {
      // Use D3.js to render the graph
      const container = this.shadowRoot.querySelector('#graph');
      container.innerHTML = ''; // Clear previous content
      const width = container.clientWidth || 600;
      const height = 400;
      const svg = d3.select(container)
          .append('svg')
          .attr('width', width)
          .attr('height', height);

      // Build data
      const nodes = this.instances.map(inst => ({
          id: inst.id,
          name: inst.name,
          type: inst.type,
          color: this.getTypeColor(inst.type),
      }));
      const links = this.instances
          .filter(inst => inst.parent_organization_id)
          .map(inst => ({
              source: inst.parent_organization_id,
              target: inst.id
          }));

      const simulation = d3.forceSimulation(nodes)
          .force('link', d3.forceLink(links).id(d => d.id).distance(100))
          .force('charge', d3.forceManyBody().strength(-400))
          .force('center', d3.forceCenter(width / 2, height / 2));

      const link = svg.append('g')
          .selectAll('line')
          .data(links)
          .join('line')
          .attr('stroke', '#999');

      const node = svg.append('g')
          .selectAll('circle')
          .data(nodes)
          .join('circle')
          .attr('r', 20)
          .attr('fill', d => d.color)
          .call(drag(simulation));

      const label = svg.append('g')
          .selectAll('text')
          .data(nodes)
          .join('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '.35em')
          .text(d => d.name);

      simulation.on('tick', () => {
          // Update positions
          link
              .attr('x1', d => d.source.x)
              .attr('y1', d => d.source.y)
              .attr('x2', d => d.target.x)
              .attr('y2', d => d.target.y);

          node
              .attr('cx', d => d.x)
              .attr('cy', d => d.y);

          label
              .attr('x', d => d.x)
              .attr('y', d => d.y);
      });

      function drag(simulation) {
          function dragstarted(event, d) {
              if (!event.active) simulation.alphaTarget(0.3).restart();
              d.fx = d.x;
              d.fy = d.y;
          }
          function dragged(event, d) {
              d.fx = event.x;
              d.fy = event.y;
          }
          function dragended(event, d) {
              if (!event.active) simulation.alphaTarget(0);
              d.fx = null;
              d.fy = null;
          }
          return d3.drag()
              .on('start', dragstarted)
              .on('drag', dragged)
              .on('end', dragended);
      }
  }
}

customElements.define('organization-manager', OrganizationManager);
