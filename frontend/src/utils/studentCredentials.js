const INSTITUTE_NAME = 'Institute Admin'

export function tempPasswordFromPhone(phone) {
  const digits = String(phone).replace(/\D/g, '')
  if (digits.length < 4) return ''
  return `Stu@${digits.slice(-6)}`
}

export function studentLoginEmail(phone) {
  const digits = String(phone).replace(/\D/g, '')
  if (!digits) return ''
  return `${digits}@student.institute.local`
}

export function buildWhatsAppInvite({
  fullName,
  phone,
  batch,
  totalCourseFee,
  password,
}) {
  const email = studentLoginEmail(phone)
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
    `Email: ${email || '—'}`,
    `Temporary password: ${password || '—'}`,
    ``,
    `*Enrollment*`,
    `Batch: ${batch || '—'}`,
    `Total course fee: ${feeLabel}`,
    ``,
    `Please sign in and change the password after first login.`,
    ``,
    `Thank you!`,
  ].join('\n')
}
