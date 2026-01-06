import type {
    LoginRequest,
    RegisterRequest,
    LoginResponse,
    Club,
    Member,
    Department,
    BookingAccount,
    Receipt,
    BankAccount,
    SepaXmlRequest,
    CalendarEvent,
    Document
} from '../types';

const BASE_URL = '/api/v1';

class ApiClient {
    private getHeaders(includeClubId: boolean = true): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        if (includeClubId) {
            const clubId = localStorage.getItem('clubId');
            if (clubId) {
                headers['X-Club-ID'] = clubId;
            }
        }

        return headers;
    }

    private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
        const response = await fetch(`${BASE_URL}${url}`, options);
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        if (response.status === 204) {
            return {} as T;
        }
        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return response.json();
        }
        return {} as T; // For non-JSON responses or empty bodies
    }

    // Auth
    async login(credentials: LoginRequest): Promise<LoginResponse> {
        return this.request<LoginResponse>('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });
    }

    async register(data: RegisterRequest): Promise<LoginResponse> {
        return this.request<LoginResponse>('/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
    }

    // Clubs
    async getClubs(): Promise<Club[]> {
        return this.request<Club[]>('/clubs', {
            headers: this.getHeaders(false),
        });
    }

    async createClub(club: Club): Promise<Club> {
        return this.request<Club>('/clubs', {
            method: 'POST',
            headers: this.getHeaders(false),
            body: JSON.stringify(club),
        });
    }

    async getClub(id: string): Promise<Club> {
        return this.request<Club>(`/clubs/${id}`, {
            headers: this.getHeaders(false),
        });
    }

    async updateClub(id: string, club: Club): Promise<Club> {
        return this.request<Club>(`/clubs/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(false),
            body: JSON.stringify(club),
        });
    }

    // User Management / Admin
    // Note: 'getUsers' isn't explicitly in the provided API doc snippet, 
    // but essential for an admin view. Assuming endpoint /users exists or is needed.
    async getUsers(): Promise<import('../types').User[]> {
        return this.request<import('../types').User[]>('/users', {
            headers: this.getHeaders(false),
        });
    }

    async getRoles(): Promise<import('../types').Role[]> {
        return this.request<import('../types').Role[]>('/roles', {
            // Roles are global definitions
            headers: this.getHeaders(false),
        });
    }

    async assignRole(data: import('../types').AssignRoleRequest): Promise<void> {
        return this.request<void>('/users/roles', {
            method: 'POST',
            // Assigning role is a system action, though it links to a club via body
            headers: this.getHeaders(false),
            body: JSON.stringify(data),
        });
    }

    // Members
    async getMembers(): Promise<Member[]> {
        return this.request<Member[]>('/members', {
            headers: this.getHeaders(),
        });
    }

    async getMember(id: string): Promise<Member> {
        return this.request<Member>(`/members/${id}`, {
            headers: this.getHeaders(),
        });
    }

    async createMember(member: Member): Promise<Member> {
        return this.request<Member>('/members', {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(member),
        });
    }

    async importMembers(file: File): Promise<void> {
        const formData = new FormData();
        formData.append('file', file);

        const headers = this.getHeaders();
        // Remove Content-Type to let browser set it with boundary for FormData
        // @ts-ignore
        delete headers['Content-Type'];

        const response = await fetch(`${BASE_URL}/members/import`, {
            method: 'POST',
            headers: headers,
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
    }

    async updateMember(id: string, member: Member): Promise<Member> {
        return this.request<Member>(`/members/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(member),
        });
    }

    async deleteMember(id: string): Promise<void> {
        return this.request<void>(`/members/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders(),
        });
    }

    // Departments
    async getDepartments(): Promise<Department[]> {
        return this.request<Department[]>('/departments', {
            headers: this.getHeaders(),
        });
    }

    async createDepartment(department: Department): Promise<Department> {
        return this.request<Department>('/departments', {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(department),
        });
    }

    async updateDepartment(id: string, department: Department): Promise<Department> {
        return this.request<Department>(`/departments/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(department),
        });
    }

    async deleteDepartment(id: string): Promise<void> {
        return this.request<void>(`/departments/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders(),
        });
    }

    // Finance
    async getBookingAccounts(): Promise<BookingAccount[]> {
        return this.request<BookingAccount[]>('/finance/booking-accounts', {
            headers: this.getHeaders(),
        });
    }

    async createBookingAccount(account: BookingAccount): Promise<BookingAccount> {
        return this.request<BookingAccount>('/finance/booking-accounts', {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(account),
        });
    }

    async getReceipts(): Promise<Receipt[]> {
        return this.request<Receipt[]>('/finance/receipts', {
            headers: this.getHeaders(),
        });
    }

    async createReceipt(receipt: Receipt): Promise<Receipt> {
        return this.request<Receipt>('/finance/receipts', {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(receipt),
        });
    }

    async getBankAccounts(): Promise<BankAccount[]> {
        return this.request<BankAccount[]>('/finance/bank-accounts', {
            headers: this.getHeaders(),
        });
    }

    async createBankAccount(account: BankAccount): Promise<BankAccount> {
        return this.request<BankAccount>('/finance/bank-accounts', {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(account),
        });
    }

    async generateSepaXml(data: SepaXmlRequest): Promise<Blob> {
        const response = await fetch(`${BASE_URL}/finance/sepa-xml`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to generate SEPA XML');
        return response.blob();
    }

    async generateDonationReceiptPdf(id: string): Promise<Blob> {
        const response = await fetch(`${BASE_URL}/finance/receipts/${id}/pdf`, {
            headers: this.getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to generate PDF');
        return response.blob();
    }

    // Calendar
    async getEvents(): Promise<CalendarEvent[]> {
        return this.request<CalendarEvent[]>('/calendar/events', {
            headers: this.getHeaders(),
        });
    }

    async createEvent(event: CalendarEvent): Promise<CalendarEvent> {
        return this.request<CalendarEvent>('/calendar/events', {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(event),
        });
    }

    async updateEvent(id: string, event: CalendarEvent): Promise<CalendarEvent> {
        return this.request<CalendarEvent>(`/calendar/events/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(event),
        });
    }

    async deleteEvent(id: string): Promise<void> {
        return this.request<void>(`/calendar/events/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders(),
        });
    }

    // Documents
    async getDocuments(): Promise<Document[]> {
        return this.request<Document[]>('/documents', {
            headers: this.getHeaders(),
        });
    }

    async uploadDocument(file: File): Promise<Document> {
        const formData = new FormData();
        formData.append('file', file);
        
        const headers = this.getHeaders();
        // @ts-ignore - Content-Type must be undefined for FormData to set boundary
        delete headers['Content-Type'];

        const response = await fetch(`${BASE_URL}/documents`, {
            method: 'POST',
            headers: headers,
            body: formData,
        });
        
        if (!response.ok) throw new Error('Upload failed');
        return response.json();
    }

    async downloadDocument(id: string): Promise<Blob> {
        const response = await fetch(`${BASE_URL}/documents/${id}/download`, {
            headers: this.getHeaders(),
        });
        if (!response.ok) throw new Error('Download failed');
        return response.blob();
    }
}

export const api = new ApiClient();
