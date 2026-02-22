import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { initializeAgencyCompliance, addLeadPaintDisclosure } from '@/lib/compliance/initialize-agency-compliance'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  // Get the agency agreement
  const { data: agency, error: fetchError } = await supabase
    .from('agency_agreements')
    .select('agreement_type, property_type')
    .eq('id', id)
    .single()

  if (fetchError || !agency) {
    return NextResponse.json({ error: 'Agency not found' }, { status: 404 })
  }

  // Check if compliance items already exist
  const { data: existing } = await supabase
    .from('agency_compliance_items')
    .select('id')
    .eq('agency_agreement_id', id)
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json({ 
      message: 'Compliance items already exist',
      exists: true 
    })
  }

  // Initialize compliance checklist
  const result = await initializeAgencyCompliance(
    supabase,
    id,
    agency.agreement_type as 'listing_agreement' | 'buyer_agency_agreement',
    agency.property_type || 'residential'
  )

  if (!result.success) {
    return NextResponse.json({ error: 'Failed to create compliance items' }, { status: 500 })
  }

  let totalItemsCreated = result.items?.length || 0

  // Check if there's a linked listing with pre-1978 year built
  if (agency.agreement_type === 'listing_agreement') {
    const { data: listing } = await supabase
      .from('listings')
      .select('year_built')
      .eq('agency_agreement_id', id)
      .maybeSingle()

    if (listing && listing.year_built && listing.year_built < 1978) {
      const leadPaintResult = await addLeadPaintDisclosure(
        supabase, 
        id, 
        listing.year_built,
        listing.property_type || agency.property_type || 'residential'
      )
      if (leadPaintResult.added) {
        totalItemsCreated++
      }
    }
  }

  return NextResponse.json({ 
    success: true,
    itemsCreated: totalItemsCreated,
    items: result.items
  })
}
