import { SupabaseClient } from '@supabase/supabase-js'

// Residential listing compliance forms (in workflow order)
const RESIDENTIAL_LISTING_FORMS = [
  {
    form_name: 'EXCLUSIVE RIGHT TO SELL LISTING AGREEMENT & AGENCY DISCLOSURE',
    tracking_type: 'manual_checkbox',
    is_required: true,
    sort_order: 1
  },
  {
    form_name: 'Data Form - Residential',
    tracking_type: 'manual_checkbox',
    is_required: true,
    sort_order: 2
  },
  {
    form_name: "SELLER'S PROPERTY CONDITION DISCLOSURE",
    tracking_type: 'manual_checkbox',
    is_required: true,
    sort_order: 3
  },
  {
    form_name: 'WIRE FRAUD ALERT DISCLOSURE',
    tracking_type: 'manual_checkbox',
    is_required: true,
    sort_order: 4
  }
]

// Residential buyer agency compliance forms (in workflow order)
const RESIDENTIAL_BUYER_FORMS = [
  {
    form_name: 'EXCLUSIVE BUYER-BROKER AGREEMENT & AGENCY DISCLOSURE',
    tracking_type: 'manual_checkbox',
    is_required: true,
    sort_order: 1
  },
  {
    form_name: 'BUYER DUE DILIGENCE CHECKLIST',
    tracking_type: 'manual_checkbox',
    is_required: true,
    sort_order: 2
  },
  {
    form_name: 'FOR YOUR PROTECTION GET AN INSPECTION',
    tracking_type: 'manual_checkbox',
    is_required: true,
    sort_order: 3
  },
  {
    form_name: 'WIRE FRAUD ALERT',
    tracking_type: 'manual_checkbox',
    is_required: true,
    sort_order: 4
  }
]

export async function initializeAgencyCompliance(
  supabase: SupabaseClient,
  agencyAgreementId: string,
  agreementType: 'listing_agreement' | 'buyer_agency_agreement',
  propertyType: string = 'residential'
) {
  // For now, only handle residential
  // TODO: Add other property types (vacant_land, multi_unit, etc.)
  if (propertyType !== 'residential') {
    console.log(`Property type ${propertyType} not yet implemented for compliance`)
    return { success: true, items: [] }
  }

  // Select the appropriate form list
  const forms = agreementType === 'listing_agreement' 
    ? RESIDENTIAL_LISTING_FORMS 
    : RESIDENTIAL_BUYER_FORMS

  // Create compliance items
  const items = forms.map(form => ({
    agency_agreement_id: agencyAgreementId,
    ...form
  }))

  const { data, error } = await supabase
    .from('agency_compliance_items')
    .insert(items)
    .select()

  if (error) {
    console.error('Error creating compliance items:', error)
    return { success: false, error }
  }

  return { success: true, items: data }
}

export async function addLeadPaintDisclosure(
  supabase: SupabaseClient,
  agencyAgreementId: string,
  yearBuilt: number
) {
  // Only add if property was built before 1978 (federal requirement)
  if (yearBuilt >= 1978) {
    return { success: true, added: false }
  }

  // Check if it already exists
  const { data: existing } = await supabase
    .from('agency_compliance_items')
    .select('id')
    .eq('agency_agreement_id', agencyAgreementId)
    .eq('form_name', 'DISCLOSURE & ACKNOWLEDGEMENT REGARDING LEAD-BASED PAINT AND/OR LEAD-BASED PAINT HAZARDS')
    .single()

  if (existing) {
    return { success: true, added: false, message: 'Already exists' }
  }

  // Add lead paint disclosure
  const { data, error } = await supabase
    .from('agency_compliance_items')
    .insert({
      agency_agreement_id: agencyAgreementId,
      form_name: 'DISCLOSURE & ACKNOWLEDGEMENT REGARDING LEAD-BASED PAINT AND/OR LEAD-BASED PAINT HAZARDS',
      tracking_type: 'manual_checkbox',
      is_required: true,
      sort_order: 5
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding lead paint disclosure:', error)
    return { success: false, error }
  }

  return { success: true, added: true, item: data }
}
