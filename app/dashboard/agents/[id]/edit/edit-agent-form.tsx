'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatPhoneNumber } from '@/lib/phone'

export default function EditAgentForm({ agent }: { agent: any }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    first_name: agent.first_name || '',
    last_name: agent.last_name || '',
    email: agent.email || '',
    phone: formatPhoneNumber(agent.phone || ''),
    address: agent.address || '',
    city: agent.city || '',
    state: agent.state || 'UT',
    zip: agent.zip || '',
    license_number: agent.license_number || '',
    license_expiration: agent.license_expiration || '',
    ce_due_date: agent.ce_due_date || '',
    ce_completed_hours: agent.ce_completed_hours || 0,
    ce_required_hours: agent.ce_required_hours || 18,
    ce_core_hours: agent.ce_core_hours || 0,
    ce_elective_hours: agent.ce_elective_hours || 0,
    mandatory_course_completed: agent.mandatory_course_completed || false,
    nar_code_of_ethics_date: agent.nar_code_of_ethics_date || '',
    nar_fair_housing_date: agent.nar_fair_housing_date || '',
    nar_code_of_ethics_completed: agent.nar_code_of_ethics_completed || false,
    nar_fair_housing_completed: agent.nar_fair_housing_completed || false,
    date_of_birth: agent.date_of_birth || '',
    gender: agent.gender || '',
    primary_board: agent.primary_board || '',
    original_license_date: agent.original_license_date || '',
    current_company: agent.current_company || '',
    hire_date: agent.hire_date || '',
    listings_at_hire: agent.listings_at_hire || 0,
    invite_status: agent.invite_status || 'not_invited',
    payment_method: agent.payment_method || '',
    entity_name: agent.entity_name || '',
    ssn_last_4: agent.ssn_last_4 || '',
    ein: agent.ein || ''
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else if (name === 'phone') {
      setFormData(prev => ({ ...prev, phone: formatPhoneNumber(value) }))
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value === '' ? 0 : parseFloat(value) }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const supabase = createClient()

    // Convert empty date strings to null
    const updateData = {
      ...formData,
      ce_completed_hours: (formData.ce_core_hours || 0) + (formData.ce_elective_hours || 0),
      date_of_birth: formData.date_of_birth || null,
      license_expiration: formData.license_expiration || null,
      ce_due_date: formData.ce_due_date || null,
      original_license_date: formData.original_license_date || null,
      hire_date: formData.hire_date || null,
      nar_code_of_ethics_date: formData.nar_code_of_ethics_date || null,
      nar_fair_housing_date: formData.nar_fair_housing_date || null,
      payment_method: ['person', 'entity'].includes(formData.payment_method)
        ? formData.payment_method
        : null
    }

    const { error } = await supabase
      .from('agents')
      .update(updateData)
      .eq('id', agent.id)

    if (error) {
      alert(`Error updating agent: ${error.message}`)
      setSaving(false)
      return
    }

    router.push(`/dashboard/agents/${agent.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow border border-gray-200 p-8 space-y-8">
      {/* Personal Information */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">Personal Information</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Not specified</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">Contact Information</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State
            </label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              maxLength={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ZIP Code
            </label>
            <input
              type="text"
              name="zip"
              value={formData.zip}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* License Information */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">License Information</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              License Number
            </label>
            <input
              type="text"
              name="license_number"
              value={formData.license_number}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              License Expiration
            </label>
            <input
              type="date"
              name="license_expiration"
              value={formData.license_expiration}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Original License Date
            </label>
            <input
              type="date"
              name="original_license_date"
              value={formData.original_license_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Board
            </label>
            <select
              name="primary_board"
              value={formData.primary_board}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a board...</option>
              <option value="Utah Association of REALTORS® (statewide)">Utah Association of REALTORS® (statewide)</option>
              <option value="Salt Lake Board of REALTORS®">Salt Lake Board of REALTORS®</option>
              <option value="Utah Central Association of REALTORS®">Utah Central Association of REALTORS®</option>
              <option value="Northern Wasatch Association of REALTORS®">Northern Wasatch Association of REALTORS®</option>
              <option value="Tooele County Association of REALTORS®">Tooele County Association of REALTORS®</option>
              <option value="Washington County Board of REALTORS®">Washington County Board of REALTORS®</option>
              <option value="Iron County Board of REALTORS®">Iron County Board of REALTORS®</option>
              <option value="Cache Valley Association of REALTORS®">Cache Valley Association of REALTORS®</option>
              <option value="Park City Board of REALTORS®">Park City Board of REALTORS®</option>
            </select>
          </div>
        </div>
      </div>

      {/* Utah CE Compliance */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">Utah CE Compliance</h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CE Due Date
            </label>
            <input
              type="date"
              name="ce_due_date"
              value={formData.ce_due_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Required Hours
            </label>
            <input
              type="number"
              name="ce_required_hours"
              value={formData.ce_required_hours}
              onChange={handleChange}
              min="0"
              step="0.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Core
            </label>
            <input
              type="number"
              name="ce_core_hours"
              value={formData.ce_core_hours}
              onChange={handleChange}
              min="0"
              step="0.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Elective
            </label>
            <input
              type="number"
              name="ce_elective_hours"
              value={formData.ce_elective_hours}
              onChange={handleChange}
              min="0"
              step="0.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <label className="flex min-h-[98px] items-center gap-3 rounded-lg border border-gray-200 p-4">
            <input
              type="checkbox"
              name="mandatory_course_completed"
              checked={formData.mandatory_course_completed}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>
              <span className="block text-sm font-medium text-gray-700">Mandatory</span>
              <span className="block text-xs text-gray-500">Completed</span>
            </span>
          </label>
        </div>
      </div>

      {/* NAR Compliance */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">NAR Compliance</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code of Ethics Date
            </label>
            <input
              type="date"
              name="nar_code_of_ethics_date"
              value={formData.nar_code_of_ethics_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Required every 3 years</p>
            <label className="mt-3 flex min-h-[70px] items-center gap-3 rounded-lg border border-gray-200 p-4">
              <input
                type="checkbox"
                name="nar_code_of_ethics_completed"
                checked={formData.nar_code_of_ethics_completed}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                <span className="block text-sm font-medium text-gray-700">Completed</span>
                <span className="block text-xs text-gray-500">Code of Ethics</span>
              </span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fair Housing Date
            </label>
            <input
              type="date"
              name="nar_fair_housing_date"
              value={formData.nar_fair_housing_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Required every 3 years</p>
            <label className="mt-3 flex min-h-[70px] items-center gap-3 rounded-lg border border-gray-200 p-4">
              <input
                type="checkbox"
                name="nar_fair_housing_completed"
                checked={formData.nar_fair_housing_completed}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                <span className="block text-sm font-medium text-gray-700">Completed</span>
                <span className="block text-xs text-gray-500">Fair Housing</span>
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Professional Information */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">Professional Information</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Previous Company
            </label>
            <input
              type="text"
              name="current_company"
              value={formData.current_company}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hire Date
            </label>
            <input
              type="date"
              name="hire_date"
              value={formData.hire_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Listings at Hire
            </label>
            <input
              type="number"
              name="listings_at_hire"
              value={formData.listings_at_hire}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Portal Status
            </label>
            <select
              name="invite_status"
              value={formData.invite_status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="not_invited">Not Invited</option>
              <option value="invited">Invited</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tax & Payment Information */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">Tax & Payment Information</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              name="payment_method"
              value={formData.payment_method}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select...</option>
              <option value="person">Pay Agent Personally</option>
              <option value="entity">Pay Agent Entity</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Entity Name
            </label>
            <input
              type="text"
              name="entity_name"
              value={formData.entity_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SSN (Last 4)
            </label>
            <input
              type="text"
              name="ssn_last_4"
              value={formData.ssn_last_4}
              onChange={handleChange}
              maxLength={4}
              pattern="[0-9]{4}"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1234"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              EIN
            </label>
            <input
              type="text"
              name="ein"
              value={formData.ein}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="12-3456789"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4 pt-6 border-t">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
