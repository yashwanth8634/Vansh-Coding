const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function getWandboxCompilers() {
  try {
    const res = await fetch('https://wandbox.org/api/list.json');
    const data = await res.json();
    console.log(data.filter(c => c.language === 'JavaScript' || c.language === 'Python' || c.language === 'C++' || c.language === 'C' || c.language === 'Java').map(c => c.name));
  } catch(e) { console.error(e); }
}
getWandboxCompilers();
