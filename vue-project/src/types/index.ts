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
    id?: string; // Assuming ID is returned but not in create body
    registered_association: boolean;
    name: string;
    type: string;
    category: string;
    number: string;
    street_house_number: string;
    postal_code: string;
    city: string;
    name_extension: string;
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
    letter_salutation: string;
    phone1: string;
    email: string;
    joined_at: string; // YYYY-MM-DD
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
