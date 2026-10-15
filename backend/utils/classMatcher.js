/**
 * Utility functions for class normalization and matching across batches, exams, and student profiles.
 * Handles cases where a class filter or exam target is general (e.g. "Class 11")
 * while student profiles have stream-specific designations (e.g. "Class 11 (Science)").
 */

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Builds a RegExp to match studentClass values in MongoDB or JavaScript.
 * E.g.:
 *  "Class 11" -> matches "Class 11", "Class 11 (Science)", "Class 11 (Commerce)", "Class 11th", "11th"
 *  "Class 11 (Science)" -> matches "Class 11 (Science)"
 *  "All" or "All Classes" or "" -> returns null (matches all)
 */
function buildClassRegex(targetClass) {
  if (!targetClass) return null;
  const trimmed = targetClass.trim();
  if (['all', 'all classes'].includes(trimmed.toLowerCase())) return null;

  // Stream-specific class, e.g. "Class 11 (Science)"
  const streamMatch = trimmed.match(/^Class\s*(\d+)(?:th|st|nd|rd)?\s*\((.+)\)$/i);
  if (streamMatch) {
    const num = streamMatch[1];
    const stream = escapeRegex(streamMatch[2].trim());
    return new RegExp(`^(?:Class\\s*)?${num}(?:th|st|nd|rd)?\\s*\\(${stream}\\)$`, 'i');
  }

  // Base class with number, e.g. "Class 11", "Class 9", "11th", "11"
  const classNumMatch = trimmed.match(/^(?:Class\s*)?(\d+)(?:th|st|nd|rd)?$/i);
  if (classNumMatch) {
    const num = classNumMatch[1];
    return new RegExp(`^(?:Class\\s*)?${num}(?:th|st|nd|rd)?(?:\\b|\\s*\\(.*|\\s+.*|-.*|$)`, 'i');
  }

  // Exact fallback for custom strings, e.g. "Competitive Prep", "Foundation"
  return new RegExp(`^${escapeRegex(trimmed)}$`, 'i');
}

/**
 * Checks whether an exam's targeted class matches a student's profile class.
 */
function isClassMatch(examClass, studentClass) {
  if (!examClass || ['all', 'all classes'].includes(examClass.trim().toLowerCase())) {
    return true;
  }
  if (!studentClass || ['all', 'all classes'].includes(studentClass.trim().toLowerCase())) {
    return true;
  }

  const eTrim = examClass.trim().toLowerCase();
  const sTrim = studentClass.trim().toLowerCase();
  if (eTrim === sTrim) return true;

  const eRegex = buildClassRegex(examClass);
  if (eRegex && eRegex.test(studentClass)) return true;

  return false;
}

module.exports = {
  escapeRegex,
  buildClassRegex,
  isClassMatch,
};
