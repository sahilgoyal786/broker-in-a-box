import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { initializeAgencyCompliance } from '@/lib/compliance/initialize-agency-compliance'

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

  return NextResponse.json({ 
    success: true,
    itemsCreated: result.items?.length || 0,
    items: result.items
  })
}
