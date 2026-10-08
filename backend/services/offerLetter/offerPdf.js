/**
 * Renders the offer document model (offerDocument.js) as an A4 PDF with pdfkit.
 * Usage: renderOfferPdf(doc, writableStream) — e.g. the Express response.
 */
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const SLATE = '#0f172a';
const MUTED = '#64748b';
const BLUE = '#2563eb';
const LINE = '#e2e8f0';
const LOGO = path.join(__dirname, '../../../frontend/public/mra_logo.png');

function renderOfferPdf(model, out) {
  const pdf = new PDFDocument({ size: 'A4', margins: { top: 48, bottom: 56, left: 60, right: 60 }, info: { Title: `${model.title} — ${model.recipient.name}` } });
  pdf.pipe(out);
  const left = pdf.page.margins.left;
  const width = pdf.page.width - left - pdf.page.margins.right;
  const ensure = (h) => {
    if (pdf.y + h > pdf.page.height - pdf.page.margins.bottom) pdf.addPage();
  };

  // Letterhead
  const top = pdf.y;
  let textX = left;
  if (fs.existsSync(LOGO)) {
    try {
      pdf.image(LOGO, left, top, { fit: [84, 36] });
      textX = left + 96;
    } catch {}
  }
  pdf.fillColor(SLATE).font('Helvetica-Bold').fontSize(13).text(model.letterhead.name, textX, top, { width: width - (textX - left) });
  pdf.font('Helvetica').fontSize(8).fillColor(MUTED);
  if (model.letterhead.address) pdf.text(model.letterhead.address, textX, pdf.y + 1, { width: width - (textX - left) });
  if (model.letterhead.npwp) pdf.text(`NPWP ${model.letterhead.npwp}`, textX, pdf.y, { width: width - (textX - left) });
  const ruleY = Math.max(pdf.y, top + 40) + 8;
  pdf.moveTo(left, ruleY).lineTo(left + width, ruleY).lineWidth(2).strokeColor(BLUE).stroke();
  pdf.y = ruleY + 16;

  // Reference, date, recipient
  pdf.fillColor(SLATE).font('Helvetica').fontSize(9.5);
  const refY = pdf.y;
  pdf.text(`${model.reference.label}: ${model.reference.value}`, left, refY);
  pdf.text(model.placeDate, left, refY, { width, align: 'right' });
  pdf.moveDown(1.2);
  pdf.font('Helvetica').text(model.recipient.heading, left);
  pdf.font('Helvetica-Bold').text(model.recipient.name);
  pdf.font('Helvetica').fillColor(MUTED);
  model.recipient.lines.forEach((l) => pdf.text(l));
  pdf.moveDown(1);

  pdf.fillColor(SLATE).font('Helvetica-Bold').fontSize(12).text(model.title, left, pdf.y, { width, align: 'center' });
  pdf.moveDown(0.4);
  pdf.font('Helvetica-Bold').fontSize(9.5).text(model.subject, { width, align: 'center' });
  pdf.moveDown(1);

  pdf.font('Helvetica').fontSize(10).text(model.greeting, left, pdf.y, { width });
  pdf.moveDown(0.5);
  pdf.text(model.intro, { width, align: 'justify' });
  pdf.moveDown(0.6);

  // Terms table
  const labelW = 175;
  const row = (label, value, bold = false) => {
    pdf.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9.5);
    const h = Math.max(pdf.heightOfString(label, { width: labelW - 10 }), pdf.heightOfString(value, { width: width - labelW - 10 })) + 8;
    ensure(h);
    const y = pdf.y;
    pdf.fillColor(MUTED).text(label, left + 6, y + 4, { width: labelW - 10 });
    pdf.fillColor(SLATE).text(value, left + labelW, y + 4, { width: width - labelW - 10 });
    pdf.moveTo(left, y + h).lineTo(left + width, y + h).lineWidth(0.5).strokeColor(LINE).stroke();
    pdf.y = y + h;
  };
  model.terms.forEach((r) => row(r.label, r.value));
  model.pay.forEach((r) => row(r.label, r.value, r === model.pay[0]));
  if (model.total) row(model.total.label, model.total.value, true);
  pdf.x = left;
  pdf.moveDown(0.8);

  const bullets = (block) => {
    if (!block.items.length) return;
    ensure(40);
    pdf.fillColor(SLATE).font('Helvetica-Bold').fontSize(10).text(block.heading, left, pdf.y, { width });
    pdf.moveDown(0.25);
    pdf.font('Helvetica').fontSize(9.5);
    block.items.forEach((it) => {
      ensure(16);
      pdf.text(`•  ${it}`, left + 8, pdf.y, { width: width - 8 });
    });
    pdf.moveDown(0.6);
  };
  bullets(model.benefits);
  bullets(model.additional);

  pdf.font('Helvetica').fontSize(10).fillColor(SLATE);
  model.paragraphs.forEach((p) => {
    ensure(30);
    pdf.text(p, left, pdf.y, { width, align: 'justify' });
    pdf.moveDown(0.5);
  });

  // Sign-off
  ensure(92);
  pdf.moveDown(0.3);
  pdf.text(model.signoff.regards, left);
  pdf.font('Helvetica-Bold').text(model.signoff.company);
  pdf.moveDown(2.6);
  pdf.text(model.signoff.name);
  pdf.font('Helvetica').fillColor(MUTED).text(model.signoff.title);

  // Acceptance (candidate)
  ensure(150);
  pdf.moveDown(1.4);
  const boxY = pdf.y;
  pdf.rect(left, boxY, width, 128).lineWidth(0.8).strokeColor(LINE).stroke();
  pdf.fillColor(SLATE).font('Helvetica-Bold').fontSize(10).text(model.acceptance.title, left + 12, boxY + 12, { width: width - 24 });
  pdf.font('Helvetica').fontSize(9.5).text(model.acceptance.text, left + 12, pdf.y + 4, { width: width - 24 });
  const [nameL, signL, dateL] = model.acceptance.fields;
  const fy = boxY + 74;
  const col = (width - 24) / 3;
  [[nameL, model.acceptance.name], [signL, ''], [dateL, '']].forEach(([label, value], i) => {
    const x = left + 12 + i * col;
    pdf.moveTo(x, fy + 26).lineTo(x + col - 14, fy + 26).lineWidth(0.6).strokeColor(MUTED).stroke();
    if (value) pdf.fillColor(SLATE).font('Helvetica').fontSize(9.5).text(value, x, fy + 12, { width: col - 14 });
    pdf.fillColor(MUTED).fontSize(8).text(label, x, fy + 30, { width: col - 14 });
  });

  pdf.end();
  return pdf;
}

module.exports = { renderOfferPdf };
