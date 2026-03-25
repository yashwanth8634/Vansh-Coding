// public/js/admin.js
document.addEventListener('DOMContentLoaded', () => {

  // --- Tab Switching Logic ---
  const tabButtons = document.querySelectorAll('[data-tab]');
  const tabPanels = document.querySelectorAll('.tab-panel');

  function switchTab(tabName) {
    // Update nav buttons (only those inside the tab bar)
    document.querySelectorAll('.flex.space-x-1 > [data-tab]').forEach(btn => {
      if (btn.dataset.tab === tabName) {
        btn.classList.add('active');
        btn.classList.remove('text-gray-500');
      } else {
        btn.classList.remove('active');
        btn.classList.add('text-gray-500');
      }
    });
    // Show/hide panels via inline style (immune to CSS overrides)
    tabPanels.forEach(panel => {
      if (panel.id === `tab-${tabName}`) {
        panel.style.display = 'block';
        panel.style.animation = 'fadeIn 0.25s ease-out';
      } else {
        panel.style.display = 'none';
      }
    });
    // Update URL hash (without scrolling)
    history.replaceState(null, '', `#${tabName}`);
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Don't prevent default for anchor tags but handle tab switching
      switchTab(btn.dataset.tab);
    });
  });

  // Restore tab from URL hash on load
  const hash = window.location.hash.replace('#', '');
  if (hash && document.getElementById(`tab-${hash}`)) {
    switchTab(hash);
  }

  // --- Get All Elements ---
  const testForm = document.getElementById('create-test-form');
  const testResultDiv = document.getElementById('test-link-result');
  const logoutBtn = document.getElementById('logout-btn');
  
  const bankForm = document.getElementById('create-bank-form');
  const bankTitleInput = document.getElementById('bank-title');
  const bankResultDiv = document.getElementById('bank-result-message');
  
  // --- NEW: Get Bank List Container ---
  const bankListContainer = document.getElementById('bank-list-container');


  // --- Handle Create Question Bank Form ---
  if (bankForm) {
    bankForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      bankResultDiv.textContent = ''; 
      const title = bankTitleInput.value.trim();
      const submitBtn = bankForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating...';
      // ... (rest of this function is the same) ...
      
      try {
        const response = await fetch('/api/banks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title }),
        });
        const result = await response.json();
        if (response.ok) {
          window.location.href = `/admin/bank/${result._id}`;
        } else {
          bankResultDiv.innerHTML = `<strong class="text-red-600">Error: ${result.message}</strong>`;
        }
      } catch (error) {
        bankResultDiv.innerHTML = `<strong class="text-red-600">Network error: ${error.message}</strong>`;
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create and Add Questions';
      }
    });
  }

  // --- Handle Create Test Form ---
  if (testForm) {
    // ... (this function remains exactly the same) ...
    testForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      testResultDiv.style.display = 'none';
      testResultDiv.textContent = '';
      const submitBtn = testForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating...';
      const data = {
        questionBankId: document.getElementById('bank-select').value,
        numQuestions: document.getElementById('num-questions').value,
        duration: document.getElementById('duration').value,
        linkExpiryHours: document.getElementById('expiry').value,
      };
      if (!data.questionBankId) {
          testResultDiv.innerHTML = `<strong class="text-red-600">Error: Please select a question bank.</strong>`;
          testResultDiv.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create Test Link';
          return;
      }
      try {
        const response = await fetch('/api/tests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await response.json();
        testResultDiv.style.display = 'block';
        if (response.ok) {
          const fullLink = `${window.location.origin}${result.link}`;
          testResultDiv.innerHTML = `
            <strong class="text-green-600">Test Created!</strong>
            <p class="mt-2">Share this link:</p>
            <input id="latest-test-link" type="text" value="${fullLink}" readonly class="w-full p-2 border border-gray-300 rounded-md bg-gray-100 mt-1">
            <button id="copy-latest-link" type="button" class="mt-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800">Copy Link</button>
          `;
          const copyBtn = document.getElementById('copy-latest-link');
          if (copyBtn) {
            copyBtn.addEventListener('click', async () => {
              const input = document.getElementById('latest-test-link');
              try {
                await navigator.clipboard.writeText(input.value);
                copyBtn.textContent = 'Copied!';
                setTimeout(() => {
                  copyBtn.textContent = 'Copy Link';
                }, 1200);
              } catch {
                input.select();
                document.execCommand('copy');
              }
            });
          }
        } else {
          testResultDiv.innerHTML = `<strong class="text-red-600">Error: ${result.message}</strong>`;
        }
      } catch (error) {
        testResultDiv.style.display = 'block';
        testResultDiv.innerHTML = `<strong class="text-red-600">Network error: ${error.message}</strong>`;
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Test Link';
      }
    });
  }

  // --- Handle Logout Button ---
  if (logoutBtn) {
    // ... (this function remains exactly the same) ...
    logoutBtn.addEventListener('click', async () => {
      try {
        const res = await fetch('/api/admin/logout', { method: 'POST' });
        if (res.ok) {
          window.location.href = '/login';
        }
      } catch (err) {
        console.error('Logout failed:', err);
      }
    });
  }

  // --- NEW: Handle Delete Bank Clicks ---
  if (bankListContainer) {
    bankListContainer.addEventListener('click', async (e) => {
      const deleteBtn = e.target.closest('[data-action="delete-bank"]');
      if (deleteBtn) {
        const bankId = deleteBtn.dataset.id;
        const bankRow = deleteBtn.closest(`[id="bank-${bankId}"]`);
        const bankTitle = bankRow ? bankRow.querySelector('span').textContent : 'this bank';

        // 1. Show confirmation dialog
        if (!confirm(`Are you sure you want to delete the bank "${bankTitle}"?\n\nThis will delete all questions inside it and cannot be undone.`)) {
            return; // Stop if user clicks cancel
        }
        
        // 2. Clear any old messages
        bankResultDiv.textContent = '';

        // 3. Make API call
        try {
          const response = await fetch(`/api/banks/${bankId}`, {
            method: 'DELETE'
          });

          const result = await response.json();

          if (response.ok) {
            // 4. On success, remove the bank from the page
            document.getElementById(`bank-${bankId}`).remove();
            bankResultDiv.innerHTML = `<strong class="text-green-600">${result.message}</strong>`;

            // Also remove it from the "Create Test" dropdown
            const optionToRemove = document.querySelector(`#bank-select option[value="${bankId}"]`);
            if (optionToRemove) {
                optionToRemove.remove();
            }

          } else {
            // 5. On failure, show the error
            bankResultDiv.innerHTML = `<strong class="text-red-600">Error: ${result.message}</strong>`;
          }
        } catch (err) {
          bankResultDiv.innerHTML = `<strong class="text-red-600">Network Error: ${err.message}</strong>`;
        }
      }
    });
  }

  document.addEventListener('click', async (e) => {
    const copyBtn = e.target.closest('[data-action="copy-link"]');
    if (!copyBtn) return;

    const card = copyBtn.closest('.border');
    const input = card ? card.querySelector('[data-role="test-link"]') : null;
    if (!input) return;

    try {
      await navigator.clipboard.writeText(`${window.location.origin}${input.value}`);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = 'Copy Link';
      }, 1200);
    } catch {
      input.select();
      document.execCommand('copy');
    }
  });

});
