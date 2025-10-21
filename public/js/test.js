// public/js/test.js
document.addEventListener('DOMContentLoaded', () => {
  // Page sections
  const loginContainer = document.getElementById('login-container');
  const testContainer = document.getElementById('test-container');
  const resultsContainer = document.getElementById('results-container');

  // Login form
  const startTestForm = document.getElementById('start-test-form');
  const rollNoInput = document.getElementById('roll-no');
  const uniqueLinkInput = document.getElementById('unique-link');
  const loginError = document.getElementById('login-error');

  // Test elements
  const timerDisplay = document.querySelector('#timer span');
  const questionArea = document.getElementById('question-area');
  const submitTestBtn = document.getElementById('submit-test-btn');

  // Results elements
  const scoreDisplay = document.getElementById('score');
  const resultsBreakdown = document.getElementById('results-breakdown');

  // Warning modal
  const warningModal = document.getElementById('warning-modal');
  const returnToTestBtn = document.getElementById('return-to-test');
  const submitAnywayBtn = document.getElementById('submit-anyway');

  // Test state variables
  let testData = {};
  let timerInterval;
  let warningCount = 0;
  let testIsSubmitted = false;
  
  // --- 1. START TEST ---
  if(startTestForm) {
    startTestForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginError.textContent = '';
      const rollNo = rollNoInput.value;
      const uniqueLink = uniqueLinkInput.value;

      if (!rollNo.trim()) {
        loginError.textContent = 'Please enter your Roll Number.';
        return;
      }

      try {
        const response = await fetch('/api/test/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uniqueLink, rollNo }),
        });

        const data = await response.json();

        if (!response.ok) {
          loginError.textContent = data.message || 'Failed to start test.';
          return;
        }

        testData = data;
        startTest();
        
      } catch (err) {
        loginError.textContent = 'A network error occurred.';
      }
    });
  }

  // --- 2. INITIALIZE TEST UI ---
  async function startTest() {
    loginContainer.style.display = 'none';
    testContainer.style.display = 'block';

    try {
      await document.documentElement.requestFullscreen();
    } catch (err) {
      console.warn('Could not enter full-screen mode:', err.message);
    }

    addSecurityListeners();
    displayQuestions(testData.questions);
    startTimer(testData.duration);
  }

  // --- 3. DISPLAY QUESTIONS (UPDATED) ---
  function displayQuestions(questions) {
    questionArea.innerHTML = '';
    questions.forEach((q, index) => {
      // Create options HTML
      const optionsHtml = q.options.map(option => `
        <label class="block p-4 border border-gray-300 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors duration-150">
          <input type="radio" name="question-${q._id}" value="${option}" class="mr-3 text-indigo-600 focus:ring-indigo-500">
          <span class="font-medium text-gray-800">${option}</span>
        </label>
      `).join('');

      // Add image HTML if it exists
      const imageHTML = q.imageUrl
        ? `<img src="${q.imageUrl}" alt="Question Content" class="w-full rounded-lg mb-4 max-h-72 object-contain">`
        : '';

      // Create question card
      const questionCard = document.createElement('div');
      questionCard.className = 'bg-white p-5 sm:p-6 rounded-xl shadow-lg border border-gray-100 mb-6';
      questionCard.innerHTML = `
        ${imageHTML}
        <h3 class="text-lg sm:text-xl font-semibold mb-5 text-gray-900">${index + 1}. ${q.questionText}</h3>
        <div class="space-y-3" data-question-id="${q._id}">
          ${optionsHtml}
        </div>
      `;
      questionArea.appendChild(questionCard);
    });
  }
  
  // --- 4. START TIMER ---
  function startTimer(durationInMinutes) {
    let timeLeft = durationInMinutes * 60;

    const updateTimer = () => {
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        timerDisplay.textContent = '00:00';
        forceSubmitTest('Time is up!');
        return;
      }

      timeLeft--;
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
  }

  // --- 5. SECURITY LISTENERS ---
  function addSecurityListeners() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && !testIsSubmitted) {
        handleWarning();
      }
    });

    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement && !testIsSubmitted) {
        handleWarning();
        document.documentElement.requestFullscreen().catch();
      }
    });
  }

  // --- 6. HANDLE WARNINGS ---
  function handleWarning() {
    if (testIsSubmitted) return;
    warningCount++;
    
    if (warningCount === 1) {
      if(warningModal) warningModal.style.display = 'flex';
    } else {
      forceSubmitTest('Test submitted due to leaving the window multiple times.');
    }
  }

  if(returnToTestBtn) {
    returnToTestBtn.addEventListener('click', () => {
      if(warningModal) warningModal.style.display = 'none';
      document.documentElement.requestFullscreen().catch();
    });
  }

  if(submitAnywayBtn) {
    submitAnywayBtn.addEventListener('click', () => {
      if(warningModal) warningModal.style.display = 'none';
      forceSubmitTest('You chose to submit the test.');
    });
  }
  
  // --- 7. SUBMIT TEST LOGIC ---
  if(submitTestBtn) {
    submitTestBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to submit your test?')) {
        forceSubmitTest('You have submitted the test.');
      }
    });
  }

  async function forceSubmitTest(submitMessage) {
    if (testIsSubmitted) return;
    testIsSubmitted = true;
    clearInterval(timerInterval);

    const answers = [];
    const questionDivs = questionArea.querySelectorAll('[data-question-id]');
    questionDivs.forEach(div => {
      const qId = div.dataset.questionId;
      const selectedInput = div.querySelector(`input[name="question-${qId}"]:checked`);
      answers.push({
        questionId: qId,
        selectedOption: selectedInput ? selectedInput.value : null
      });
    });

    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    
    alert(submitMessage);

    testContainer.innerHTML = '<h1 class="text-3xl font-bold text-center mt-40 font-display">Submitting... Please wait.</h1>';

    try {
        const response = await fetch('/api/test/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                attemptId: testData.attemptId, 
                answers: answers 
            })
        });
        const results = await response.json();

        if (!response.ok) {
            throw new Error(results.message || 'Submission failed');
        }
        
        displayResults(results);

    } catch (err) {
        testContainer.innerHTML = `<h1 class="text-3xl font-bold text-center mt-40 text-red-600 font-display">Error: ${err.message}</h1>`;
    }
  }

  // --- 8. DISPLAY RESULTS (UPDATED) ---
  function displayResults(results) {
    testContainer.style.display = 'none';
    resultsContainer.style.display = 'flex';
    if(warningModal) warningModal.style.display = 'none';

    scoreDisplay.textContent = `You Scored: ${results.score} / ${results.total}`;

    resultsBreakdown.innerHTML = '';
    results.results.forEach((item, index) => {
        const isCorrect = item.isCorrect;
        const bgColor = isCorrect ? 'bg-green-50' : 'bg-red-50';
        const borderColor = isCorrect ? 'border-green-300' : 'border-red-300';
        
        let answerHtml;
        if (isCorrect) {
          answerHtml = `
            <p class="mt-2 text-green-700 font-medium">
              <strong>Your Answer:</strong> ${item.selectedOption || 'Not Answered'}
            </p>`;
        } else {
          answerHtml = `
            <p class="mt-2 text-red-700 font-medium">
              <strong>Your Answer:</strong> ${item.selectedOption || 'Not Answered'}
            </p>
            <p class="mt-1 text-green-700 font-medium">
              <strong>Correct Answer:</strong> ${item.correctAnswer}
            </p>`;
        }
        
        // Add image HTML if it exists
        const imageHTML = item.imageUrl
          ? `<img src="${item.imageUrl}" alt="Question Content" class="w-full rounded-lg mb-3 max-h-48 object-contain">`
          : '';

        const resultCard = document.createElement('div');
        resultCard.className = `p-4 border ${borderColor} ${bgColor} rounded-lg`;
        resultCard.innerHTML = `
            ${imageHTML}
            <p class="font-semibold text-lg text-gray-800">${index + 1}. ${item.questionText}</p>
            ${answerHtml}
        `;
        resultsBreakdown.appendChild(resultCard);
    });
  }
});