export type PropertyType =
  | 'residential'
  | 'vacant_land'
  | 'mobile_home'
  | 'commercial'
  | 'multi_unit'
  | 'farm'
  | 'residential_lease'

export type TransactionType =
  | 'listing'
  | 'buyer_agency'
  | 'seller_purchase'
  | 'buyer_purchase'
  | 'unrepresented_buyer'
  | 'fsbo_purchase'

export type TrackingType =
  | 'pdf_auto'
  | 'manual_checkbox'
  | 'manual_upload'
  | 'inherited'
  | 'optional_any'

export type TransactionStatus =
  | 'active'
  | 'pending'
  | 'under_contract'
  | 'pending_closure'
  | 'pending_cancellation'
  | 'closed'
  | 'cancelled'
  | 'canceled'
  | 'failed'

export type RepcCommissionType = 'dollar' | 'percent'

export type LoanType =
  | 'conventional'
  | 'fha'
  | 'va'
  | 'cash'
  | 'seller_financing'
  | 'other'

export type ReceivedVia = 'gmail_watch' | 'email_submission' | 'manual_upload'

export type NotificationPreference = 'real_time' | 'daily_digest' | 'exception_based' | 'dashboard_only'

export interface Broker {
  id: string
  auth_user_id: string
  name: string
  email: string
  google_drive_folder_id: string | null
  google_calendar_id: string | null
  gmail_transactions_email: string | null
  gmail_refresh_token: string | null
  drive_refresh_token: string | null
  calendar_refresh_token: string | null
  submission_address: string | null
  brokerage_name: string | null
  inbound_handle: string | null
  inbound_handle_edited: boolean
  notification_preference: NotificationPreference
  created_at: string
}

export interface Agent {
  id: string
  broker_id: string
  first_name: string
  last_name: string
  email: string
  license_number: string | null
  license_expiration: string | null
  ce_due_date: string | null
  ce_completed_hours: number
  ce_required_hours: number
  ce_core_hours: number
  ce_elective_hours: number
  mandatory_course_completed: boolean
  nar_code_of_ethics_completed: boolean
  nar_fair_housing_completed: boolean
  active: boolean
  created_at: string
}

export interface ComplianceTemplate {
  id: string
  broker_id: string | null // null = system default
  property_type: PropertyType
  transaction_type: TransactionType
  is_custom: boolean
  created_at: string
  updated_at: string
}

export interface TemplateForm {
  id: string
  template_id: string
  form_name: string
  form_identifier: string
  tracking_type: TrackingType
  sort_order: number
  is_required: boolean
  official_name: string | null
  uar_form: string | null
  notes: string | null
}

export interface Transaction {
  id: string
  broker_id: string
  agent_id: string | null
  agency_agreement_id: string | null
  property_type: PropertyType
  transaction_type: TransactionType
  client_last_name: string
  client_first_name: string
  property_address: string | null
  property_city: string | null
  property_state: string | null
  property_zip: string | null
  county: string | null
  tax_id: string | null
  purpose: string | null
  offer_reference_date: string | null
  contract_date: string | null
  purchase_price: number | string | null
  earnest_money_amount: number | string | null
  earnest_money_location: string | null
  earnest_money_held_by: string | null
  earnest_money_contact_name: string | null
  earnest_money_contact_email: string | null
  earnest_money_contact_phone: string | null
  buyer_first_name: string | null
  buyer_last_name: string | null
  buyer_email: string | null
  buyer_phone: string | null
  buyer_2_first_name: string | null
  buyer_2_last_name: string | null
  buyer_2_email: string | null
  buyer_2_phone: string | null
  seller_first_name: string | null
  seller_last_name: string | null
  seller_email: string | null
  seller_phone: string | null
  seller_2_first_name: string | null
  seller_2_last_name: string | null
  seller_2_email: string | null
  seller_2_phone: string | null
  seller_concessions_amount: number | string | null
  seller_concessions_description: string | null
  seller_title_company: string | null
  seller_title_contact_name: string | null
  seller_title_contact_email: string | null
  seller_title_contact_phone: string | null
  buyer_title_company: string | null
  buyer_title_contact_name: string | null
  buyer_title_contact_email: string | null
  buyer_title_contact_phone: string | null
  cooperating_brokerage: string | null
  cooperating_agent_name: string | null
  cooperating_agent_phone: string | null
  cooperating_agent_email: string | null
  seller_disclosure_deadline: string | null
  due_diligence_deadline: string | null
  financing_appraisal_deadline: string | null
  settlement_deadline: string | null
  anticipated_closing_date: string | null
  custom_deadline_1_label: string | null
  custom_deadline_1_date: string | null
  custom_deadline_2_label: string | null
  custom_deadline_2_date: string | null
  repc_commission_amount: number | string | null
  repc_commission_type: RepcCommissionType
  cd_commission_amount: number | string | null
  commission_earnest_money_offset_amount: number | string | null
  commission_notes: string | null
  loan_type: LoanType | null
  repc_notes: string | null
  status: TransactionStatus
  drive_folder_id: string | null
  created_at: string
  updated_at: string
}

