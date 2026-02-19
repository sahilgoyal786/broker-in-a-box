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

export type TransactionStatus = 'active' | 'under_contract' | 'closed' | 'cancelled'

export type ReceivedVia = 'gmail_watch' | 'email_submission' | 'manual_upload'

export interface Broker {
  id: string
  name: string
  email: string
  google_drive_folder_id: string | null
  google_calendar_id: string | null
  gmail_transactions_email: string | null
  gmail_refresh_token: string | null
  drive_refresh_token: string | null
  calendar_refresh_token: string | null
  submission_address: string | null
  created_at: string
}

export interface Agent {
  id: string
  broker_id: string
  first_name: string
  last_name: string
  email: string
  license_number: string | null
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
  property_type: PropertyType
  transaction_type: TransactionType
  client_last_name: string
  client_first_name: string
  property_address: string | null
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
        Insert: Omit<Broker, 'id' | 'created_at'> & { id?: string; created_at?: string }
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
