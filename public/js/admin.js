// public/js/admin.js
document.addEventListener('DOMContentLoaded', () => {
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
      const data = {
        questionBankId: document.getElementById('bank-select').value,
        numQuestions: document.getElementById('num-questions').value,
        duration: document.getElementById('duration').value,
        linkExpiryHours: document.getElementById('expiry').value,
      };
      if (!data.questionBankId) {
          testResultDiv.innerHTML = `<strong class="text-red-600">Error: Please select a question bank.</strong>`;
          testResultDiv.style.display = 'block';
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
            <input type="text" value="${fullLink}" readonly class="w-full p-2 border border-gray-300 rounded-md bg-gray-100 mt-1">
          `;
        } else {
          testResultDiv.innerHTML = `<strong class="text-red-600">Error: ${result.message}</strong>`;
        }
      } catch (error) {
        testResultDiv.style.display = 'block';
        testResultDiv.innerHTML = `<strong class="text-red-600">Network error: ${error.message}</strong>`;
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
      // Check if the clicked element is a delete button
      if (e.target.dataset.action === 'delete-bank') {
        const bankId = e.target.dataset.id;
        const bankTitle = e.target.closest('.flex').querySelector('span').textContent;

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

});