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

      // 1. Get all values from the form
      const questionText = questionTextInput.value;
      const imageUrl = imageUrlInput.value.trim() || null; // Get image URL
      const options = [
        option1Input.value,
        option2Input.value,
        option3Input.value,
        option4Input.value,
      ];
      const correctIndex = correctAnswerSelect.value;
      
      // 2. Validate
      if (!questionText.trim()) {
        messageDiv.textContent = 'Please enter question text.';
        messageDiv.classList.add('text-red-600');
        return;
      }
      if (options.some(opt => opt.trim() === '')) {
        messageDiv.textContent = 'All four options must be filled out.';
        messageDiv.classList.add('text-red-600');
        return;
      }
      if (!correctIndex) {
        messageDiv.textContent = 'Please select a correct answer.';
        messageDiv.classList.add('text-red-600');
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
      }
    });
  }

  // --- EDIT BUTTON CLICK ---
  if (questionList) {
    questionList.addEventListener('click', (e) => {
      const editButton = e.target.closest('[data-action="edit-question"]');
      if (!editButton) return;

      const id = editButton.dataset.id;
      const text = editButton.dataset.text;
      const imageUrl = editButton.dataset.imageurl; // Get imageUrl
      const options = [
        editButton.dataset.opt1,
        editButton.dataset.opt2,
        editButton.dataset.opt3,
        editButton.dataset.opt4,
      ];
      const correct = editButton.dataset.correct;

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
      cancelEditBtn.style.display = 'inline-block';
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- CANCEL EDIT BUTTON CLICK ---
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', resetForm);
  }

  // --- HELPER FUNCTIONS ---
  function resetForm() {
    currentEditId = null;
    form.reset();
    formTitle.textContent = 'Add a New Question';
    submitBtn.textContent = 'Add Question';
    cancelEditBtn.style.display = 'none';
    messageDiv.textContent = '';
    editQuestionIdInput.value = '';
    imageUrlInput.value = ''; // Reset image URL field
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
    questionDiv.className = 'border border-gray-200 p-4 rounded-lg';

    let optionsHTML = '';
    q.options.forEach(opt => {
      if (opt === q.correctAnswer) {
        optionsHTML += `<li class="text-green-600 font-bold">${opt} (Correct)</li>`;
      } else {
        optionsHTML += `<li>${opt}</li>`;
      }
    });

    const imageHTML = q.imageUrl 
      ? `<img src="${q.imageUrl}" alt="Question Image" class="w-full max-h-40 object-cover rounded-md mb-3">` 
      : '';

    questionDiv.innerHTML = `
      ${imageHTML}
      <p class="font-medium text-gray-800 break-words">${q.questionText}</p>
      <ul class="list-disc list-inside text-sm text-gray-600 my-2 space-y-1">
        ${optionsHTML}
      </ul>
      <button 
        data-action="edit-question"
        data-id="${q._id}"
        data-text="${q.questionText}"
        data-imageurl="${q.imageUrl || ''}"
        data-opt1="${q.options[0]}"
        data-opt2="${q.options[1]}"
        data-opt3="${q.options[2]}"
        data-opt4="${q.options[3]}"
        data-correct="${q.correctAnswer}"
        class="text-gray-500 hover:text-indigo-600 transition-colors mt-2"
        title="Edit Question">
        <span class="material-symbols-outlined">edit</span>
      </button>
    `;
    return questionDiv;
  }
});