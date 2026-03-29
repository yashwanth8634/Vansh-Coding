// public/js/add-questions.js
document.addEventListener('DOMContentLoaded', () => {
  // --- Form Elements ---
  const form = document.getElementById('add-question-form');
  const formTitle = document.getElementById('form-title');
  const messageDiv = document.getElementById('form-message');
  const submitBtn = document.getElementById('submit-btn');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  const editQuestionIdInput = document.getElementById('edit-question-id');

  // --- Form Fields ---
  const questionTextInput = document.getElementById('question-text');
  const imageUrlInput = document.getElementById('image-url'); // Get new input
  const option1Input = document.getElementById('option1');
  const option2Input = document.getElementById('option2');
  const option3Input = document.getElementById('option3');
  const option4Input = document.getElementById('option4');
  const correctAnswerSelect = document.getElementById('correct-answer');
  const imagePreviewWrap = document.getElementById('image-preview-wrap');
  const imagePreview = document.getElementById('image-preview');
  
  // --- List Elements ---
  const questionList = document.getElementById('question-list');
  const questionCount = document.getElementById('question-count');
  const noQuestionsMessage = document.getElementById('no-questions-message');

  const bankId = window.location.pathname.split('/').pop();
  let currentEditId = null;

  // --- FORM SUBMISSION (Handles both ADD and UPDATE) ---
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      messageDiv.textContent = '';
      messageDiv.className = 'mt-4 text-sm font-medium';
      submitBtn.disabled = true;

      // 1. Get all values from the form
      const questionText = questionTextInput.value;
      const imageUrl = imageUrlInput.value.trim() || null; // Get image URL
      const options = [
        option1Input.value.trim(),
        option2Input.value.trim(),
        option3Input.value.trim(),
        option4Input.value.trim(),
      ];
      const correctIndex = correctAnswerSelect.value;
      
      // 2. Validate
      if (!questionText.trim()) {
        messageDiv.textContent = 'Please enter question text.';
        messageDiv.classList.add('text-red-600');
        submitBtn.disabled = false;
        return;
      }
      if (options.some(opt => opt.trim() === '')) {
        messageDiv.textContent = 'All four options must be filled out.';
        messageDiv.classList.add('text-red-600');
        submitBtn.disabled = false;
        return;
      }
      if (new Set(options.map(opt => opt.toLowerCase())).size !== options.length) {
        messageDiv.textContent = 'Options must be unique.';
        messageDiv.classList.add('text-red-600');
        submitBtn.disabled = false;
        return;
      }
      if (!correctIndex) {
        messageDiv.textContent = 'Please select a correct answer.';
        messageDiv.classList.add('text-red-600');
        submitBtn.disabled = false;
        return;
      }
      
      const correctAnswer = document.getElementById(`option${correctIndex}`).value;
      
      // 3. Build the request body
      const body = { questionText, options, correctAnswer, imageUrl }; // Add imageUrl
      
      // 4. Determine URL and Method
      let url = currentEditId ? `/api/questions/${currentEditId}` : `/api/banks/${bankId}/questions`;
      let method = currentEditId ? 'PUT' : 'POST';

      // 5. Call the API
      try {
        const response = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const result = await response.json();

        if (response.ok) {
          if (currentEditId) {
            messageDiv.textContent = 'Question updated successfully!';
            messageDiv.classList.add('text-green-600');
            updateQuestionInList(result);
          } else {
            messageDiv.textContent = 'Question added successfully!';
            messageDiv.classList.add('text-green-600');
            addNewQuestionToList(result);
          }
          resetForm();
        } else {
          messageDiv.textContent = `Error: ${result.message}`;
          messageDiv.classList.add('text-red-600');
        }
      } catch (err) {
        messageDiv.textContent = `Network error: ${err.message}`;
        messageDiv.classList.add('text-red-600');
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  // --- EDIT BUTTON CLICK ---
  if (questionList) {
    questionList.addEventListener('click', (e) => {
      const editButton = e.target.closest('[data-action="edit-question"]');
      if (!editButton) return;

      const q = JSON.parse(editButton.dataset.question);
      const id = q._id;
      const text = q.questionText;
      const imageUrl = q.imageUrl || '';
      const options = q.options;
      const correct = q.correctAnswer;

      currentEditId = id;
      editQuestionIdInput.value = id;
      questionTextInput.value = text;
      imageUrlInput.value = imageUrl; // Set imageUrl
      option1Input.value = options[0];
      option2Input.value = options[1];
      option3Input.value = options[2];
      option4Input.value = options[3];
      
      const correctOptionIndex = options.indexOf(correct) + 1;
      correctAnswerSelect.value = correctOptionIndex;

      formTitle.textContent = 'Edit Question';
      submitBtn.textContent = 'Update Question';
      cancelEditBtn.classList.remove('hidden');
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- CANCEL EDIT BUTTON CLICK ---
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', resetForm);
  }

  if (imageUrlInput) {
    imageUrlInput.addEventListener('input', () => {
      const value = imageUrlInput.value.trim();
      if (!value || (!value.startsWith('http://') && !value.startsWith('https://'))) {
        imagePreviewWrap.classList.add('hidden');
        imagePreview.removeAttribute('src');
        return;
      }
      imagePreview.src = value;
      imagePreviewWrap.classList.remove('hidden');
    });
  }

  if (imagePreview) {
    imagePreview.addEventListener('error', () => {
      imagePreviewWrap.classList.add('hidden');
    });
  }

  if (questionList) {
    questionList.addEventListener('click', async (e) => {
      // Find the closest button with the delete action
      const deleteButton = e.target.closest('[data-action="delete-question"]');
      if (!deleteButton) return; // Exit if it wasn't a delete button click

      const questionId = deleteButton.dataset.id;
      const questionDiv = document.getElementById(`question-${questionId}`);
      const questionText = questionDiv ? questionDiv.querySelector('p').textContent.substring(0, 50) + '...' : 'this question';

      // 1. Show confirmation dialog
      if (!confirm(`Are you sure you want to delete the question starting with:\n"${questionText}"\n\nThis cannot be undone.`)) {
          return; // Stop if user clicks cancel
      }

      // 2. Clear any old messages
      messageDiv.textContent = '';
      messageDiv.className = 'mt-4 text-sm font-medium';

      // 3. Make API call
      try {
        const response = await fetch(`/api/questions/${questionId}`, {
          method: 'DELETE'
        });

        const result = await response.json();

        if (response.ok) {
          // 4. On success, remove the question from the page
          if (questionDiv) {
            questionDiv.remove();
          }
          // Update the count
          const newCount = parseInt(questionCount.textContent, 10) - 1;
          questionCount.textContent = newCount;
          if (newCount === 0) {
            questionList.innerHTML = `<p id="no-questions-message" class="text-gray-500 p-3">No questions have been added to this bank yet.</p>`;
          }
          messageDiv.textContent = result.message;
          messageDiv.classList.add('text-green-600');

          // If the form was in edit mode for *this* question, reset it
          if (currentEditId === questionId) {
            resetForm();
          }

        } else {
          // 5. On failure, show the error
          messageDiv.textContent = `Error: ${result.message}`;
          messageDiv.classList.add('text-red-600');
        }
      } catch (err) {
        messageDiv.textContent = `Network Error: ${err.message}`;
        messageDiv.classList.add('text-red-600');
      }
    });
  }

  // --- HELPER FUNCTIONS ---
  function resetForm() {
    currentEditId = null;
    form.reset();
    formTitle.textContent = 'Add a New Question';
    submitBtn.textContent = 'Add Question';
    cancelEditBtn.classList.add('hidden');
    messageDiv.textContent = '';
    editQuestionIdInput.value = '';
    imageUrlInput.value = ''; // Reset image URL field
    imagePreviewWrap.classList.add('hidden');
    imagePreview.removeAttribute('src');
  }

  function addNewQuestionToList(question) {
    if (noQuestionsMessage) {
      noQuestionsMessage.remove();
    }
    questionCount.textContent = parseInt(questionCount.textContent, 10) + 1;
    questionList.prepend(createQuestionHTML(question));
  }

  function updateQuestionInList(question) {
    const oldQuestionDiv = document.getElementById(`question-${question._id}`);
    if (oldQuestionDiv) {
      oldQuestionDiv.replaceWith(createQuestionHTML(question));
    }
  }

  // Creates the HTML for a single question item in the list
  function createQuestionHTML(q) {
    const questionDiv = document.createElement('div');
    questionDiv.id = `question-${q._id}`;
    questionDiv.className = 'border border-gray-200 p-4 rounded-lg'; // Matches EJS style

    let optionsHTML = '';
    q.options.forEach(opt => {
      if (opt === q.correctAnswer) {
        optionsHTML += `<li class="text-green-600 font-bold">${opt} (Correct)</li>`;
      } else {
        optionsHTML += `<li>${opt}</li>`;
      }
    });

    const imageHTML = q.imageUrl && (q.imageUrl.startsWith('http://') || q.imageUrl.startsWith('https://'))
      ? `<img src="${q.imageUrl}" alt="Question Image" class="w-full max-h-40 object-cover rounded-md mb-3">` 
      : '';

    const qStr = JSON.stringify(q).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Added the delete button here
    questionDiv.innerHTML = `
      ${imageHTML}
      <p class="font-medium text-gray-200 break-words">${q.questionText}</p>
      <ul class="list-disc list-inside text-sm text-gray-600 my-2 space-y-1">
        ${optionsHTML}
      </ul>
      <div class="flex items-center space-x-3 mt-2">
        <button 
          data-action="edit-question"
          data-question="${qStr}"
          class="text-gray-500 hover:text-indigo-600 transition-colors"
          title="Edit Question">
          <span class="material-symbols-outlined">edit</span>
        </button>
        <button
          data-action="delete-question"
          data-id="${q._id}"
          class="text-gray-500 hover:text-red-600 transition-colors"
          title="Delete Question">
          <span class="material-symbols-outlined">delete</span>
        </button>
      </div>
    `;
    return questionDiv;
  }
});
