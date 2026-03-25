async function runTests() {
  const challengeId = '69c3efb2f6b3b56674880649';
  const code = `
x = input().split()
target = int(input())
for i in range(len(x)):
    for j in range(i + 1, len(x)):
        if int(x[i]) + int(x[j]) == target:
            print(f"{i} {j}")
            # Exit after first match
            import sys
            sys.exit(0)
  `.trim();

  console.log('--- Testing /execute (Dry Run) ---');
  try {
    const res1 = await fetch('http://localhost:3000/api/coding/student/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: code,
        language: 'python',
        input: '2 7 11 15\n9'
      })
    });
    const data1 = await res1.json();
    console.log('Execute Result:', data1);
  } catch (err) {
    console.error('Execute Error:', err);
  }

  console.log('\n--- Testing /submit (All Cases) ---');
  try {
    const res2 = await fetch('http://localhost:3000/api/coding/student/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: code,
        language: 'python',
        challengeId: challengeId,
        studentRollNo: '21C31'
      })
    });
    const data2 = await res2.json();
    console.log('Submit Result:', data2);
  } catch (err) {
    console.error('Submit Error:', err);
  }
}

runTests();
