import type {
    LoginRequest,
    RegisterRequest,
    LoginResponse,
    Club,
    Member,
    Department,
    BookingAccount,
    Receipt,
    SepaMember,
    BankAccount,
    SepaXmlRequest,
    CalendarEvent,
    Document,
    DocumentCategory,
    DocumentInfo,
    ImportResponse,
    BoardMember,
    BoardMemberCreateRequest,
    BoardMemberUpdateRequest,
    Role,
    BookingImportResponse,
    Booking,
    FinanceStatement,
} from '../types';

const BASE_URL = '/api/v1';

export class ApiError extends Error {
    status: number;
    retryAfter: number | null;

    constructor(message: string, status: number, retryAfter: number | null = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.retryAfter = retryAfter;
    }
}

class ApiClient {
    private getHeaders(includeClubId: boolean = true): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        const token = sessionStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        if (includeClubId) {
            const clubId = sessionStorage.getItem('clubId');
            if (clubId) {
                headers['X-Club-ID'] = clubId;
            }
        }

        return headers;
    }

    private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
        // Add a default timeout of 10 seconds to prevent hanging
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 10000);
        
        try {
            const response = await fetch(`${BASE_URL}${url}`, {
                ...options,
                signal: options.signal || controller.signal
            });
            clearTimeout(id);

            if (!response.ok) {
                let errorMsg = response.statusText;
                try {
                    const text = await response.text();
                    // Try parsing JSON error response
                    try {
                        const json = JSON.parse(text);
                        if (json.error) errorMsg = json.error;
                        else if (json.message) errorMsg = json.message;
                        else errorMsg = text;
                    } catch {
                        if (text) errorMsg = text;
                    }
                } catch (e) {
                    // ignore parsing error
                }
                const retryAfter = response.headers.get('Retry-After');
                throw new ApiError(
                    `${errorMsg} (${response.status})`,
                    response.status,
                    retryAfter ? parseInt(retryAfter, 10) : null
                );
            }
            if (response.status === 204) {
                return {} as T;
            }
            
            // Try to parse as JSON regardless of Content-Type header to be more robust
            try {
                const text = await response.text();
                if (!text) return {} as T;
                return JSON.parse(text);
            } catch (e) {
                console.error('API Response Parsing Failed for url:', url);
                // Re-read text is not possible, but we know it failed.
                return {} as T;
            }
        } catch (e: any) {
            clearTimeout(id);
            if (e.name === 'AbortError') {
                throw new Error('Request timed out. The backend might be unresponsive.');
            }
            throw e;
        }
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

    async deleteClub(id: string): Promise<void> {
        return this.request<void>(`/clubs/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders(false),
        });
    }

    // Board Members
    async getBoardMembers(clubId: string): Promise<BoardMember[]> {
        return this.request<BoardMember[]>(`/clubs/${clubId}/board-members`, {
            headers: this.getHeaders(true),
        });
    }

    async addBoardMember(clubId: string, data: BoardMemberCreateRequest): Promise<BoardMember> {
        return this.request<BoardMember>(`/clubs/${clubId}/board-members`, {
            method: 'POST',
            headers: this.getHeaders(true),
            body: JSON.stringify(data),
        });
    }

    async updateBoardMember(clubId: string, memberId: string, data: BoardMemberUpdateRequest): Promise<void> {
        return this.request<void>(`/clubs/${clubId}/board-members/${memberId}`, {
            method: 'PUT',
            headers: this.getHeaders(true),
            body: JSON.stringify(data),
        });
    }

    async deleteBoardMember(clubId: string, memberId: string): Promise<void> {
        return this.request<void>(`/clubs/${clubId}/board-members/${memberId}`, {
            method: 'DELETE',
            headers: this.getHeaders(true),
        });
    }

    // User Management / Admin
    // Note: 'getUsers' isn't explicitly in the provided API doc snippet, 
    // but essential for an admin view. Assuming endpoint /users exists or is needed.
    async getUsers(includeClubHeader: boolean = false): Promise<import('../types').User[]> {
        return this.request<import('../types').User[]>('/users', {
            headers: this.getHeaders(includeClubHeader),
        });
    }

    async getUser(id: string, includeClubHeader: boolean = true): Promise<import('../types').User> {
        return this.request<import('../types').User>(`/users/${id}`, {
            headers: this.getHeaders(includeClubHeader),
        });
    }

    async updateUser(id: string, data: any): Promise<void> {
        return this.request<void>(`/users/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(false),
            body: JSON.stringify(data),
        });
    }

    async getRoles(): Promise<Role[]> {
        return this.request<Role[]>('/roles', {
            // Roles are global definitions
            headers: this.getHeaders(false),
        });
    }

    async getUserRoles(userId: string): Promise<any[]> {
        // Hypothethical endpoint based on REST best practices if main user object doesn't have it
        return this.request<any[]>(`/users/${userId}/roles`, {
             headers: this.getHeaders(true),
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

    async removeRole(data: import('../types').AssignRoleRequest): Promise<void> {
        // Use query parameters for DELETE
        const params = new URLSearchParams();
        params.append('user_id', data.user_id);
        params.append('role_name', data.role_name);
        if (data.club_id) {
            params.append('club_id', data.club_id);
        }

        const headers = this.getHeaders(false);
        // DELETE with no body should not have Content-Type: application/json
        // otherwise some backends try to parse empty body and fail (EOF / 500)
        // @ts-ignore
        delete headers['Content-Type'];

        return this.request<void>(`/users/roles?${params.toString()}`, {
            method: 'DELETE',
            headers: headers,
        });
    }

    async resetUserPassword(userId: string): Promise<{ password: string }> {
        return this.request<{ password: string }>(`/users/${userId}/reset-password`, {
            method: 'POST',
            headers: this.getHeaders(true),
        });
    }

    // Members
    async getMembers(): Promise<Member[]> {
        return this.request<Member[]>('/members', {
            headers: this.getHeaders(),
        });
    }

    async exportMembers(): Promise<void> {
        const response = await fetch(`${BASE_URL}/members/export`, {
            method: 'GET',
            headers: this.getHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Export failed: ${response.statusText}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'members.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    async getMemberStatistics(year: number): Promise<import('../types').MemberStatistics[]> {
        return this.request<import('../types').MemberStatistics[]>(`/members/statistics?year=${year}`, {
            headers: this.getHeaders(),
        });
    }

    async getBirthdayList(year?: number, milestones?: number[]): Promise<import('../types').BirthdayEntry[]> {
        const params = new URLSearchParams();
        if (year) params.append('year', year.toString());
        if (milestones && milestones.length > 0) params.append('milestones', milestones.join(','));
        
        return this.request<import('../types').BirthdayEntry[]>(`/members/birthdays?${params.toString()}`, {
            headers: this.getHeaders(),
        });
    }

    async downloadBirthdayListPdf(year?: number, milestones?: number[]): Promise<void> {
        const params = new URLSearchParams();
        if (year) params.append('year', year.toString());
        if (milestones && milestones.length > 0) params.append('milestones', milestones.join(','));

        const response = await fetch(`${BASE_URL}/members/birthdays/pdf?${params.toString()}`, {
            headers: this.getHeaders(),
        });

        if (!response.ok) {
           throw new Error('Failed to download PDF');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Geburtstagsliste_${year || new Date().getFullYear()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    async getAnniversaryList(year?: number, years?: number[]): Promise<import('../types').AnniversaryEntry[]> {
        const params = new URLSearchParams();
        if (year) params.append('year', year.toString());
        if (years && years.length > 0) params.append('years', years.join(','));
        
        return this.request<import('../types').AnniversaryEntry[]>(`/members/anniversaries?${params.toString()}`, {
            headers: this.getHeaders(),
        });
    }

    async downloadAnniversaryListPdf(year?: number, years?: number[]): Promise<void> {
        const params = new URLSearchParams();
        if (year) params.append('year', year.toString());
        if (years && years.length > 0) params.append('years', years.join(','));

        const response = await fetch(`${BASE_URL}/members/anniversaries/pdf?${params.toString()}`, {
            headers: this.getHeaders(),
        });

        if (!response.ok) {
           throw new Error('Failed to download PDF');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Jubilaeumsliste_${year || new Date().getFullYear()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
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

    async updateMember(id: string, member: Member): Promise<Member> {
        return this.request<Member>(`/members/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(member),
        });
    }

    async inviteMember(clubId: string, memberId: string): Promise<void> {
        return this.request<void>(`/clubs/${clubId}/members/${memberId}/invite`, {
            method: 'POST',
            headers: this.getHeaders(false),
        });
    }

    async deleteMember(id: string): Promise<void> {
        return this.request<void>(`/members/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders(),
        });
    }

    async importMembers(file: File): Promise<ImportResponse> {
        const formData = new FormData();
        formData.append('file', file);

        // API documentation implies only Authorization header is needed (matching the curl command)
        // Pass false to getHeaders to exclude X-Club-ID, using query param instead as suggested by backend
        const headers = this.getHeaders(false);
        // Remove Content-Type to let browser set it with boundary for FormData
        // @ts-ignore
        delete headers['Content-Type'];

        const clubId = sessionStorage.getItem('clubId');
        const url = clubId 
            ? `${BASE_URL}/members/import?club_id=${clubId}`
            : `${BASE_URL}/members/import`;

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: formData,
        });

        if (!response.ok) {
            let errorMsg = response.statusText;
            try {
                const text = await response.text();
                // Log the full error for debugging purposes
                console.error('Import Request Failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: text
                });

                // Try parsing JSON error response
                try {
                    const json = JSON.parse(text);
                    if (json.error) errorMsg = json.error;
                    else if (json.message) errorMsg = json.message;
                    else errorMsg = text;
                } catch {
                    if (text) errorMsg = text;
                }
            } catch (e) {
                console.error('Failed to read error response body:', e);
            }
            throw new Error(`API Error: ${errorMsg}`);
        }

        return await response.json();
    }

    // Departments
    async getDepartments(): Promise<Department[]> {
        return this.request<Department[]>('/departments', {
            headers: this.getHeaders(),
        });
    }

    async getDepartment(id: string): Promise<Department> {
        return this.request<Department>(`/departments/${id}`, {
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

    async updateReceipt(id: string, receipt: Receipt): Promise<Receipt> {
        return this.request<Receipt>(`/finance/receipts/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(receipt),
        });
    }

    async bookReceipt(id: string): Promise<void> {
        return this.request<void>(`/finance/receipts/${id}/book`, {
            method: 'POST',
            headers: this.getHeaders(),
        });
    }

    async deleteReceipt(id: string): Promise<void> {
        return this.request<void>(`/finance/receipts/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders(),
        });
    }

    async getBankAccounts(): Promise<BankAccount[]> {
        return this.request<BankAccount[]>('/finance/bank-accounts', {
            headers: this.getHeaders(),
        });
    }

    async getClubBanks(clubId: string): Promise<BankAccount[]> {
        return this.request<BankAccount[]>(`/clubs/${clubId}/banks`, {
            headers: this.getHeaders(false),
        });
    }

    async createBankAccount(account: BankAccount): Promise<BankAccount> {
        return this.request<BankAccount>('/finance/bank-accounts', {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(account),
        });
    }

    async getBankAccount(id: string): Promise<BankAccount> {
        return this.request<BankAccount>(`/finance/bank-accounts/${id}`, {
            headers: this.getHeaders(),
        });
    }

    async createFinanceStatement(year: number, initialBalances?: Record<string, number>): Promise<FinanceStatement> {
        return this.request<FinanceStatement>('/finance/statements', {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ year, initial_balances: initialBalances }),
        });
    }

    async getFinanceStatements(): Promise<FinanceStatement[]> {
        return this.request<FinanceStatement[]>('/finance/statements', {
            headers: this.getHeaders(),
        });
    }

    async getFinanceStatement(id: string): Promise<FinanceStatement> {
        return this.request<FinanceStatement>(`/finance/statements/${id}`, {
            headers: this.getHeaders(),
        });
    }

    async deleteFinanceStatement(id: string): Promise<void> {
        return this.request<void>(`/finance/statements/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders(),
        });
    }

    async getFinanceStatementPdf(id: string): Promise<Blob> {
        const response = await fetch(`${BASE_URL}/finance/statements/${id}/pdf`, {
            headers: this.getHeaders(),
        });
        
        if (!response.ok) throw new Error('PDF Download failed');
        return response.blob();
    }

    async updateBankAccount(id: string, account: BankAccount): Promise<BankAccount> {
        return this.request<BankAccount>(`/finance/bank-accounts/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(account),
        });
    }

    async deleteBankAccount(id: string): Promise<void> {
        return this.request<void>(`/finance/bank-accounts/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders(),
        });
    }

    async getSepaMembers(executionDate: string): Promise<SepaMember[]> {
        return this.request<SepaMember[]>(`/finance/sepa-members?execution_date=${executionDate}`, {
            headers: this.getHeaders(),
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

    async importBookings(file: File): Promise<BookingImportResponse> {
        const formData = new FormData();
        formData.append('file', file);
        
        const headers = this.getHeaders();
        // @ts-ignore - Content-Type must be undefined for FormData to set boundary
        delete headers['Content-Type'];

        const response = await fetch(`${BASE_URL}/finance/import/bookings`, {
            method: 'POST',
            headers: headers,
            body: formData,
        });
        
        if (!response.ok) {
            const text = await response.text();
            
            // Try parsing JSON error response which might contain details
            try {
                const json = JSON.parse(text);
                // Return the json if it has the expected error structure, even on non-200 if appropriate?
                // Actually typical REST APIs return 200 for partial success or 400 for bad request. 
                // If the user says "The backend server ... exited immediately", maybe it was crashing.
                // But assuming now it returns a response.
                
                // If it's a 200OK with partial errors, we are in the success block below.
                // If it's a 4xx/5xx with structured errors:
                if (json.errors && Array.isArray(json.errors)) {
                     // Throwing an object that mimics the successful response structure but indicates failure
                     // or just throw it to be caught by the view.
                     throw json; 
                }
                
                throw new Error(json.message || text);
            } catch(e: any) {
                 if (e.errors) throw e; // Propagate the structured error
                 // proceed
            }
             throw new Error(text || 'Import failed');
        }
        return response.json();
    }

    async getPendingBookings(): Promise<import('../types').BookingImport[]> {
        return this.request<import('../types').BookingImport[]>('/finance/import/bookings', {
            headers: this.getHeaders(),
        });
    }

    async updatePendingBooking(id: string, data: Partial<import('../types').BookingImport>): Promise<import('../types').BookingImport> {
        return this.request<import('../types').BookingImport>(`/finance/import/bookings/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
        });
    }

    async deletePendingBooking(id: string): Promise<void> {
        return this.request<void>(`/finance/import/bookings/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders(),
        });
    }

    async commitPendingBooking(id: string, data: import('../types').BookingImport): Promise<void> {
        return this.request<void>(`/finance/import/bookings/${id}/commit`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
        });
    }

    async getBookings(bankAccountId?: string | null, startDate?: string, endDate?: string): Promise<import('../types').BookingsResponse> {
        const params = new URLSearchParams();
        if (bankAccountId) params.append('bank_account_id', bankAccountId);
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);

        const response = await this.request<import('../types').BookingsResponse>(`/finance/bookings?${params.toString()}`, {
            headers: this.getHeaders(),
        });
        
        // Ensure robust return even if backend sends standard list
        if (Array.isArray(response)) {
            return {
                bookings: response,
                start_amount: 0,
                end_amount: 0
            };
        }
        return response;
    }

    async updateBooking(id: string, data: { assigned_booking_account_id: string | null }): Promise<void> {
        return this.request<void>(`/finance/bookings/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
        });
    }

    // Calendar
    private normalizeEvent(event: any): CalendarEvent {
        if (!event) return event;
        // Handle weird Go pgtype.Time JSON format: { Microseconds: 64800000000, Valid: true }
        if (event.time && typeof event.time === 'object' && 'Microseconds' in event.time) {
            const seconds = Math.floor(event.time.Microseconds / 1000000);
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            event.time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }
        return event;
    }

    async getEvents(): Promise<CalendarEvent[]> {
        const events = await this.request<any[]>('/calendar/events', {
            headers: this.getHeaders(),
        });
        return events.map(e => this.normalizeEvent(e));
    }

    async createEvent(event: CalendarEvent): Promise<CalendarEvent> {
        const created = await this.request<any>('/calendar/events', {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(event),
        });
        return this.normalizeEvent(created);
    }

    async updateEvent(id: string, event: CalendarEvent): Promise<CalendarEvent> {
        const updated = await this.request<any>(`/calendar/events/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(event),
        });
        return this.normalizeEvent(updated);
    }

    async deleteEvent(id: string): Promise<void> {
        return this.request<void>(`/calendar/events/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders(),
        });
    }

    async exportEventsPdf(year: number, month?: number): Promise<Blob> {
        const params = new URLSearchParams();
        params.append('year', year.toString());
        if (month) {
            params.append('month', month.toString());
        }

        const response = await fetch(`${BASE_URL}/calendar/events/pdf?${params.toString()}`, {
            headers: this.getHeaders(),
        });
        
        if (!response.ok) throw new Error('Download failed');
        return response.blob();
    }

    // Document Categories
    async getDocumentCategories(): Promise<DocumentCategory[]> {
        return this.request<DocumentCategory[]>('/document-categories', {
            headers: this.getHeaders(),
        });
    }

    async createDocumentCategory(data: { name: string; description?: string; sort_order?: number }): Promise<DocumentCategory> {
        return this.request<DocumentCategory>('/document-categories', {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
        });
    }

    async updateDocumentCategory(id: string, data: { name: string; description?: string; sort_order?: number }): Promise<DocumentCategory> {
        return this.request<DocumentCategory>(`/document-categories/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
        });
    }

    async deleteDocumentCategory(id: string): Promise<void> {
        return this.request<void>(`/document-categories/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders(),
        });
    }

    // Documents
    async getDocuments(categoryId?: string): Promise<DocumentInfo[]> {
        const params = categoryId ? `?category_id=${encodeURIComponent(categoryId)}` : '';
        return this.request<DocumentInfo[]>(`/documents${params}`, {
            headers: this.getHeaders(),
        });
    }

    async uploadDocument(file: File, categoryId?: string, description?: string): Promise<DocumentInfo> {
        const formData = new FormData();
        formData.append('file', file);
        if (categoryId) formData.append('category_id', categoryId);
        if (description) formData.append('description', description);
        
        const headers = this.getHeaders();
        // @ts-ignore - Content-Type must be undefined for FormData to set boundary
        delete headers['Content-Type'];

        const response = await fetch(`${BASE_URL}/documents`, {
            method: 'POST',
            headers: headers,
            body: formData,
        });
        
        if (!response.ok) {
            let errorMsg = 'Upload failed';
            try {
                const text = await response.text();
                const json = JSON.parse(text);
                if (json.error) errorMsg = json.error;
                else if (json.message) errorMsg = json.message;
            } catch { /* keep default */ }
            throw new Error(errorMsg);
        }
        return response.json();
    }

    async updateDocument(id: string, data: { name: string; category_id?: string | null; description?: string }): Promise<DocumentInfo> {
        return this.request<DocumentInfo>(`/documents/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
        });
    }

    async downloadDocument(id: string, fileName?: string): Promise<void> {
        const response = await fetch(`${BASE_URL}/documents/${id}/download`, {
            headers: this.getHeaders(),
        });
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || 'download';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    async deleteDocument(id: string): Promise<void> {
        return this.request<void>(`/documents/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders(),
        });
    }
}

export const api = new ApiClient();