export interface TransactionDocument {
  id: string
  transaction_id: string
  form_identifier: string
  form_name: string
  original_filename: string | null
  drive_file_id: string | null
  received_at: string
  received_via: ReceivedVia
  ai_confidence: number | null
  ai_identified_as: string | null
  verified: boolean
  signatures_verified: boolean
  visible: boolean
  visibility_status: 'active' | 'hidden' | 'restored' | 'superseded' | 'rejected'
  hidden_by: string | null
  hidden_at: string | null
  hidden_reason: string | null
  restored_by: string | null
  restored_at: string | null
  created_at: string
}

export interface TransactionDeadline {
  id: string
  transaction_id: string
  label: string
  deadline_date: string
  google_calendar_event_id: string | null
  created_at: string
}

export interface IncomingEmail {
  id: string
  broker_id: string
  received_at: string
  from_address: string
  subject: string
  esign_platform: string | null
  attachment_count: number
  processed: boolean
  transaction_id: string | null
  created_at: string
}

// Joined types for UI
export interface TransactionWithAgent extends Transaction {
  agent: Agent | null
}

export interface TransactionWithDocuments extends Transaction {
  documents: TransactionDocument[]
  deadlines: TransactionDeadline[]
}

// Database schema type (for Supabase client)
export type Database = {
  public: {
    Tables: {
      brokers: {
        Row: Broker
        Insert: Omit<Broker, 'id' | 'created_at' | 'google_drive_folder_id' | 'google_calendar_id' | 'gmail_transactions_email' | 'gmail_refresh_token' | 'drive_refresh_token' | 'calendar_refresh_token' | 'submission_address' | 'brokerage_name' | 'inbound_handle' | 'inbound_handle_edited'> & {
          id?: string
          created_at?: string
          google_drive_folder_id?: string | null
          google_calendar_id?: string | null
          gmail_transactions_email?: string | null
          gmail_refresh_token?: string | null
          drive_refresh_token?: string | null
          calendar_refresh_token?: string | null
          submission_address?: string | null
          brokerage_name?: string | null
          inbound_handle?: string | null
          inbound_handle_edited?: boolean
        }
        Update: Partial<Omit<Broker, 'id'>>
      }
      agents: {
        Row: Agent
        Insert: Omit<Agent, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Agent, 'id'>>
      }
      compliance_templates: {
        Row: ComplianceTemplate
        Insert: Omit<ComplianceTemplate, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<ComplianceTemplate, 'id'>>
      }
      template_forms: {
        Row: TemplateForm
        Insert: Omit<TemplateForm, 'id'> & { id?: string }
        Update: Partial<Omit<TemplateForm, 'id'>>
      }
      transactions: {
        Row: Transaction
        Insert: Omit<Transaction, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<Transaction, 'id'>>
      }
      transaction_documents: {
        Row: TransactionDocument
        Insert: Omit<TransactionDocument, 'id' | 'created_at'> & { id?: string }
        Update: Partial<Omit<TransactionDocument, 'id'>>
      }
      transaction_deadlines: {
        Row: TransactionDeadline
        Insert: Omit<TransactionDeadline, 'id' | 'created_at'> & { id?: string }
        Update: Partial<Omit<TransactionDeadline, 'id'>>
      }
      incoming_emails: {
        Row: IncomingEmail
        Insert: Omit<IncomingEmail, 'id' | 'created_at'> & { id?: string }
        Update: Partial<Omit<IncomingEmail, 'id'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      property_type: PropertyType
      transaction_type: TransactionType
      tracking_type: TrackingType
      transaction_status: TransactionStatus
      received_via: ReceivedVia
    }
  }
}
