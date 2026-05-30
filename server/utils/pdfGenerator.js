const PDFDocument = require('pdfkit');

/**
 * Generates an Offer Letter PDF and pipes it to the response
 * @param {Object} application - The application object containing job and applicant details
 * @param {Object} res - The Express response object to stream the PDF to
 */
const generateOfferLetter = (application, res) => {
  const { job, applicant } = application;
  const employer = job.employer; // assuming populated

  const doc = new PDFDocument({ margin: 50 });

  // Stream directly to the HTTP response
  doc.pipe(res);

  // Set response headers for PDF download
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Offer_Letter_${applicant.name.replace(/\s+/g, '_')}.pdf`);

  // Document Styling & Content
  doc
    .fontSize(24)
    .font('Helvetica-Bold')
    .text(job.company, { align: 'center' })
    .moveDown(2);

  doc
    .fontSize(12)
    .font('Helvetica')
    .text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' })
    .moveDown(2);

  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .text(`Dear ${applicant.name},`, { align: 'left' })
    .moveDown(1);

  doc
    .fontSize(12)
    .font('Helvetica')
    .text(
      `We are thrilled to formally offer you the position of ${job.title} at ${job.company}. We were incredibly impressed by your background and are confident that your skills will be a valuable addition to our team.`
    )
    .moveDown(1);

  doc
    .text(`Position Details:`)
    .moveDown(0.5)
    .text(`• Role: ${job.title}`)
    .text(`• Location: ${job.location}`)
    .text(`• Employment Type: ${job.type.charAt(0).toUpperCase() + job.type.slice(1)}`);

  if (job.salaryMin > 0) {
    const salary = job.salaryMax > job.salaryMin 
      ? `${job.salaryMin} - ${job.salaryMax} ${job.salaryCurrency}`
      : `${job.salaryMin} ${job.salaryCurrency}`;
    doc.text(`• Compensation: ${salary}`);
  }

  doc.moveDown(1);

  doc
    .text(
      `This offer is contingent upon your acceptance and is subject to the standard policies and terms of employment at ${job.company}. Please review this document and indicate your acceptance by signing below.`
    )
    .moveDown(2);

  doc
    .text(`We look forward to welcoming you to the team!`)
    .moveDown(2);

  doc
    .text(`Sincerely,`)
    .moveDown(0.5)
    .font('Helvetica-Bold')
    .text(`The Hiring Team at ${job.company}`);

  doc.moveDown(4);

  // Signature Block
  doc
    .font('Helvetica')
    .text(`_____________________________________`, 50)
    .text(`Accepted by: ${applicant.name}`, 50)
    .text(`Date: ________________________`, 50);

  // Finalize PDF file
  doc.end();
};

module.exports = { generateOfferLetter };
