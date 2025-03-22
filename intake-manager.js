class IntakeManager extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        // Basic pagination settings
        this.currentPage = 1;
        this.pageSize = 5;
        this.existingDatesSet = new Set(); // store highlighted dates
    }

    connectedCallback() {
        // Render HTML structure into shadow root
        this.render();

        // Load client options immediately
        this.loadClientsIntoCombo();



        // When user changes client, re-init the datepicker
        this.shadowRoot.querySelector('#client_id').addEventListener('change', () => {
            this.currentPage = 1;
            this.initDatepicker();
        });

        // Filter form => load intakes
        this.shadowRoot
            .querySelector('#filter-form')
            .addEventListener('submit', (e) => {
                e.preventDefault();
                this.currentPage = 1;
                this.loadIntakes();
            });

        // Pagination buttons
        this.shadowRoot
            .querySelector('#prev-btn')
            .addEventListener('click', () => this.changePage(-1));
        this.shadowRoot
            .querySelector('#next-btn')
            .addEventListener('click', () => this.changePage(1));

        // Detail form => update real intake
        this.shadowRoot
            .querySelector('#detail-form')
            .addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateRealIntake();
            });
    }

    // ----------------------------------------------------------------
    // 1) LOAD CLIENTS INTO COMBOBOX
    // ----------------------------------------------------------------
    async loadClientsIntoCombo() {
        try {
            const { data, error } = await supabaseClient
                .from('client')
                .select('id, name')
                .order('name', { ascending: true });

            if (error) {
                console.error('Error loading clients:', error);
                return;
            }

            const select = this.shadowRoot.querySelector('#client_id');
            select.innerHTML = '';
            data.forEach((client) => {
                const option = document.createElement('option');
                option.value = client.id;
                option.textContent = client.name;
                select.appendChild(option);
            });

            // Once clients are loaded, initialize the datepicker for the first client
            if (data.length > 0) {
                this.initDatepicker();
            }
        } catch (err) {
            console.error('Unexpected error loading clients:', err);
        }
    }

    highlightArrows(instance) {
        // 1) Clear old highlights
        const prevArrow = instance.calendarContainer.querySelector('.flatpickr-prev-month');
        const nextArrow = instance.calendarContainer.querySelector('.flatpickr-next-month');
        prevArrow?.classList.remove('green-highlight');
        nextArrow?.classList.remove('green-highlight');

        // 2) Compute the month index currently displayed
        const currentMonthIndex = instance.currentYear * 12 + instance.currentMonth;
        let hasEarlierMonth = false;
        let hasLaterMonth = false;

        // 3) Check each date in existingDatesSet
        for (const dateStr of this.existingDatesSet) {
            // Parse "YYYY-MM-DD" 
            const [yyyy, mm] = dateStr.split('-');
            const yearNum = parseInt(yyyy, 10);
            const monthNum = parseInt(mm, 10);
            const dateMonthIndex = yearNum * 12 + (monthNum - 1);

            if (dateMonthIndex < currentMonthIndex) {
                hasEarlierMonth = true;
            }
            if (dateMonthIndex > currentMonthIndex) {
                hasLaterMonth = true;
            }
            // If both are true already, no need to keep checking
            if (hasEarlierMonth && hasLaterMonth) break;
        }

        // 4) Highlight the arrows if there's data in an earlier or later month
        if (hasEarlierMonth) {
            prevArrow?.classList.add('green-highlight');
        }
        if (hasLaterMonth) {
            nextArrow?.classList.add('green-highlight');
        }
    }

    async initDatepicker() {
        const clientId = this.shadowRoot.querySelector('#client_id').value;
        if (!clientId) return;

        // 1) Fetch the dates from Supabase for this client
        try {
            const { data, error } = await supabaseClient
                .from('v_intake_menu_dates')  // or your table
                .select('menu_date')
                .eq('client_id', clientId);

            if (error) {
                console.error('Error fetching menu_date:', error);
                this.existingDatesSet.clear();
            } else {
                const dateStrings = data.map(item => item.menu_date);
                this.existingDatesSet = new Set(dateStrings);
            }
        } catch (err) {
            console.error(err);
            this.existingDatesSet.clear();
        }

        // 2) Initialize Flatpickr on the #menu_date input
        const input = this.shadowRoot.querySelector('#menu_date');

        // If we already have a flatpickr instance, destroy it so we can re-init
        if (input._flatpickr) {
            input._flatpickr.destroy();
        }

        // 3) Create a new flatpickr instance
        flatpickr(input, {
            dateFormat: 'Y-m-d', // "YYYY-MM-DD"
            onDayCreate: (selectedDates, dateStr, instance, dayElem) => {
                // Safety check
                if (!dayElem || !dayElem.dateObj) return;

                // Convert dayElem.dateObj (a JS Date) -> "YYYY-MM-DD"
                const cellDate = dayElem.dateObj;
                const year = cellDate.getFullYear();
                const month = String(cellDate.getMonth() + 1).padStart(2, '0');
                const day = String(cellDate.getDate()).padStart(2, '0');
                const cellDateString = `${year}-${month}-${day}`;

                // Now check if this date is in your set
                if (this.existingDatesSet.has(cellDateString)) {
                    dayElem.classList.add('green-highlight');
                }
            },

            // 2) Highlight arrows initially
            onReady: (selectedDates, dateStr, instance) => {
                this.highlightArrows(instance);
            },

            // 3) Also highlight arrows after user navigates months
            onMonthChange: (selectedDates, dateStr, instance) => {
                this.highlightArrows(instance);
            },
        });
    }

    // ----------------------------------------------------------------
    // 3) LOAD INTAKES (FILTER + PAGINATION)
    // ----------------------------------------------------------------
    async loadIntakes() {
        const clientId = this.shadowRoot.querySelector('#client_id').value;
        const menuDate = this.shadowRoot.querySelector('#menu_date').value;

        // Pagination bounds
        const from = (this.currentPage - 1) * this.pageSize;
        const to = from + this.pageSize - 1;

        // Build query
        let query = supabaseClient
            .from('intake')
            .select(`
        id,
        resident:resident_id (
          id,
          client_id
        ),
        menu_date,
        served_picture,
        cleared_picture,
        estimated_intake_percent,
        real_intake_percent
      `)
            .range(from, to)
            .eq('resident.client_id', clientId);

        if (menuDate) {
            query = query.eq('menu_date', menuDate);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error loading intakes:', error);
            return;
        }

        this.renderIntakeTable(data);
        this.updatePageInfo(data.length);
    }

    // ----------------------------------------------------------------
    // 4) RENDER INTAKES IN TABLE
    // ----------------------------------------------------------------
    renderIntakeTable(intakes) {
        const tbody = this.shadowRoot.querySelector('.intake-table tbody');
        tbody.innerHTML = intakes
            .map(
                (item) => `
        <tr>
          <td>${item.id}</td>
          <!-- FIX: display item.resident?.id, since resident is { id, client_id } -->
          <td>${item.resident?.id ?? ''}</td>
          <td>${item.estimated_intake_percent ?? ''}</td>
          <td>${item.real_intake_percent ?? ''}</td>
          <td>
            <button class="view-btn" data-id="${item.id}">View</button>
          </td>
        </tr>
      `
            )
            .join('');

        // Attach "View" button events
        this.shadowRoot.querySelectorAll('.view-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const intakeId = e.target.dataset.id;
                this.viewIntakeDetail(intakeId);
            });
        });
    }

    // ----------------------------------------------------------------
    // 5) PAGINATION
    // ----------------------------------------------------------------
    changePage(direction) {
        if (direction < 0 && this.currentPage > 1) {
            this.currentPage--;
            this.loadIntakes();
        } else if (direction > 0) {
            this.currentPage++;
            this.loadIntakes();
        }
    }

    updatePageInfo(countOnPage) {
        const info = this.shadowRoot.querySelector('#page-info');
        info.textContent = `Page ${this.currentPage} — Showing ${countOnPage} record(s).`;
    }

    // ----------------------------------------------------------------
    // 6) VIEW INTAKE DETAIL
    // ----------------------------------------------------------------
    async viewIntakeDetail(intakeId) {
        try {
            const { data, error } = await supabaseClient
                .from('intake')
                .select(`
          id,
          served_picture,
          cleared_picture,
          estimated_intake_percent,
          real_intake_percent
        `)
                .eq('id', intakeId)
                .single();

            if (error) {
                console.error('Error fetching intake detail:', error);
                return;
            }

            // Populate detail section
            this.shadowRoot.querySelector('#detail-intake-id').textContent = data.id;
            this.shadowRoot.querySelector('#served-img').src =
                data.served_picture || '';
            this.shadowRoot.querySelector('#cleared-img').src =
                data.cleared_picture || '';
            this.shadowRoot.querySelector('#estimated-intake-percent').textContent =
                data.estimated_intake_percent ?? '';

            // FIX: store .id not .intake_id
            this.shadowRoot.querySelector('#detail-form').dataset.intakeId = data.id;

            this.shadowRoot.querySelector('#real_intake_percent').value =
                data.real_intake_percent ?? '';

            // Show the detail panel
            this.shadowRoot.querySelector('#detail-panel').style.display = 'block';
        } catch (err) {
            console.error('Unexpected error fetching detail:', err);
        }
    }

    // ----------------------------------------------------------------
    // 7) UPDATE REAL INTAKE
    // ----------------------------------------------------------------
    async updateRealIntake() {
        const detailForm = this.shadowRoot.querySelector('#detail-form');
        const intakeId = detailForm.dataset.intakeId;
        if (!intakeId) {
            console.error('No intake ID set for updating real intake.');
            return;
        }

        const realIntake = this.shadowRoot.querySelector(
            '#real_intake_percent'
        ).value;

        try {
            const { error } = await supabaseClient
                .from('intake')
                .update({ real_intake_percent: realIntake })
                .eq('id', intakeId);

            if (error) {
                console.error('Error updating real intake percent:', error);
                alert('Failed to update intake.');
                return;
            }

            alert('Real intake updated successfully!');
            // Optionally refresh the list
            this.loadIntakes();
        } catch (err) {
            console.error('Unexpected error updating intake:', err);
        }
    }

    // ----------------------------------------------------------------
    // 8) RENDER THE COMPONENT
    // ----------------------------------------------------------------
    render() {
        this.shadowRoot.innerHTML = `
      <style>
        .intake-table {
          width: 100%;
          border-collapse: collapse;
        }
        .intake-table th, .intake-table td {
          border: 1px solid #ddd;
          padding: 8px;
          vertical-align: top;
        }
        .intake-table th {
          background-color: #f2f2f2;
        }
        #detail-panel {
          margin-top: 1rem;
          padding: 1rem;
          border: 1px solid #ccc;
          display: none; /* hidden by default */
        }
        .image-container {
          display: flex;
          gap: 40px;
          margin-bottom: 1rem;
        }
        .image-block {
          text-align: center;
        }
        .image-block img {
          max-width: 200px;
          display: block;
          margin: 0 auto;
        }
      </style>

      <h2>Intake Manager</h2>

      <!-- Filter Form -->
      <form id="filter-form">
        <label for="client_id">Client:</label>
        <select id="client_id"></select>

        <!-- We use text input for jQuery UI Datepicker -->
        <label for="menu_date">Menu Date:</label>
        <input type="text" id="menu_date" />

        <button type="submit">Search</button>
      </form>

      <!-- Table of Intakes -->
      <table class="intake-table">
        <thead>
          <tr>
            <th>Intake ID</th>
            <th>Resident ID</th>
            <th>Estimated %</th>
            <th>Real %</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>

      <!-- Pagination -->
      <div>
        <button id="prev-btn">Previous</button>
        <span id="page-info"></span>
        <button id="next-btn">Next</button>
      </div>

      <!-- Detail Panel -->
      <div id="detail-panel">
        <h3>Intake Detail (<span id="detail-intake-id"></span>)</h3>
        <div class="image-container">
          <div class="image-block">
            <h4>Served</h4>
            <img id="served-img" alt="Served" />
          </div>
          <div class="image-block">
            <h4>Cleared</h4>
            <img id="cleared-img" alt="Cleared" />
          </div>
        </div>

        <p>
          Estimated Intake Percent:
          <strong id="estimated-intake-percent"></strong>%
        </p>

        <form id="detail-form">
          <label for="real_intake_percent">Real Intake Percent:</label>
          <input
            type="number"
            id="real_intake_percent"
            name="real_intake_percent"
            min="0"
            max="100"
          />
          <button type="submit">Save</button>
        </form>
      </div>
    `;
    }
}

customElements.define('intake-manager', IntakeManager);

