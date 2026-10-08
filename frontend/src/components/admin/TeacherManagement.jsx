import { useEffect, useState } from 'react'
import api from '../../lib/api'
import useBatches from '../../hooks/useBatches'
import TeacherSalaryModal from './TeacherSalaryModal'
import { IndianRupee } from 'lucide-react'
import { BRANDING } from '../../config/branding'

const generateSecurePassword = () => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*'
  const allChars = lowercase + uppercase + numbers + symbols

  let password = ''
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]

  for (let i = 4; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // Shuffle the password characters
  return password.split('').sort(() => 0.5 - Math.random()).join('')
}

const SUBJECT_OPTIONS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Science',
  'English',
  'Hindi',
  'History',
  'Geography',
  'Economics',
  'Computer Science',
  'Accountancy',
  'Business Studies',
  'Political Science',
  'Psychology',
]

const initialForm = {
  name: '',
  username: '',
  password: '',
  subject: '',
  joiningDate: new Date().toISOString().split('T')[0],
  compensationType: 'batch_based',
  salaryAmount: '',
  studentPercentage: '100',
  assignedBatches: [],
}

export default function TeacherManagement() {
  const { batches: BATCH_OPTIONS } = useBatches()
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState(null)
  const [salaryModalTeacher, setSalaryModalTeacher] = useState(null)
  
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [showPassword, setShowPassword] = useState(true)

  const loadTeachers = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/admin/teachers')
      if (data.success) {
        setTeachers(data.data.teachers)
      } else {
        setError(data.message || 'Failed to load teachers.')
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (err.request ? 'Unable to reach the server.' : 'Something went wrong.')
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTeachers()
  }, [])

  const openAddModal = () => {
    setEditingTeacher(null)
    setForm({
      ...initialForm,
      password: generateSecurePassword()
    })
    setFormError('')
    setShowPassword(true)
    setShowModal(true)
  }

  const openEditModal = (teacher) => {
    setEditingTeacher(teacher)
    setForm({
      name: teacher.name,
      username: teacher.username, // Readonly in edit usually, but keeping it simple
      password: '', // Blank for update
      subject: teacher.subject || '',
      joiningDate: teacher.joiningDate ? new Date(teacher.joiningDate).toISOString().split('T')[0] : '',
      compensationType: teacher.compensationType || 'batch_based',
      salaryAmount: teacher.salaryAmount ?? '',
      studentPercentage: teacher.studentPercentage ?? (teacher.salaryPercentage ?? 100),
      assignedBatches: teacher.assignedBatches || [],
    })
    setFormError('')
    setShowModal(true)
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove teacher ${name}?`)) return
    try {
      const { data } = await api.delete(`/admin/teachers/${id}`)
      if (data.success) {
        setTeachers(teachers.filter(t => t.id !== id))
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete teacher')
    }
  }

  const handleBatchToggle = (batch) => {
    setForm(prev => {
      const active = prev.assignedBatches.includes(batch)
      return {
        ...prev,
        assignedBatches: active 
          ? prev.assignedBatches.filter(b => b !== batch)
          : [...prev.assignedBatches, batch]
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)

    try {
      const payload = {
        name: form.name.trim(),
        subject: form.subject.trim(),
        assignedBatches: form.assignedBatches,
        joiningDate: form.joiningDate || null,
        compensationType: form.compensationType,
      }
      
      if (form.compensationType === 'fixed') {
        payload.salaryAmount = form.salaryAmount !== '' ? Number(form.salaryAmount) : null
        payload.studentPercentage = null
      } else if (form.compensationType === 'batch_based') {
        payload.studentPercentage = form.studentPercentage !== '' ? Number(form.studentPercentage) : 100
        payload.salaryAmount = null
      } else if (form.compensationType === 'percentage') {
        payload.studentPercentage = form.studentPercentage !== '' ? Number(form.studentPercentage) : null
        payload.salaryAmount = null
      }

      if (editingTeacher) {
        // Edit mode (no username/password change supported in this basic endpoint yet unless added to backend, but we didn't add username/password updates to PUT)
        const { data } = await api.put(`/admin/teachers/${editingTeacher.id}`, payload)
        if (data.success) {
          setTeachers(teachers.map(t => t.id === editingTeacher.id ? data.data : t))
          setShowModal(false)
        } else {
          setFormError(data.message || 'Update failed.')
        }
      } else {
        // Create mode
        if (!form.username || !form.password) {
          setFormError('Email and Password are required for a new teacher.')
          setSubmitting(false)
          return
        }
        payload.username = form.username.trim()
        payload.password = form.password
        
        const { data } = await api.post('/admin/teachers', payload)
        if (data.success) {
          setTeachers([data.data, ...teachers])
          setShowModal(false)
        } else {
          setFormError(data.message || 'Creation failed.')
        }
      }
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
          (err.request ? 'Unable to reach the server.' : 'Something went wrong.')
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-brand-text">Teacher Management</h2>
          <p className="text-xs text-brand-text-muted mt-0.5">
            Onboard teachers, configure payroll, and allocate batches.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="rounded-lg bg-brand-primary px-4 py-2 text-xs font-semibold text-brand-surface hover:bg-brand-primary/100 transition-colors"
        >
          + Add Teacher
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-brand-text-muted">Loading teachers...</div>
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-700">
          {error}
        </div>
      ) : teachers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-border bg-brand-surface p-12 text-center">
          <p className="text-sm text-brand-text-muted">No teachers found.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-brand-border bg-brand-surface shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-brand-border bg-brand-surface-tint">
                  <th className="px-4 py-3 font-semibold text-brand-text">Name & Email</th>
                  <th className="px-4 py-3 font-semibold text-brand-text">Payroll</th>
                  <th className="px-4 py-3 font-semibold text-brand-text">{BRANDING.batchesLabel}</th>
                  <th className="px-4 py-3 font-semibold text-brand-text text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {teachers.map(t => (
                  <tr key={t.id} className="hover:bg-brand-surface-tint/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-brand-text">{t.name}</p>
                        {t.subject && (
                          <span className="rounded-md bg-brand-primary/10 text-brand-primary px-2 py-0.5 text-[10px] font-semibold border border-brand-primary/20">
                            {t.subject}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-brand-text-muted">{t.username}</p>
                    </td>
                    <td className="px-4 py-3">
                      {t.compensationType === 'fixed' ? (
                        <p className="font-medium text-brand-text">₹{t.salaryAmount ?? 0} <span className="text-[10px] text-brand-text-muted/75 font-normal">/ month</span></p>
                      ) : t.compensationType === 'percentage' ? (
                        <p className="font-medium text-brand-primary">{t.studentPercentage ?? 0}% <span className="text-[10px] text-brand-text-muted/75 font-normal">split</span></p>
                      ) : (
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-brand-primary border border-indigo-200">
                            Batch Calculation
                          </span>
                          <p className="text-[10px] text-brand-text-muted font-medium mt-0.5">
                            {t.studentPercentage ?? 100}% of batch fee pool
                          </p>
                        </div>
                      )}
                      {t.joiningDate && (
                        <p className="text-[10px] text-brand-text-muted/75 mt-0.5">Joined {new Date(t.joiningDate).toLocaleDateString()}</p>
                      )}
                      {/* Dues Status Badge */}
                      {t.totalPendingDues > 0 ? (
                        <div className="mt-1 flex flex-col gap-0.5">
                          {t.hasOverdue ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 border border-red-200">
                              ⚠️ ₹{t.totalPendingDues.toLocaleString('en-IN')} Due ({t.unpaidMonthsCount} mo)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                              ₹{t.totalPendingDues.toLocaleString('en-IN')} Due this month
                            </span>
                          )}
                          {t.pastOverdueArrears > 0 && (
                            <span className="text-[9px] text-red-600 font-medium">
                              ₹{t.pastOverdueArrears.toLocaleString('en-IN')} overdue from past
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200">
                            ✓ Dues Settled
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {t.assignedBatches?.length > 0 ? t.assignedBatches.map(b => (
                          <span key={b} className="rounded-full bg-brand-surface-tint px-2 py-0.5 text-[10px] text-brand-text border border-brand-border">
                            {b}
                          </span>
                        )) : <span className="text-brand-text-muted/75 italic text-[10px]">No {BRANDING.batchesLabel.toLowerCase()}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSalaryModalTeacher(t)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all shadow-xs mr-2 cursor-pointer ${
                          t.hasOverdue
                            ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                            : t.totalPendingDues > 0
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80'
                        }`}
                        title={t.totalPendingDues > 0 ? `Total Pending Dues: ₹${t.totalPendingDues.toLocaleString('en-IN')}` : 'All dues settled'}
                      >
                        <IndianRupee size={12} strokeWidth={2.5} />
                        {t.totalPendingDues > 0 ? `Pay ₹${t.totalPendingDues.toLocaleString('en-IN')}` : 'Pay Salary'}
                      </button>
                      <button onClick={() => openEditModal(t)} className="text-brand-primary hover:text-indigo-800 font-medium mr-3">Edit</button>
                      <button onClick={() => handleDelete(t.id, t.name)} className="text-red-600 hover:text-red-800 font-medium">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Teacher Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-text/30 backdrop-blur-sm">
          <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border bg-brand-surface-tint/50">
              <h3 className="font-semibold text-brand-text">
                {editingTeacher ? 'Edit Teacher' : 'Onboard New Teacher'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-brand-text-muted/75 hover:text-brand-text">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-6">
              {formError && (
                <div className="rounded-lg bg-red-50 text-red-700 text-xs px-3 py-2 border border-red-100">
                  {formError}
                </div>
              )}

              {/* Basic Info */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted/75 mb-3 border-b pb-1">Basic Profile</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-brand-text mb-1">Full Name</label>
                    <input
                      required
                      type="text"
                      value={form.name}
                      onChange={e => setForm({...form, name: e.target.value})}
                      className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-brand-text mb-1">Teaching Subject</label>
                    <input
                      type="text"
                      list="teacher-subjects-list"
                      value={form.subject}
                      onChange={e => setForm({...form, subject: e.target.value})}
                      placeholder="e.g. Mathematics, Physics"
                      className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-text focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                    />
                    <datalist id="teacher-subjects-list">
                      {SUBJECT_OPTIONS.map((s) => <option key={s} value={s} />)}
                    </datalist>
                    <p className="text-[10px] text-brand-text-muted/75 mt-1">
                      Makes allocating batches fast and accurate
                    </p>
                  </div>
                  {!editingTeacher && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-brand-text mb-1">Username</label>
                        <input
                          type="text"
                          required
                          disabled={!!editingTeacher}
                          value={form.username}
                          onChange={e => setForm({...form, username: e.target.value})}
                          autoComplete="new-username"
                          className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary focus:border-indigo-500 disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-brand-text mb-1">Password</label>
                        <div className="relative flex items-center">
                          <input
                            required
                            type={showPassword ? 'text' : 'password'}
                            value={form.password}
                            onChange={e => setForm({...form, password: e.target.value})}
                            autoComplete="new-password"
                            className="w-full rounded-lg border border-brand-border pl-3 pr-28 py-2 text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                          />
                          <div className="absolute right-2 flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="px-2 py-1 text-[10px] font-semibold text-brand-text bg-brand-surface-tint border border-brand-border rounded hover:bg-brand-surface-tint/80 transition-colors"
                            >
                              {showPassword ? 'Hide' : 'Show'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setForm({...form, password: generateSecurePassword()})}
                              className="px-2 py-1 text-[10px] font-semibold text-brand-primary bg-brand-primary/10 border border-brand-primary/20 rounded hover:bg-brand-primary/20 transition-colors"
                            >
                              Generate
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-brand-text mb-1">Joining Date</label>
                    <input
                      type="date"
                      value={form.joiningDate}
                      onChange={e => setForm({...form, joiningDate: e.target.value})}
                      className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Payroll Configuration */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted/75 mb-3 border-b pb-1">
                  Payroll Configuration
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-brand-text mb-1">
                      Compensation Type
                    </label>
                    <select
                      value={form.compensationType}
                      onChange={(e) => setForm({ ...form, compensationType: e.target.value })}
                      className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                    >
                      <option value="batch_based">{BRANDING.batchLabel} Fee Calculation (From {BRANDING.batchesLabel} Taught)</option>
                      <option value="fixed">Fixed Monthly Salary</option>
                      <option value="percentage">Student Fee Percentage Split</option>
                    </select>
                  </div>

                  {form.compensationType === 'fixed' ? (
                    <div>
                      <label className="block text-xs font-medium text-brand-text mb-1">
                        Monthly Salary (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={form.salaryAmount}
                        onChange={(e) => setForm({ ...form, salaryAmount: e.target.value })}
                        className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                        placeholder="e.g. 50000"
                      />
                    </div>
                  ) : form.compensationType === 'batch_based' ? (
                    <div>
                      <label className="block text-xs font-medium text-brand-text mb-1">
                        Batch Fee Share (%)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={form.studentPercentage}
                        onChange={(e) => setForm({ ...form, studentPercentage: e.target.value })}
                        className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                        placeholder="100 (Default is 100%)"
                      />
                      <p className="text-[10px] text-brand-text-muted/75 mt-1">
                        Calculates salary dynamically: (Students in Batch × Fee Per Student) × {form.studentPercentage || 100}%
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-medium text-brand-text mb-1">
                        Student Percentage Split (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={form.studentPercentage}
                        onChange={(e) => setForm({ ...form, studentPercentage: e.target.value })}
                        className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                        placeholder="e.g. 30"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Batch Allocation */}
              <div>
                <div className="flex items-center justify-between mb-3 border-b pb-1">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted/75">Batch Allocation</h4>
                  {form.subject && (
                    <span className="text-[10px] font-semibold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-md border border-brand-primary/20">
                      Subject: {form.subject}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {BATCH_OPTIONS.map(b => {
                    const isSelected = form.assignedBatches.includes(b)
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => handleBatchToggle(b)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                          isSelected 
                            ? 'bg-brand-primary/10 border-indigo-200 text-brand-primary'
                            : 'bg-brand-surface border-brand-border text-brand-text hover:border-brand-border'
                        }`}
                      >
                        {isSelected && <span className="mr-1">✓</span>}
                        {b}
                      </button>
                    )
                  })}
                </div>
                <p className="text-[10px] text-brand-text-muted/75 mt-2">
                  Select the batches this {form.subject ? `${form.subject} teacher` : 'teacher'} is responsible for handling.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg px-4 py-2 text-xs font-medium text-brand-text hover:bg-brand-surface-tint"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-brand-primary px-5 py-2 text-xs font-semibold text-brand-surface hover:bg-brand-primary/100 disabled:opacity-60"
                >
                  {submitting ? 'Saving...' : 'Save Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teacher Salary & Payment Modal */}
      {salaryModalTeacher && (
        <TeacherSalaryModal
          teacher={salaryModalTeacher}
          onClose={() => setSalaryModalTeacher(null)}
          onPaymentRecorded={loadTeachers}
        />
      )}
    </div>
  )
}
