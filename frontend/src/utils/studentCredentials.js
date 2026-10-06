const INSTITUTE_NAME = 'Institute Admin'

export function tempPasswordFromPhone(phone) {
  const digits = String(phone).replace(/\D/g, '')
  if (digits.length < 4) return ''
  return `Stu@${digits.slice(-6)}`
}

export function generateUsername(phone, fullName = '') {
  const digits = String(phone).replace(/\D/g, '')
  const name = String(fullName).trim().split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
  let baseUsername = `${name}.${digits.slice(-4)}`
  if (!name) baseUsername = `student.${digits.slice(-4)}`
  return baseUsername
}

export function buildWhatsAppInvite({
  fullName,
  rollNo,
  phone,
  batch,
  batches,
  totalCourseFee,
  password,
}) {
  const username = generateUsername(phone, fullName)
  const feeLabel =
    totalCourseFee === '' || totalCourseFee == null
      ? '—'
      : `₹${Number(totalCourseFee).toLocaleString('en-IN')}`

  const batchList = Array.isArray(batches) && batches.length > 0
    ? batches
    : (batch ? (Array.isArray(batch) ? batch : String(batch).split(',').map((b) => b.trim()).filter(Boolean)) : [])
  const batchLabel = batchList.length > 0 ? batchList.join(', ') : '—'
  const batchPrefix = batchList.length > 1 ? 'Batches' : 'Batch'

  return [
    `Hello!`,
    ``,
    `Your ward *${fullName || '—'}* has been registered at *${INSTITUTE_NAME}*.`,
    ...(rollNo ? [`Roll No: *${rollNo}*`] : []),
    ``,
    `*Login details*`,
    `Username: ${username || '—'}`,
    `Temporary password: ${password || '—'}`,
    ``,
    `*Enrollment*`,
    `${batchPrefix}: ${batchLabel}`,
    `Monthly fee: ${feeLabel}`,
    ``,
    `Please sign in and change the password after first login.`,
    ``,
    `Thank you!`,
  ].join('\n')
}
