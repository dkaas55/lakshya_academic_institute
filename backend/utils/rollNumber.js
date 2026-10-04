/**
 * Generates roll number for a student:
 * Formed by first and last alphabet from their name and the serial number
 * in which their admission is held in the institute.
 *
 * Example:
 *   "Radha",  admission #1  => "RA01"
 *   "Rohit",  admission #2  => "RT02"
 *   "Aditya", admission #7  => "AA07"
 *   "Aditya", admission #8  => "AA08"
 *   "Rohit",  admission #10 => "RT10"
 */
function generateRollNo(fullName, admissionSerial) {
  const letters = String(fullName || '')
    .trim()
    .replace(/[^a-zA-Z]/g, '');
  const first = (letters[0] || 'S').toUpperCase();
  const last = (letters[letters.length - 1] || first).toUpperCase();
  const serial = String(admissionSerial).padStart(2, '0');
  return `${first}${last}${serial}`;
}

module.exports = { generateRollNo };
