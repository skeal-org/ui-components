class SecretManager extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.loadSecrets();
        this.shadowRoot.querySelector('#secrets-form').addEventListener('submit', this.saveSecret.bind(this));
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                .secret-item {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 5px;
                }
                .secret-item button {
                    margin-left: 10px;
                }
                .secret-form {
                    margin-bottom: 20px;
                }
            </style>
            <h2>Manage Secrets</h2>
            <form id="secrets-form" class="secret-form">
                <label for="secret-key">Key:</label>
                <input type="text" id="secret-key" placeholder="Key" value="openai_api_key" readonly required>
                <label for="secret-value">Value:</label>
                <input type="password" id="secret-value" placeholder="Enter API Key" required>
                <button type="submit">Save</button>
            </form>
            <h3>Stored Secrets</h3>
            <div id="secrets-list"></div>
        `;
    }

    loadSecrets() {
        const secretsList = this.shadowRoot.querySelector('#secrets-list');
        secretsList.innerHTML = '';

        const apiKey = localStorage.getItem('openai_api_key');
        if (apiKey) {
            const secretItem = document.createElement('div');
            secretItem.classList.add('secret-item');
            secretItem.innerHTML = `
                <span>openai_api_key: ****${apiKey.slice(-4)}</span>
                <button id="delete-secret">Delete</button>
            `;
            secretItem.querySelector('#delete-secret').addEventListener('click', () => {
                localStorage.removeItem('openai_api_key');
                this.loadSecrets();
            });
            secretsList.appendChild(secretItem);
        } else {
            secretsList.innerHTML = `<p>No secrets stored.</p>`;
        }
    }

    saveSecret(event) {
        event.preventDefault();
        const apiKey = this.shadowRoot.querySelector('#secret-value').value;
        localStorage.setItem('openai_api_key', apiKey);
        this.shadowRoot.querySelector('#secrets-form').reset();
        this.loadSecrets();
    }

    // Expose a method to get a stored secret
    getSecret(key) {
        return localStorage.getItem(key);
    }
}

customElements.define('secret-manager', SecretManager);
