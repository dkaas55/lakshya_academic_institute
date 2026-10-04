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
  phone,
  batch,
  totalCourseFee,
  password,
}) {
  const username = generateUsername(phone, fullName)
  const feeLabel =
    totalCourseFee === '' || totalCourseFee == null
      ? '—'
      : `₹${Number(totalCourseFee).toLocaleString('en-IN')}`

  return [
    `Hello!`,
    ``,
    `Your ward *${fullName || '—'}* has been registered at *${INSTITUTE_NAME}*.`,
    ``,
    `*Login details*`,
    `Username: ${username || '—'}`,
    `Temporary password: ${password || '—'}`,
    ``,
    `*Enrollment*`,
    `Batch: ${batch || '—'}`,
    `Monthly fee: ${feeLabel}`,
    ``,
    `Please sign in and change the password after first login.`,
    ``,
    `Thank you!`,
  ].join('\n')
}
