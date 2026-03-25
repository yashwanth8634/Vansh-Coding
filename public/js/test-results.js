// public/js/test-results.js
document.addEventListener('DOMContentLoaded', () => {
    // --- Page Elements ---
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-rollno');
    const clearBtn = document.getElementById('clear-search');
    const tableBody = document.getElementById('results-table-body');
    const attemptCount = document.getElementById('attempt-count');
    const testId = document.getElementById('test-id').value;
    const noResultsRow = document.getElementById('no-results-row');
    const exportCsvBtn = document.getElementById('export-csv');

    // --- Modal Elements ---
    const modal = document.getElementById('analysis-modal');
    const modalCloseBtn = document.getElementById('modal-close');
    const modalRollNo = document.getElementById('modal-rollno');
    const modalScore = document.getElementById('modal-score');
    const modalBody = document.getElementById('modal-body');

    // --- State ---
    let searchResultsData = {}; 
    const allAttemptsHTML = tableBody.innerHTML;
    const initialCount = noResultsRow ? 0 : document.querySelectorAll('#results-table-body tr').length;

    // --- Handle Search ---
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rollNo = searchInput.value.trim();
        if (!rollNo) return;

        try {
            const response = await fetch(`/api/tests/${testId}/search?rollNo=${rollNo}`);
            
            if (response.ok) {
                const attempts = await response.json();
                renderTable(attempts);
            } else if (response.status === 404) {
                renderTable([]);
            } else {
                const err = await response.json();
                alert(`Search error: ${err.message}`);
            }
        } catch (err) {
            alert(`Network error: ${err.message}`);
        }
    });

    // --- Handle Clear Search ---
    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchResultsData = {};
        tableBody.innerHTML = allAttemptsHTML;
        attemptCount.textContent = initialCount;
        
        // Re-attach the original EJS data to the searchResultsData
        // Note: This relies on the global 'initialAttemptsData' from the EJS
        if (typeof initialAttemptsData !== 'undefined') {
            initialAttemptsData.forEach(attempt => {
                searchResultsData[attempt.studentRollNo] = attempt;
            });
        }
    });

    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          clearBtn.click();
        }
      });
    }

    // --- Render Table ---
    function renderTable(attempts, isInitial = false) {
        tableBody.innerHTML = ''; 
        
        if (!isInitial) { // Only clear cache if it's a new search
            searchResultsData = {};
        }
        
        if (attempts.length === 0) {
            tableBody.innerHTML = `
                <tr id="no-results-row">
                    <td colspan="4" class="p-4 text-center text-gray-500">
                        No attempts found.
                    </td>
                </tr>
            `;
            attemptCount.textContent = 0;
            return;
        }

        attemptCount.textContent = attempts.length;
        
        attempts.forEach(attempt => {
            if (!isInitial) {
                searchResultsData[attempt.studentRollNo] = attempt;
            }

            const tr = document.createElement('tr');
            tr.className = "border-b last:border-0 hover:bg-gray-50";

            const score = attempt.score;
            const total = isInitial ? testTotalQuestions : (attempt.answers ? attempt.answers.length : testTotalQuestions);

            tr.innerHTML = `
                <td class="p-3 font-medium">${attempt.studentRollNo}</td>
                <td class="p-3">${score} / ${total}</td>
                <td class="p-3">${new Date(attempt.submittedAt).toLocaleString()}</td>
                <td class="p-3">
                    <button data-action="view-details" 
                            data-rollno="${attempt.studentRollNo}"
                            class="bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600 transition-colors">
                        View
                    </button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // --- Handle ALL "View" Button Clicks ---
    tableBody.addEventListener('click', (e) => {
        if (e.target.dataset.action === 'view-details') {
            const rollNo = e.target.dataset.rollno;
            fetchAndShowAnalysis(rollNo);
        }
    });

    // --- Fetch and Show Analysis ---
    async function fetchAndShowAnalysis(rollNo) {
        if (searchResultsData[rollNo] && searchResultsData[rollNo].answers) {
            showAnalysisModal(searchResultsData[rollNo]);
            return;
        }
        
        // Use the initial data if it's there and we haven't searched
        if (typeof initialAttemptsData !== 'undefined' && !searchResultsData[rollNo]) {
             const initialAttempt = initialAttemptsData.find(a => a.studentRollNo === rollNo);
             if (initialAttempt) {
                searchResultsData[rollNo] = initialAttempt;
             }
        }
        
        // If we still don't have the detailed 'answers' array, fetch it
        if (!searchResultsData[rollNo] || !searchResultsData[rollNo].answers) {
            try {
                const response = await fetch(`/api/tests/${testId}/search?rollNo=${rollNo}`);
                if (!response.ok) throw new Error('Could not find attempt data.');
                
                const attempts = await response.json();
                const attempt = attempts[0];
                
                searchResultsData[rollNo] = attempt;
                showAnalysisModal(attempt);

            } catch (err) {
                alert(`Error fetching details: ${err.message}`);
            }
        }
    }


    // --- Show Analysis Modal (UPDATED) ---
    function showAnalysisModal(attempt) {
        modalRollNo.textContent = attempt.studentRollNo;
        modalScore.textContent = `${attempt.score} / ${attempt.answers.length}`;
        modalBody.innerHTML = '';

        if (!attempt.answers || attempt.answers.length === 0) {
            modalBody.innerHTML = '<p class="text-gray-600">No detailed answer data found for this attempt.</p>';
            modal.classList.remove('hidden');
            return;
        }

        attempt.answers.forEach((answer, index) => {
            const isCorrect = answer.isCorrect;
            const bgColor = isCorrect ? 'bg-green-50' : 'bg-red-50';
            const borderColor = isCorrect ? 'border-green-300' : 'border-red-300';

            const optionsHtml = (answer.options || []).map(option => {
                let styles = 'text-gray-700';
                let marker = '';

                if (option === answer.correctAnswer) {
                    styles = 'text-green-700 font-bold';
                    marker = ' (Correct)';
                }
                if (option === answer.selectedOption && !isCorrect) {
                    styles = 'text-red-700 font-bold';
                    marker = ' (Your Answer)';
                }
                if (option === answer.selectedOption && isCorrect) {
                    styles = 'text-green-700 font-bold';
                    marker = ' (Your Answer)';
                }

                return `<li class="${styles}">${option}${marker}</li>`;
            }).join('');

            // Add image HTML if it exists
            const imageHTML = answer.imageUrl
                ? `<img src="${answer.imageUrl}" alt="Question Content" class="w-full rounded-lg mb-3 max-h-48 object-contain">`
                : '';

            const questionCard = document.createElement('div');
            questionCard.className = `p-4 border ${borderColor} ${bgColor} rounded-lg`;
            questionCard.innerHTML = `
                ${imageHTML}
                <p class="font-semibold text-lg text-gray-800">${index + 1}. ${answer.questionText}</p>
                <ul class="list-disc list-inside mt-2 space-y-1">
                    ${optionsHtml}
                </ul>
            `;
            modalBody.appendChild(questionCard);
        });

        modal.classList.remove('hidden');
    }

    // --- Close Modal ---
    modalCloseBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', () => {
        let rows = [];
        if (typeof initialAttemptsData !== 'undefined' && initialAttemptsData.length) {
          rows = initialAttemptsData;
        } else {
          rows = Object.values(searchResultsData);
        }

        if (!rows.length) {
          alert('No attempts available to export.');
          return;
        }

        const header = ['roll_no', 'score', 'submitted_at'];
        const csvRows = rows.map((row) => [
          row.studentRollNo || '',
          row.score ?? '',
          row.submittedAt ? new Date(row.submittedAt).toISOString() : ''
        ]);

        const csv = [header, ...csvRows]
          .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
          .join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `test-${testId}-attempts.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
    }

    // --- Initialize the "search cache" with data from the server ---
    if (typeof initialAttemptsData !== 'undefined') {
        initialAttemptsData.forEach(attempt => {
            searchResultsData[attempt.studentRollNo] = attempt;
        });
    }
});
