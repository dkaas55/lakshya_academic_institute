import { useEffect, useState } from 'react'
import api from '../../lib/api'

const BATCH_OPTIONS = [
  'Morning Batch A',
  'Morning Batch B',
  'Evening Batch A',
  'Evening Batch B',
  'Weekend Batch',
]

const initialForm = {
  name: '',
  email: '',
  password: '',
  joiningDate: new Date().toISOString().split('T')[0],
  compensationType: 'fixed',
  salaryAmount: '',
  studentPercentage: '',
  assignedBatches: [],
}

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState(null)
  
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

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
    setForm(initialForm)
    setFormError('')
    setShowModal(true)
  }

  const openEditModal = (teacher) => {
    setEditingTeacher(teacher)
    setForm({
      name: teacher.name,
      email: teacher.email, // Readonly in edit usually, but keeping it simple
      password: '', // Blank for update
      joiningDate: teacher.joiningDate ? new Date(teacher.joiningDate).toISOString().split('T')[0] : '',
      compensationType: teacher.compensationType || 'fixed',
      salaryAmount: teacher.salaryAmount ?? '',
      studentPercentage: teacher.studentPercentage ?? '',
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
        assignedBatches: form.assignedBatches,
        joiningDate: form.joiningDate || null,
        compensationType: form.compensationType,
      }
      
      if (form.compensationType === 'fixed') {
        payload.salaryAmount = form.salaryAmount !== '' ? Number(form.salaryAmount) : null
        payload.studentPercentage = null
      } else if (form.compensationType === 'percentage') {
        payload.studentPercentage = form.studentPercentage !== '' ? Number(form.studentPercentage) : null
        payload.salaryAmount = null
      }

      if (editingTeacher) {
        // Edit mode (no email/password change supported in this basic endpoint yet unless added to backend, but we didn't add email/password updates to PUT)
        const { data } = await api.put(`/admin/teachers/${editingTeacher.id}`, payload)
        if (data.success) {
          setTeachers(teachers.map(t => t.id === editingTeacher.id ? data.data : t))
          setShowModal(false)
        } else {
          setFormError(data.message || 'Update failed.')
        }
      } else {
        // Create mode
        if (!form.email || !form.password) {
          setFormError('Email and Password are required for a new teacher.')
          setSubmitting(false)
          return
        }
        payload.email = form.email.trim()
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
          <h2 className="text-base font-semibold text-slate-900">Teacher Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Onboard teachers, configure payroll, and allocate batches.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
        >
          + Add Teacher
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">Loading teachers...</div>
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-700">
          {error}
        </div>
      ) : teachers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <p className="text-sm text-slate-500">No teachers found.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 font-semibold text-slate-600">Name & Email</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Payroll</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Batches</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{t.name}</p>
                      <p className="text-[10px] text-slate-500">{t.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      {t.compensationType === 'fixed' ? (
                        <p className="font-medium text-slate-800">₹{t.salaryAmount ?? 0} <span className="text-[10px] text-slate-400 font-normal">/ month</span></p>
                      ) : t.compensationType === 'percentage' ? (
                        <p className="font-medium text-indigo-700">{t.studentPercentage ?? 0}% <span className="text-[10px] text-slate-400 font-normal">split</span></p>
                      ) : (
                        <p className="text-slate-400 text-[10px] italic">Not set</p>
                      )}
                      {t.joiningDate && (
                        <p className="text-[10px] text-slate-400 mt-0.5">Joined {new Date(t.joiningDate).toLocaleDateString()}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {t.assignedBatches?.length > 0 ? t.assignedBatches.map(b => (
                          <span key={b} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 border border-slate-200">
                            {b}
                          </span>
                        )) : <span className="text-slate-400 italic text-[10px]">No batches</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEditModal(t)} className="text-indigo-600 hover:text-indigo-800 font-medium mr-3">Edit</button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-900">
                {editingTeacher ? 'Edit Teacher' : 'Onboard New Teacher'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-6">
              {formError && (
                <div className="rounded-lg bg-red-50 text-red-700 text-xs px-3 py-2 border border-red-100">
                  {formError}
                </div>
              )}

              {/* Basic Info */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 border-b pb-1">Basic Profile</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                    <input
                      required
                      type="text"
                      value={form.name}
                      onChange={e => setForm({...form, name: e.target.value})}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  {!editingTeacher && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                        <input
                          required
                          type="email"
                          value={form.email}
                          onChange={e => setForm({...form, email: e.target.value})}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
                        <input
                          required
                          type="password"
                          value={form.password}
                          onChange={e => setForm({...form, password: e.target.value})}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Joining Date</label>
                    <input
                      type="date"
                      value={form.joiningDate}
                      onChange={e => setForm({...form, joiningDate: e.target.value})}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Payroll Configuration */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 border-b pb-1">Payroll Configuration</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Compensation Type</label>
                    <select
                      value={form.compensationType}
                      onChange={e => setForm({...form, compensationType: e.target.value})}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="fixed">Fixed Monthly Salary</option>
                      <option value="percentage">Percentage Split (per student)</option>
                    </select>
                  </div>
                  
                  {form.compensationType === 'fixed' ? (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Monthly Salary (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={form.salaryAmount}
                        onChange={e => setForm({...form, salaryAmount: e.target.value})}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="e.g. 50000"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Student Percentage Split (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={form.studentPercentage}
                        onChange={e => setForm({...form, studentPercentage: e.target.value})}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="e.g. 30"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Batch Allocation */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 border-b pb-1">Batch Allocation</h4>
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
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {isSelected && <span className="mr-1">✓</span>}
                        {b}
                      </button>
                    )
                  })}
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Select the batches this teacher is responsible for handling.</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                >
                  {submitting ? 'Saving...' : 'Save Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
