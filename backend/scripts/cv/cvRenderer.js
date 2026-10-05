/**
 * Renders an ATS-friendly resume as plain text and as a single-column PDF.
 * Section headings and "YYYY - YYYY / Sekarang" periods match what
 * services/atsParserService.js looks for.
 */
const fs = require('fs');
const PDFDocument = require('pdfkit');

// Helper: Generate Clean ATS-Friendly Text (.txt)
function generateTxt(s) {
  let content = `${s.fullName}\n`;
  content += `${s.roleTitle}\n`;
  content += `${s.email} | ${s.phone} | ${s.location} | ${s.linkedin}\n\n`;

  content += `PROFESSIONAL SUMMARY\n`;
  content += `--------------------\n`;
  content += `${s.summary}\n\n`;

  content += `CORE COMPETENCIES & SKILLS\n`;
  content += `--------------------------\n`;
  content += `${s.skills.join(', ')}\n\n`;

  content += `WORK EXPERIENCE\n`;
  content += `---------------\n`;
  s.experiences.forEach(exp => {
    content += `${exp.role}\n`;
    content += `${exp.company} | ${exp.period}\n`;
    exp.bullets.forEach(b => {
      content += `- ${b}\n`;
    });
    content += `\n`;
  });

  content += `EDUCATION\n`;
  content += `---------\n`;
  content += `${s.education.degree}\n`;
  content += `${s.education.institution} (${s.education.year})\n\n`;

  return content;
}

// Helper: Generate Clean Single-Column ATS-Friendly PDF (.pdf)
function generatePdf(s, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, bottom: 40, left: 45, right: 45 }
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Header: Name & Role Title
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#0f172a').text(s.fullName, { align: 'left' });
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#2563eb').text(s.roleTitle, { align: 'left' });
    doc.moveDown(0.3);

    // Contact info
    doc.fontSize(9).font('Helvetica').fillColor('#475569')
      .text(`${s.email}   |   ${s.phone}   |   ${s.location}   |   ${s.linkedin}`);
    doc.moveDown(0.8);

    // Divider Line
    doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(45, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.8);

    // Section 1: Summary
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a').text('PROFESSIONAL SUMMARY');
    doc.strokeColor('#2563eb').lineWidth(1.5).moveTo(45, doc.y + 2).lineTo(180, doc.y + 2).stroke();
    doc.moveDown(0.5);
    doc.fontSize(9.5).font('Helvetica').fillColor('#334155').text(s.summary, { align: 'justify', lineGap: 2 });
    doc.moveDown(0.9);

    // Section 2: Core Skills
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a').text('CORE COMPETENCIES & SKILLS');
    doc.strokeColor('#2563eb').lineWidth(1.5).moveTo(45, doc.y + 2).lineTo(220, doc.y + 2).stroke();
    doc.moveDown(0.5);
    doc.fontSize(9.5).font('Helvetica').fillColor('#334155').text(s.skills.join('  •  '), { lineGap: 3 });
    doc.moveDown(0.9);

    // Section 3: Work Experience
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a').text('PROFESSIONAL WORK EXPERIENCE');
    doc.strokeColor('#2563eb').lineWidth(1.5).moveTo(45, doc.y + 2).lineTo(230, doc.y + 2).stroke();
    doc.moveDown(0.5);

    s.experiences.forEach(exp => {
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text(exp.role);
      doc.fontSize(9).font('Helvetica-Oblique').fillColor('#64748b').text(`${exp.company}   (${exp.period})`);
      doc.moveDown(0.3);

      exp.bullets.forEach(b => {
        doc.fontSize(9).font('Helvetica').fillColor('#334155').text(`•  ${b}`, {
          indent: 8,
          lineGap: 2
        });
      });
      doc.moveDown(0.6);
    });

    // Section 4: Education
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a').text('EDUCATION & QUALIFICATION');
    doc.strokeColor('#2563eb').lineWidth(1.5).moveTo(45, doc.y + 2).lineTo(210, doc.y + 2).stroke();
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text(s.education.degree);
    doc.fontSize(9).font('Helvetica').fillColor('#475569').text(`${s.education.institution} (${s.education.year})`);

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

module.exports = { generateTxt, generatePdf };
