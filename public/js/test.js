// public/js/test.js
document.addEventListener('DOMContentLoaded', () => {
    const escapeHtml = (str) => {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    };

    function vcConfirm(message, proceedText, cancelText) {
      return new Promise((resolve) => {
        const bg = document.createElement('div');
        bg.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4';
        const box = document.createElement('div');
        box.className = 'glass-card border border-white/10 rounded-2xl p-6 md:p-8 max-w-sm w-full shadow-2xl';
        box.innerHTML = `
          <h3 class="text-xl font-semibold text-white tracking-tight mb-2">Confirm Action</h3>
          <p class="text-sm text-gray-400 mb-8 leading-relaxed">${escapeHtml(message)}</p>
          <div class="flex flex-col sm:flex-row gap-3">
            <button id="vc-btn-cancel" class="btn-ghost flex-1 py-3 px-4">${escapeHtml(cancelText)}</button>
            <button id="vc-btn-proceed" class="btn-secondary flex-1 py-3 px-4">${escapeHtml(proceedText)}</button>
          </div>
        `;
        bg.appendChild(box);
        document.body.appendChild(bg);
        document.getElementById('vc-btn-cancel').onclick = () => { bg.remove(); resolve(false); };
        document.getElementById('vc-btn-proceed').onclick = () => { bg.remove(); resolve(true); };
      });
    }

  // Page sections
  const loginContainer = document.getElementById('login-container');
  const testContainer = document.getElementById('test-container');
  const resultsContainer = document.getElementById('results-container');

  // Login form
  const startTestForm = document.getElementById('start-test-form');
  const studentNameInput = document.getElementById('student-name');
  const rollNoInput = document.getElementById('roll-no');
  const departmentInput = document.getElementById('department');
  const yearInput = document.getElementById('year');
  const sectionInput = document.getElementById('section');
  const collegeNameInput = document.getElementById('college-name');
  const uniqueLinkInput = document.getElementById('unique-link');
  const loginError = document.getElementById('login-error');
  const startTestBtn = document.getElementById('start-test-btn');
  const rulesScreen = document.getElementById('rules-screen');
  const editDetailsBtn = document.getElementById('edit-details-btn');
  const confirmRulesBtn = document.getElementById('confirm-rules-btn');

  // Test elements
  const timerDisplay = document.getElementById('timer-value');
  const questionArea = document.getElementById('question-area');
  const submitTestBtn = document.getElementById('submit-test-btn');
  const progressText = document.getElementById('progress-text');
  const questionNav = document.getElementById('question-nav');
  const questionNavButtons = document.getElementById('question-nav-buttons');

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
  let isStartingTest = false;
  let isSubmittingTest = false;
  let pendingStudentDetails = null;

  function setButtonLoading(button, isLoading, idleHtml, loadingHtml) {
    if (!button) return;
    button.disabled = isLoading;
    button.classList.toggle('opacity-70', isLoading);
    button.classList.toggle('cursor-not-allowed', isLoading);
    button.innerHTML = isLoading ? loadingHtml : idleHtml;
  }
  
  // --- 1. START TEST ---
  if(startTestForm) {
    startTestForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginError.textContent = '';
      loginError.classList.add('hidden');
      const name = studentNameInput.value;
      const rollNo = rollNoInput.value;
      const department = departmentInput.value;
      const year = yearInput.value;
      const section = sectionInput.value;
      const collegeName = collegeNameInput.value;
      const uniqueLink = uniqueLinkInput.value;

      if (!name.trim() || !rollNo.trim() || !department.trim() || !year.trim()) {
        loginError.textContent = 'Please enter your name, roll number, department, and year.';
        loginError.classList.remove('hidden');
        return;
      }

      pendingStudentDetails = { uniqueLink, name, rollNo, department, year, section, collegeName };
      loginError.classList.add('hidden');
      loginError.textContent = '';
      startTestForm.classList.add('hidden');
      rulesScreen.classList.remove('hidden');
      rulesScreen.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  if (editDetailsBtn) {
    editDetailsBtn.addEventListener('click', () => {
      rulesScreen.classList.add('hidden');
      startTestForm.classList.remove('hidden');
    });
  }

  if (confirmRulesBtn) {
    confirmRulesBtn.addEventListener('click', async () => {
      if (isStartingTest || !pendingStudentDetails) return;

      try {
        isStartingTest = true;
        setButtonLoading(
          confirmRulesBtn,
          true,
          confirmRulesBtn.innerHTML,
          '<span class="material-symbols-outlined animate-spin text-[18px]">sync</span><span class="tracking-wide">Please wait...</span>',
        );
        const response = await fetch('/api/test/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pendingStudentDetails),
        });

        const data = await response.json();

        if (!response.ok) {
          loginError.textContent = data.message || 'Failed to start test.';
          loginError.classList.remove('hidden');
          rulesScreen.classList.add('hidden');
          startTestForm.classList.remove('hidden');
          return;
        }

        testData = data;
        startTest();
      } catch (err) {
        loginError.textContent = 'A network error occurred.';
        loginError.classList.remove('hidden');
        rulesScreen.classList.add('hidden');
        startTestForm.classList.remove('hidden');
      } finally {
        isStartingTest = false;
        setButtonLoading(
          confirmRulesBtn,
          false,
          'I Agree, Start Test <span class="material-symbols-outlined text-[18px]">arrow_forward</span>',
          '',
        );
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
    updateProgress();
  }

  // --- 3. DISPLAY QUESTIONS (UPDATED) ---
  function displayQuestions(questions) {
    questionArea.innerHTML = '';
    if (questionNavButtons) questionNavButtons.innerHTML = '';
    questions.forEach((q, index) => {
      // Create options HTML
      const optionsHtml = q.options.map((option, optIdx) => `
        <label class="block p-4 border border-white/10 bg-[#0a0a0a] rounded-xl hover:bg-[#111] hover:border-white/30 cursor-pointer transition-all duration-200 group">
          <div class="flex items-center">
            <input type="radio" name="question-${q._id}" value="${escapeHtml(option)}" class="w-5 h-5 bg-black border-white/20 text-white focus:ring-1 focus:ring-white/30 focus:ring-offset-0 focus:ring-offset-transparent">
            <span class="ml-4 font-medium text-gray-300 text-sm group-hover:text-white">${escapeHtml(option)}</span>
          </div>
        </label>
      `).join('');

      // Add image HTML if it exists
      const safeImgq = q.imageUrl && (q.imageUrl.startsWith('https://') || q.imageUrl.startsWith('http://')) ? q.imageUrl : '';
      const imageHTML = safeImgq
        ? `<img src="${safeImgq}" alt="Question Content" class="w-full rounded-lg mb-6 max-h-72 object-contain border border-white/10">`
        : '';

      // Create question card
      const questionCard = document.createElement('div');
      questionCard.className = 'bg-[#0a0a0a] p-6 md:p-10 rounded-2xl border border-white/10 mb-8 w-full';
      questionCard.id = `question-card-${q._id}`;
      questionCard.innerHTML = `
        ${imageHTML}
        <h3 class="text-xl md:text-2xl font-semibold mb-8 text-white leading-relaxed tracking-tight">
          <span class="text-gray-500 mr-2 font-mono text-sm">Q${index + 1}.</span> ${escapeHtml(q.questionText)}
        </h3>
        <div class="space-y-3" data-question-id="${q._id}">
          ${optionsHtml}
        </div>
      `;
      questionArea.appendChild(questionCard);

      if (questionNavButtons) {
        const navButton = document.createElement('button');
        navButton.type = 'button';
        navButton.dataset.questionId = q._id;
        navButton.className = 'w-10 h-10 rounded-lg border border-white/10 text-sm font-medium text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center';
        navButton.textContent = `${index + 1}`;
        navButton.addEventListener('click', () => {
          const target = document.getElementById(`question-card-${q._id}`);
          if (target) {
            const headerHeight = document.getElementById('header') ? document.getElementById('header').offsetHeight : 0;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerHeight - 20;
            window.scrollTo({ top: offsetPosition, behavior: "smooth" });
          }
        });
        questionNavButtons.appendChild(navButton);
      }
    });
    if (questionNav) questionNav.classList.remove('hidden');
    attachProgressListeners();
  }

  function attachProgressListeners() {
    questionArea.querySelectorAll('input[type="radio"]').forEach((input) => {
      input.addEventListener('change', updateProgress);
    });
  }

  function updateProgress() {
    const questionDivs = questionArea.querySelectorAll('[data-question-id]');
    const total = questionDivs.length;
    let answered = 0;

    questionDivs.forEach((div) => {
      const qId = div.dataset.questionId;
      const selected = div.querySelector(`input[name="question-${qId}"]:checked`);
      if (selected) answered++;

      const navButton = questionNavButtons
        ? questionNavButtons.querySelector(`button[data-question-id="${qId}"]`)
        : null;
      if (navButton) {
        navButton.className = selected
          ? 'w-10 h-10 rounded-lg border border-white text-white text-sm font-medium bg-white/10 transition-all flex items-center justify-center shadow-[0_0_10px_rgba(255,255,255,0.1)] focus:outline-none'
          : 'w-10 h-10 rounded-lg border border-white/10 text-sm font-medium text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center focus:outline-none';
      }
    });

    if (progressText) progressText.textContent = `Answered ${answered} / ${total}`;
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
    window.addEventListener('beforeunload', (event) => {
      if (!testIsSubmitted && testContainer.style.display !== 'none') {
        event.preventDefault();
        event.returnValue = '';
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && !testIsSubmitted) {
        handleWarning();
      }
    });

    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement && !testIsSubmitted) {
        handleWarning();
        setTimeout(() => {
          document.documentElement.requestFullscreen().catch(() => {});
        }, 100);
      }
    });
  }

  // --- 6. HANDLE WARNINGS ---
  let warningLastTriggered = 0;
  function handleWarning() {
    if (testIsSubmitted) return;
    const now = Date.now();
    if (now - warningLastTriggered < 2000) return;
    warningLastTriggered = now;
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
    submitTestBtn.addEventListener('click', async () => {
      if (isSubmittingTest) return;
      const confirmed = await vcConfirm('Are you sure you want to submit your test?', 'Submit', 'Cancel');
      if (confirmed) {
        forceSubmitTest('You have submitted the test.');
      }
    });
  }

  async function forceSubmitTest(submitMessage) {
    if (testIsSubmitted || isSubmittingTest) return;
    testIsSubmitted = true;
    isSubmittingTest = true;
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
    
    testContainer.innerHTML = `<div class="mt-32 flex flex-col items-center justify-center gap-4 text-center">
      <span class="material-symbols-outlined animate-spin text-white text-3xl">sync</span>
      <h1 class="text-xl font-medium text-gray-400 animate-pulse tracking-widest uppercase">Submitting... Please wait.</h1>
      <p class="text-xs text-gray-500 uppercase tracking-[0.2em]">${submitMessage}</p>
    </div>`;

    // ADD JITTER: Random delay (0-3s) to spread server load during spikes
    await new Promise(r => setTimeout(r, Math.random() * 3000));

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
        isSubmittingTest = false;
        testIsSubmitted = false;
        testContainer.innerHTML = `<h1 class="text-xl font-medium text-center mt-40 text-red-500 font-mono">Error: ${err.message}</h1>`;
    }
  }

  // --- 8. DISPLAY RESULTS (UPDATED) ---
  function displayResults(results) {
    testContainer.style.display = 'none';
    testContainer.classList.add('hidden');
    resultsContainer.style.display = 'flex';
    resultsContainer.classList.remove('hidden');
    resultsContainer.classList.add('flex');
    if(warningModal) warningModal.style.display = 'none';

    scoreDisplay.textContent = `You Scored: ${results.score} / ${results.total}`;

    resultsBreakdown.innerHTML = '';
    results.results.forEach((item, index) => {
        const isCorrect = item.isCorrect;
        const bgColor = isCorrect ? 'bg-green-500/5' : 'bg-red-500/5';
        const borderColor = isCorrect ? 'border-green-500/20' : 'border-red-500/20';
        
        let answerHtml;
        if (isCorrect) {
          answerHtml = `
            <div class="mt-4 p-4 bg-[#050505] rounded-xl border border-white/10">
              <span class="text-[10px] font-mono uppercase tracking-widest text-green-400 block mb-1">Your Answer (Correct)</span>
              <span class="text-white font-medium text-sm">${escapeHtml(item.selectedOption) || 'Not Answered'}</span>
            </div>`;
        } else {
          answerHtml = `
            <div class="mt-4 flex flex-col md:flex-row gap-3">
              <div class="flex-1 p-4 bg-[#050505] rounded-xl border border-red-500/20">
                <span class="text-[10px] font-mono uppercase tracking-widest text-red-400 block mb-1">Your Answer</span>
                <span class="text-gray-500 font-medium text-sm line-through">${escapeHtml(item.selectedOption) || 'Not Answered'}</span>
              </div>
              <div class="flex-1 p-4 bg-[#050505] rounded-xl border border-green-500/20">
                <span class="text-[10px] font-mono uppercase tracking-widest text-green-400 block mb-1">Correct Answer</span>
                <span class="text-white font-medium text-sm">${escapeHtml(item.correctAnswer)}</span>
              </div>
            </div>`;
        }
        
        const safeImg = item.imageUrl && (item.imageUrl.startsWith('https://') || item.imageUrl.startsWith('http://')) ? item.imageUrl : '';
        const imageHTML = safeImg
          ? `<img src="${safeImg}" alt="Question Content" class="w-full rounded-lg mb-5 max-h-64 object-contain border border-white/10">`
          : '';

        const resultCard = document.createElement('div');
        resultCard.className = `p-6 border ${borderColor} ${bgColor} rounded-xl bg-[#0a0a0a]`;
        resultCard.innerHTML = `
            ${imageHTML}
            <h4 class="font-medium text-sm text-gray-200 leading-relaxed"><span class="text-gray-500 mr-2 font-mono">Q${index + 1}.</span> ${escapeHtml(item.questionText)}</h4>
            ${answerHtml}
        `;
        resultsBreakdown.appendChild(resultCard);
    });
  }
});
