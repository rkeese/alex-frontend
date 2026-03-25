export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
}

export interface LoginResponse {
    token: string;
}

export interface Club {
    id?: string;
    registered_association: boolean;
    name: string;
    type?: string;
    category?: string;
    number?: string;
    street_house_number?: string;
    postal_code?: string;
    city?: string;
    name_extension?: string;
    address_extension?: string;
    tax_office_name?: string;
    tax_office_tax_number?: string;
    tax_office_assessment_period?: string;
    tax_office_purpose?: string;
    tax_office_decision_date?: string;
    tax_office_decision_type?: string;
}

export interface Member {
    id?: string;
    member_number: string;
    first_name: string;
    last_name: string;
    birth_date: string; // YYYY-MM-DD
    gender: string;
    street_house_number: string;
    postal_code: string;
    city: string;
    honorary: boolean;
    status: string;
    salutation: string;
    letter_salutation: string; // Briefanrede
    title: string;
    phone1: string; // Telefon
    phone2: string; // Mobil
    email: string;
    joined_at: string; // YYYY-MM-DD
    left_at: string; // Mitglied bis

    country: string;
    marital_status: string;
    notes: string;

    // Contribution / Role info in CSV
    contribution_name?: string;
    contribution_type?: string;
    contribution_amount?: string; // decimal string
    contribution_period?: string; 
    contribution_due_date?: string;

    // New Fee structure
    fee_amount?: number;
    fee_period?: string; // 'monthly', 'quarterly', 'half_yearly', 'yearly'
    fee_label?: string;
    fee_assignment?: string; // e.g. '1_ideel'
    creditor_account_id?: string; // Club Bank Account UUID (Fee Override)
    assigned_club_bank_id?: string; // Default Club Bank Account (Member Level)
    fee_maturity?: string; // YYYY-MM-DD
    fee_starts_at?: string; // YYYY-MM-DD

    // Payment / SEPA
    payment_method: string;
    iban: string;
    account_holder: string;
    sepa_mandate_granted: boolean | string; // Boolean in payload, might be string in UI handling temporarily
    mandate_reference: string;
    mandate_type: string;
    mandate_kind: string; // 'recurrent' | 'one_off'
    next_debit_type: string;
    mandate_granted_at: string;
    mandate_valid_until: string; // YYYY-MM-DD
    last_usage_at: string;
    
    // Internal
    bank_account_id?: string;
    
    // Auth Link
    user_id?: string;
}

export interface BoardMember {
    id: string;
    club_id: string;
    member_id: string;
    user_id: string;
    position: string; // The backend response uses 'position'
    first_name: string;
    last_name: string;
    member_number: string;
    email: string;
}

export interface BoardMemberCreateRequest {
    member_id: string;
    task: string; // The backend payload uses 'task'
    roles: string[];
}

export interface BoardMemberUpdateRequest {
    task: string;
    roles: string[];
}

export interface Role {
    id: string;
    name: string;
    created_at?: string;
}

export interface Department {
    id?: string;
    name: string;
    subdivision: string;
    parent_id?: string;
}

export interface BookingAccount {
    id?: string;
    majority_list: string;
    majority_list_description?: string;
    minority_list: string;
    minority_list_description?: string;
}

export interface InvoiceItem {
    description: string;
    quantity: number;
    net_amount: number;
    tax_rate: number;
    vat_amount: number;
    gross_amount: number;
}

export interface Receipt {
    id?: string;
    club_id?: string;
    type: 'income' | 'expense' | string;
    recipient: string;
    number: string;
    date: string; // YYYY-MM-DD
    position_assignment?: string | null;
    amount: number;
    is_booked: boolean;
    note?: string;
    position_tax_account?: string;
    position_percentage?: number;
    donor_id?: string;

    // NEW FIELDS
    seller_name?: string;
    seller_address?: string;
    seller_tax_id?: string;
    seller_vat_id?: string;

    buyer_name?: string;
    buyer_address?: string;
    
    delivery_date?: string; // YYYY-MM-DD
    total_vat_amount?: number; 
    invoice_items?: InvoiceItem[];
    
