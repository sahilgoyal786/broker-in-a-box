import { SupabaseClient } from '@supabase/supabase-js'

// ========================================
// RESIDENTIAL LISTING
// ========================================
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

// ========================================
// RESIDENTIAL BUYER AGENCY
// ========================================
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

// ========================================
// VACANT LAND LISTING
// ========================================
const VACANT_LAND_LISTING_FORMS = [
  {
    form_name: 'EXCLUSIVE RIGHT TO SELL LISTING AGREEMENT & AGENCY DISCLOSURE',
    tracking_type: 'manual_checkbox',
    is_required: true,
    sort_order: 1
  },
  {
    form_name: 'Data Form - Land',
    tracking_type: 'manual_checkbox',
    is_required: true,
    sort_order: 2
  },
  {
    form_name: "SELLER'S PROPERTY CONDITION DISCLOSURE -- LAND",
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

// ========================================
// VACANT LAND BUYER AGENCY
// ========================================
const VACANT_LAND_BUYER_FORMS = [
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
    form_name: 'WIRE FRAUD ALERT',
    tracking_type: 'manual_checkbox',
    is_required: true,
    sort_order: 3
  }
]

// ========================================
// MULTI-UNIT LISTING
// ========================================
const MULTI_UNIT_LISTING_FORMS = [
  {
    form_name: 'EXCLUSIVE RIGHT TO SELL LISTING AGREEMENT & AGENCY DISCLOSURE',
    tracking_type: 'manual_checkbox',
    is_required: true,
    sort_order: 1
  },
  {
    form_name: 'Data Form - Multi-Unit',
    tracking_type: 'manual_checkbox',
    is_required: true,
    sort_order: 2
  },
  {
    form_name: "COMMERCIAL SELLER'S PROPERTY CONDITION DISCLOSURE",
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

// ========================================
// COMMERCIAL LISTING
// ========================================
const COMMERCIAL_LISTING_FORMS = [
  {
    form_name: 'EXCLUSIVE RIGHT TO SELL LISTING AGREEMENT & AGENCY DISCLOSURE',
    tracking_type: 'manual_checkbox',
    is_required: true,
    sort_order: 1
  },
  {
    form_name: 'Data Form - Commercial',
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

// FARM and RESIDENTIAL_LEASE have no forms defined yet - will be handled as empty

export async function initializeAgencyCompliance(
  supabase: SupabaseClient,
  agencyAgreementId: string,
  agreementType: 'listing_agreement' | 'buyer_agency_agreement',
  propertyType: string = 'residential'
) {
  // Select the appropriate form list based on property type and agreement type
  let forms: any[] = []

  if (agreementType === 'listing_agreement') {
    switch (propertyType) {
      case 'residential':
        forms = RESIDENTIAL_LISTING_FORMS
        break
      case 'vacant_land':
        forms = VACANT_LAND_LISTING_FORMS
        break
      case 'multi_unit':
        forms = MULTI_UNIT_LISTING_FORMS
        break
      case 'commercial':
        forms = COMMERCIAL_LISTING_FORMS
        break
      case 'farm':
      case 'residential_lease':
        // No forms defined yet - return empty but successful
        console.log(`Property type ${propertyType} has no compliance forms defined yet`)
        return { success: true, items: [], message: 'No forms configured for this property type' }
      default:
        console.log(`Unknown property type: ${propertyType}`)
        return { success: true, items: [] }
    }
  } else {
    // Buyer agency - simpler (mostly same across property types)
    switch (propertyType) {
      case 'vacant_land':
        forms = VACANT_LAND_BUYER_FORMS
        break
      case 'residential':
      case 'multi_unit':
      case 'commercial':
      default:
        forms = RESIDENTIAL_BUYER_FORMS
        break
    }
  }

  if (forms.length === 0) {
    return { success: true, items: [], message: 'No forms to create' }
  }

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
  yearBuilt: number,
  propertyType: string = 'residential'
) {
  // Only add if property was built before 1978 (federal requirement)
  if (yearBuilt >= 1978) {
    return { success: true, added: false }
  }

  // Only certain property types require lead paint disclosure
  const requiresLeadPaint = ['residential', 'multi_unit'].includes(propertyType)
  if (!requiresLeadPaint) {
    return { success: true, added: false, message: 'Property type does not require lead paint disclosure' }
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
