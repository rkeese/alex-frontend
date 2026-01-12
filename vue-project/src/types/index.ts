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
    contribution_name: string;
    contribution_type: string;
    contribution_amount: string; // decimal string
    contribution_period: string; 
    contribution_due_date: string;

    // Payment / SEPA
    payment_method: string;
    iban: string;
    account_holder: string;
    sepa_mandate_granted: string; // "Ja", "Nein", "Einzug", or date
    mandate_reference: string;
    mandate_type: string;
    next_debit_type: string;
    mandate_granted_at: string;
    last_usage_at: string;
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
    minority_list: string;
}

export interface Receipt {
    id?: string;
    type: string;
    recipient: string;
    number: string;
    date: string; // YYYY-MM-DD
    position_assignment: string;
    amount: number;
    is_booked: boolean;
    note: string;
    donor_id?: string;
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
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    description: string;
}

export interface Document {
    id?: string;
    name?: string; // Assuming name is returned
    // Add other fields if known, otherwise generic
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
    roles?: (string | { name?: string; role?: string; club_id?: string })[];
}

export interface Role {
    id: string;
    name: string;
    created_at?: string;
}

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