    created_at?: string;
    updated_at?: string;
}

export interface SepaMember {
    member_id: string;
    first_name: string;
    last_name: string;
    amount: number;
    fee_label: string;
    member_iban: string;
    member_bic: string;
    mandate_reference: string;
    mandate_issued_at: string;
    sequence_type: string;
    target_account_holder: string;
    target_iban: string;
    target_bank_name?: string;
}

export interface BankAccount {
    id?: string;
    name: string;
    account_holder: string;
    creditor_id: string;
    iban: string;
    bic: string;
    is_default: boolean;
}

export interface SepaXmlRequest {
    execution_date: string; // YYYY-MM-DD
}

export interface CalendarEvent {
    id?: string;
    club_id?: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    description: string;
    created_at?: string;
    updated_at?: string;
}

export interface DocumentCategory {
    id: string;
    club_id: string;
    name: string;
    description: string | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export interface DocumentInfo {
    id: string;
    club_id: string;
    name: string;
    category_id: string | null;
    description: string | null;
    created_at: string;
    updated_at: string;
    category_name: string | null;
}

export interface Document {
    id?: string;
    name?: string;
}

export interface ImportResponse {
    success_count: number;
    errors: string[];
}

export interface User {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    is_blocked?: boolean;
    roles?: (string | { name?: string; role?: string; club_id?: string })[];
}

// Remove duplicate Role interface since it is defined on line 125
// export interface Role {
//     id: string;
//     name: string;
//     created_at?: string;
// }

export interface AssignRoleRequest {
    user_id: string;
    role_name: string;
    club_id?: string;
}

export interface MemberStatistics {
    birth_year: number;
    count_m: number;
    count_f: number;
    count_d: number;
    count_total: number;
}

export interface BirthdayEntry {
    first_name: string;
    last_name: string;
    birth_date: string;
    date: string;
    new_age: number;
}

export interface AnniversaryEntry {
    FirstName: string;
    LastName: string;
    JoinedAt: string;
    AnniversaryDate: string;
    MembershipYears: number;
}

export interface BookingImportResponse {
    message: string;
    count?: number;
    errors?: { row: number; error: string }[];
}

export interface BookingImport {
    id: string;
    valuta_date: string;
    booking_date: string;
    amount: number;
    currency: string;
    payment_participant_name: string; // Updated from client_recipient
    client_recipient?: string; // Legacy/Fallback
    payment_participant_iban?: string;
    client_iban: string;
    purpose: string;
    bank_account_id: string;
}

export interface Booking {
    id: string;
    valuta_date?: string; // Changed to optional to support fallback
    booking_date?: string; // Legacy support
    amount: number;
    currency?: string;
    payment_participant_name?: string; // Updated field name
    client_recipient?: string; // Legacy support
    client_iban?: string; // New: Counterparty IBAN
    payment_participant_iban?: string; // Alias
    client_bic?: string; // New: Counterparty BIC
    payment_participant_bic?: string; // Alias
    purpose: string;
    external_iban?: string; // Deprecated or alias to client_iban in some contexts
    assigned_booking_account_id?: string | null;
    bank_account_id?: string;
    status?: string;
}

export interface BookingsResponse {
    bookings: Booking[];
    start_amount: number;
    end_amount: number;
}

export interface BankBalance {
    name: string;
    startBalance: number;
    income: number;
    expense: number;
    endBalance: number;
}

export interface OverviewItem {
    name: string;
    income: number;
    expense: number;
    result: number;
}

export interface BookingDetail {
    date: string;
    bookingText: string;
    purpose: string;
    amount: number;
}

export interface FinanceStatementData {
    clubName: string;
    year: number;
    bankBalances: BankBalance[];
    totalBankBalance: BankBalance;
    overview: OverviewItem[];
    totalOverview: OverviewItem;
    details: { [key: string]: BookingDetail[] };
}

export interface FinanceStatement {
    id: string;
    club_id: string;
    year: number;
    data: FinanceStatementData;
    created_at: string;
    updated_at?: string;
}
