// utils/helpers.js
const PDFDocument = require('pdfkit');

function sanitizeFilename(value, fallback) {
  return String(value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || fallback;
}

function drawRankingPdf({ res, title, subtitle, rows }) {
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 36,
  });

  doc.pipe(res);

  const headers = ['Rank', 'Name', 'Roll No', 'Score', 'Year', 'Department', 'Section', 'Clg'];
  const columnWidths = [45, 130, 95, 85, 50, 105, 65, 110];
  const startX = doc.page.margins.left;
  const bottomLimit = doc.page.height - doc.page.margins.bottom;
  let y = doc.page.margins.top;

  const drawTableHeader = () => {
    let x = startX;
    const headerHeight = 24;

    doc.font('Helvetica-Bold').fontSize(10);
    headers.forEach((header, index) => {
      doc.rect(x, y, columnWidths[index], headerHeight).fillAndStroke('#1c1a18', '#1c1a18');
      doc.fillColor('#ffffff').text(header, x + 6, y + 7, {
        width: columnWidths[index] - 12,
        align: index === 0 || index === 3 ? 'center' : 'left',
      });
      x += columnWidths[index];
    });

    y += headerHeight;
  };

  doc.font('Helvetica-Bold').fontSize(16).fillColor('#111111').text(title, startX, y);
  y += 22;
  doc.font('Helvetica').fontSize(10).fillColor('#555555').text(subtitle, startX, y);
  y += 22;

  drawTableHeader();

  rows.forEach((row, rowIndex) => {
    const values = [
      String(row.rank),
      row.studentName || '',
      row.studentRollNo || '',
      row.score !== undefined && row.score !== null ? String(row.score) : '-',
      row.studentYear || '',
      row.studentDepartment || '',
      row.studentSection || '-',
      row.studentCollege || 'Vignan',
    ];

    const cellHeights = values.map((value, index) => (
      doc.heightOfString(String(value), {
        width: columnWidths[index] - 12,
        align: index === 0 || index === 3 || index === 4 ? 'center' : 'left',
      })
    ));

    const rowHeight = Math.max(24, Math.max(...cellHeights) + 10);

    if (y + rowHeight > bottomLimit) {
      doc.addPage({ size: 'A4', layout: 'landscape', margin: 36 });
      y = doc.page.margins.top;
      drawTableHeader();
    }

    let x = startX;
    values.forEach((value, index) => {
      const fillColor = rowIndex % 2 === 0 ? '#f7f7f7' : '#ffffff';
      doc.rect(x, y, columnWidths[index], rowHeight).fillAndStroke(fillColor, '#d6d6d6');
      doc.fillColor('#111111')
        .font(index === 1 ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(10)
        .text(String(value), x + 6, y + 6, {
          width: columnWidths[index] - 12,
          align: index === 0 || index === 3 || index === 4 ? 'center' : 'left',
        });
      x += columnWidths[index];
    });

    y += rowHeight;
  });

  doc.end();
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
}

// Export all helper functions
module.exports = { 
  shuffleArray,
  sanitizeFilename,
  drawRankingPdf
};
