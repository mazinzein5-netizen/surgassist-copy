import jsPDF from "jspdf";

export function exportTextToPDF(title, text, patientName = "") {
  // Strip markdown symbols for clean presentation
  const cleanText = text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/__(.+?)__/g, "$1")
    .replace(/`(.+?)`/g, "$1");

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  // Header
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(title, margin, y);
  y += 8;

  if (patientName) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Patient: ${patientName}`, margin, y);
    y += 6;
  }

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(`Generated: ${new Date().toLocaleString("en-IE")}`, margin, y);
  y += 4;
  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;
  doc.setTextColor(0);

  // Body
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const lines = doc.splitTextToSize(cleanText, maxWidth);
  const lineHeight = 5;

  lines.forEach((line) => {
    if (y > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  });

  // Footer on each page
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `HIVE Surgical Assistant — Page ${i} of ${pageCount} — AI-generated, verify clinically`,
      margin,
      pageHeight - 10
    );
  }

  const fileName = `${title.replace(/[^a-zA-Z0-9]/g, "_")}${patientName ? "_" + patientName.replace(/\s/g, "_") : ""}.pdf`;
  doc.save(fileName);
}