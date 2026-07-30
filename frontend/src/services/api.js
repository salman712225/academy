// Frontend API service wrapper

// Use VITE_API_URL environment variable in production, fallback to '/api' for local proxy
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('academy_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  if (response.status === 401) {
    localStorage.removeItem('academy_token');
    localStorage.removeItem('academy_user');
    window.dispatchEvent(new Event('auth_change'));
    throw new Error('Session expired. Please log in again.');
  }
  
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const errorMsg = data?.detail || 'An unexpected error occurred';
    throw new Error(errorMsg);
  }
  return data;
};

export const api = {
  // Authentication
  auth: {
    login: async (email, password) => {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await handleResponse(response);
      localStorage.setItem('academy_token', data.access_token);
      localStorage.setItem('academy_user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('auth_change'));
      return data;
    },
    register: async (userData) => {
      const response = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(userData),
      });
      return handleResponse(response);
    },
    logout: () => {
      localStorage.removeItem('academy_token');
      localStorage.removeItem('academy_user');
      window.dispatchEvent(new Event('auth_change'));
    },
    me: async () => {
      const response = await fetch(`${BASE_URL}/auth/me`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    listUsers: async () => {
      const response = await fetch(`${BASE_URL}/auth/users`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    addUser: async (userData) => {
      const response = await fetch(`${BASE_URL}/auth/users`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(userData),
      });
      return handleResponse(response);
    },
    updateUser: async (userId, userData) => {
      const response = await fetch(`${BASE_URL}/auth/users/${userId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(userData),
      });
      return handleResponse(response);
    },
    deleteUser: async (userId) => {
      const response = await fetch(`${BASE_URL}/auth/users/${userId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (response.status === 204) return true;
      return handleResponse(response);
    }
  },

  // Batches
  batches: {
    list: async (openOnly = false) => {
      const response = await fetch(`${BASE_URL}/batches/?open_only=${openOnly}`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    create: async (batchData) => {
      const response = await fetch(`${BASE_URL}/batches/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(batchData),
      });
      return handleResponse(response);
    },
    apply: async (batchId, appData) => {
      const response = await fetch(`${BASE_URL}/batches/${batchId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appData),
      });
      return handleResponse(response);
    },
    listApplications: async () => {
      const response = await fetch(`${BASE_URL}/batches/applications`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    updateApplicationStatus: async (appId, status) => {
      const response = await fetch(`${BASE_URL}/batches/applications/${appId}/status?status_val=${status}`, {
        method: 'PUT',
        headers: getHeaders(),
      });
      return handleResponse(response);
    }
  },

  // Library
  library: {
    listBooks: async () => {
      const response = await fetch(`${BASE_URL}/library/books`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    addBook: async (bookData) => {
      const response = await fetch(`${BASE_URL}/library/books`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(bookData),
      });
      return handleResponse(response);
    },
    lendBook: async (lendData) => {
      const response = await fetch(`${BASE_URL}/library/lend`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(lendData),
      });
      return handleResponse(response);
    },
    returnBook: async (lendingId) => {
      const response = await fetch(`${BASE_URL}/library/return/${lendingId}`, {
        method: 'POST',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    myFines: async () => {
      const response = await fetch(`${BASE_URL}/library/my-fines`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    activeLendings: async () => {
      const response = await fetch(`${BASE_URL}/library/active-lendings`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    updateBook: async (bookId, bookData) => {
      const response = await fetch(`${BASE_URL}/library/books/${bookId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(bookData),
      });
      return handleResponse(response);
    },
    deleteBook: async (bookId) => {
      const response = await fetch(`${BASE_URL}/library/books/${bookId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (response.status === 204) return true;
      return handleResponse(response);
    }
  },

  // Leads
  leads: {
    list: async () => {
      const response = await fetch(`${BASE_URL}/leads/`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    create: async (leadData) => {
      const response = await fetch(`${BASE_URL}/leads/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(leadData),
      });
      return handleResponse(response);
    },
    update: async (leadId, leadData) => {
      const response = await fetch(`${BASE_URL}/leads/${leadId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(leadData),
      });
      return handleResponse(response);
    },
    delete: async (leadId) => {
      const response = await fetch(`${BASE_URL}/leads/${leadId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (response.status === 204) return true;
      return handleResponse(response);
    }
  },

  // Attendance
  attendance: {
    getSchema: async () => {
      const response = await fetch(`${BASE_URL}/attendance/schema`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    myAttendance: async () => {
      const response = await fetch(`${BASE_URL}/attendance/my-attendance`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getBatchAttendance: async (batchId, date = '') => {
      const url = date 
        ? `${BASE_URL}/attendance/batch/${batchId}?date=${encodeURIComponent(date)}`
        : `${BASE_URL}/attendance/batch/${batchId}`;
      const response = await fetch(url, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getBatchStudents: async (batchId) => {
      const response = await fetch(`${BASE_URL}/attendance/batch/${batchId}/students`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    manualUpdate: async (payload) => {
      const response = await fetch(`${BASE_URL}/attendance/manual-update`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(response);
    },
    upload: async (batchId, file) => {
      const formData = new FormData();
      formData.append('batch_id', batchId);
      formData.append('file', file);

      // Authorization header only, let browser set boundary Content-Type
      const token = localStorage.getItem('academy_token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${BASE_URL}/attendance/upload`, {
        method: 'POST',
        headers: headers,
        body: formData,
      });
      return handleResponse(response);
    },
    getStats: async (batchId) => {
      const response = await fetch(`${BASE_URL}/attendance/batch/${batchId}/stats`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    deleteAll: async (batchId) => {
      const response = await fetch(`${BASE_URL}/attendance/batch/${batchId}/all`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    deleteDate: async (batchId, date) => {
      const response = await fetch(`${BASE_URL}/attendance/batch/${batchId}/date/${encodeURIComponent(date)}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(response);
    }
  },

  // Emails
  emails: {
    send: async (emailData) => {
      const response = await fetch(`${BASE_URL}/emails/send`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(emailData),
      });
      return handleResponse(response);
    },
    listSent: async (keyword = '', category = '') => {
      let url = `${BASE_URL}/emails/sent?`;
      if (keyword) url += `keyword=${encodeURIComponent(keyword)}&`;
      if (category) url += `category=${encodeURIComponent(category)}`;
      
      const response = await fetch(url, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    recentRecipients: async (queryStr = '') => {
      const url = `${BASE_URL}/emails/recent-recipients?query_str=${encodeURIComponent(queryStr)}`;
      const response = await fetch(url, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    }
  },

  // Bulk Uploads
  bulkUpload: {
    getSchemas: async () => {
      const response = await fetch(`${BASE_URL}/bulk-upload/schemas`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    uploadStudents: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('academy_token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${BASE_URL}/bulk-upload/students`, {
        method: 'POST',
        headers: headers,
        body: formData,
      });
      return handleResponse(response);
    },
    uploadBooks: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('academy_token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${BASE_URL}/bulk-upload/books`, {
        method: 'POST',
        headers: headers,
        body: formData,
      });
      return handleResponse(response);
    }
  },

  // Events & Calendar
  events: {
    list: async () => {
      const response = await fetch(`${BASE_URL}/events/`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    create: async (eventData) => {
      const response = await fetch(`${BASE_URL}/events/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(eventData),
      });
      return handleResponse(response);
    },
    delete: async (id) => {
      const response = await fetch(`${BASE_URL}/events/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (response.status === 204) return true;
      return handleResponse(response);
    }
  },

  // Documents & Resumes
  documents: {
    uploadNote: async (title, description, file) => {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('file', file);

      const token = localStorage.getItem('academy_token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${BASE_URL}/documents/notes/upload`, {
        method: 'POST',
        headers: headers,
        body: formData,
      });
      return handleResponse(response);
    },
    listNotes: async () => {
      const response = await fetch(`${BASE_URL}/documents/notes`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    deleteNote: async (noteId) => {
      const response = await fetch(`${BASE_URL}/documents/notes/${noteId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (response.status === 204) return true;
      return handleResponse(response);
    },
    uploadResume: async (file) => {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('academy_token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${BASE_URL}/documents/resumes/upload`, {
        method: 'POST',
        headers: headers,
        body: formData,
      });
      return handleResponse(response);
    },
    listResumes: async () => {
      const response = await fetch(`${BASE_URL}/documents/resumes`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getMyResume: async () => {
      const response = await fetch(`${BASE_URL}/documents/resumes/my-resume`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    }
  },

  // Test helpers
  test: {
     triggerDailyCheck: async () => {
       const response = await fetch(`${BASE_URL}/test/trigger-daily-check`, {
         method: 'POST',
         headers: getHeaders(),
       });
       return handleResponse(response);
     }
  }
};
