// Frontend API service wrapper

// Use VITE_API_URL when provided; otherwise fall back to the local backend API.
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:9000/api').replace(/\/$/, '');

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
  BASE_URL,
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
    },
    getPermissions: async () => {
      const response = await fetch(`${BASE_URL}/auth/permissions`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    updatePermissions: async (role, permissions) => {
      const response = await fetch(`${BASE_URL}/auth/permissions/${role}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(permissions),
      });
      return handleResponse(response);
    }
  },

  // Batches
  batches: {
    list: async (openOnly = false, group = '') => {
      const url = `${BASE_URL}/batches/?open_only=${openOnly}${group ? `&group=${encodeURIComponent(group)}` : ''}`;
      const response = await fetch(url, {
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
    apply: async (batchId, formData) => {
      const response = await fetch(`${BASE_URL}/batches/${batchId}/apply`, {
        method: 'POST',
        body: formData,
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
    },
    scheduleInterview: async (appId, details) => {
      const response = await fetch(`${BASE_URL}/batches/applications/${appId}/interview`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(details),
      });
      return handleResponse(response);
    },
    getApplication: async (appId) => {
      const response = await fetch(`${BASE_URL}/batches/applications/${appId}`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    callStudent: async (appId) => {
      const response = await fetch(`${BASE_URL}/batches/applications/${appId}/call`, {
        method: 'POST',
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

  // Digital Library
  digitalLibrary: {
    listBooks: async () => {
      const response = await fetch(`${BASE_URL}/digital-library/books`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getBook: async (bookId) => {
      const response = await fetch(`${BASE_URL}/digital-library/books/${bookId}`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    uploadBook: async (formData) => {
      // Don't set Content-Type so fetch can set it with multipart boundary
      const headers = {};
      const token = localStorage.getItem('academy_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`${BASE_URL}/digital-library/books`, {
        method: 'POST',
        headers: headers,
        body: formData,
      });
      return handleResponse(response);
    },
    deleteBook: async (bookId) => {
      const response = await fetch(`${BASE_URL}/digital-library/books/${bookId}`, {
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
    },
    getSettings: async () => {
      const response = await fetch(`${BASE_URL}/emails/settings`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    saveSettings: async (settingsData) => {
      const response = await fetch(`${BASE_URL}/emails/settings`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(settingsData),
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
  },

  // AI Placement Suite
  aiFeatures: {
    getLLMConfig: async () => {
      const response = await fetch(`${BASE_URL}/ai-features/llm-config`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    saveLLMConfig: async (configData) => {
      const response = await fetch(`${BASE_URL}/ai-features/llm-config`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(configData),
      });
      return handleResponse(response);
    },
    analyzeATS: async (jobDescription, file = null, studentEmail = null) => {
      const formData = new FormData();
      formData.append('job_description', jobDescription);
      if (file) {
        formData.append('resume_file', file);
      }
      if (studentEmail) {
        formData.append('student_email', studentEmail);
      }
      
      const token = localStorage.getItem('academy_token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${BASE_URL}/ai-features/ats-analyze`, {
        method: 'POST',
        headers: headers,
        body: formData,
      });
      return handleResponse(response);
    },
    getResumeData: async (studentEmail = null) => {
      let url = `${BASE_URL}/ai-features/resume-builder/load`;
      if (studentEmail) {
        url += `?student_email=${encodeURIComponent(studentEmail)}`;
      }
      const response = await fetch(url, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    saveResumeData: async (resumeData) => {
      const response = await fetch(`${BASE_URL}/ai-features/resume-builder/save`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(resumeData),
      });
      return handleResponse(response);
    },
    tailorResume: async (jobDescription) => {
      const response = await fetch(`${BASE_URL}/ai-features/resume-builder/tailor`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ job_description: jobDescription }),
      });
      return handleResponse(response);
    },
    exportLaTeX: async (resumeData) => {
      const response = await fetch(`${BASE_URL}/ai-features/resume-builder/export-latex`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(resumeData),
      });
      if (!response.ok) throw new Error('Failed to export LaTeX resume');
      return response.text();
    },
    exportDocx: async (resumeData) => {
      const response = await fetch(`${BASE_URL}/ai-features/resume-builder/export-docx`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(resumeData),
      });
      if (!response.ok) throw new Error('Failed to export Word document');
      return response.blob();
    },
    startInterview: async (targetRole, jobDescription = null, numQuestions = 5, voiceMode = false) => {
      const response = await fetch(`${BASE_URL}/ai-features/interview/start`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ target_role: targetRole, job_description: jobDescription, num_questions: numQuestions, voice_mode: voiceMode }),
      });
      return handleResponse(response);
    },
    respondInterview: async (sessionId, userResponse, voiceMode = false) => {
      const response = await fetch(`${BASE_URL}/ai-features/interview/respond`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ session_id: sessionId, user_response: userResponse, voice_mode: voiceMode }),
      });
      return handleResponse(response);
    },
    respondInterviewAudio: async (sessionId, audioBlob, voiceMode = false) => {
      const formData = new FormData();
      formData.append('session_id', sessionId);
      formData.append('voice_mode', voiceMode);
      formData.append('audio_file', audioBlob, 'response.webm');
      
      const token = localStorage.getItem('academy_token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${BASE_URL}/ai-features/interview/respond-audio`, {
        method: 'POST',
        headers: headers,
        body: formData,
      });
      return handleResponse(response);
    },
    getInterviewHistory: async () => {
      const response = await fetch(`${BASE_URL}/ai-features/interview/history`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    chatWithCoach: async (message, history = []) => {
      const response = await fetch(`${BASE_URL}/ai-features/coach/chat`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message, history }),
      });
      return handleResponse(response);
    },
    createTest: async (title, topic, numQuestions, marksPerQuestion, studyFile = null) => {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('topic', topic);
      formData.append('num_questions', numQuestions);
      formData.append('marks_per_question', marksPerQuestion);
      if (studyFile) {
        formData.append('study_file', studyFile);
      }
      const token = localStorage.getItem('academy_token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`${BASE_URL}/ai-features/tests/create`, {
        method: 'POST',
        headers: headers,
        body: formData,
      });
      return handleResponse(response);
    },
    listTests: async () => {
      const response = await fetch(`${BASE_URL}/ai-features/tests`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getTestDetails: async (testId) => {
      const response = await fetch(`${BASE_URL}/ai-features/tests/${testId}`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    submitTestAnswers: async (testId, answers) => {
      const response = await fetch(`${BASE_URL}/ai-features/tests/${testId}/submit`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ answers }),
      });
      return handleResponse(response);
    },
    getTestResults: async (testId) => {
      const response = await fetch(`${BASE_URL}/ai-features/tests/${testId}/results`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    }
  },

  // Personal Space
  personal: {
    tasks: {
      list: async () => {
        const response = await fetch(`${BASE_URL}/personal/tasks`, {
          headers: getHeaders(),
        });
        return handleResponse(response);
      },
      create: async (task) => {
        const response = await fetch(`${BASE_URL}/personal/tasks`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(task),
        });
        return handleResponse(response);
      },
      toggle: async (taskId) => {
        const response = await fetch(`${BASE_URL}/personal/tasks/${taskId}`, {
          method: 'PUT',
          headers: getHeaders(),
        });
        return handleResponse(response);
      },
      delete: async (taskId) => {
        const response = await fetch(`${BASE_URL}/personal/tasks/${taskId}`, {
          method: 'DELETE',
          headers: getHeaders(),
        });
        if (response.status === 204) return true;
        return handleResponse(response);
      }
    },
    documents: {
      list: async () => {
        const response = await fetch(`${BASE_URL}/personal/documents`, {
          headers: getHeaders(),
        });
        return handleResponse(response);
      },
      create: async (formData) => {
        const response = await fetch(`${BASE_URL}/personal/documents`, {
          method: 'POST',
          headers: {
            'Authorization': getHeaders().Authorization
          },
          body: formData,
        });
        return handleResponse(response);
      },
      update: async (docId, formData) => {
        const response = await fetch(`${BASE_URL}/personal/documents/${docId}`, {
          method: 'PUT',
          headers: {
            'Authorization': getHeaders().Authorization
          },
          body: formData,
        });
        return handleResponse(response);
      },
      delete: async (docId) => {
        const response = await fetch(`${BASE_URL}/personal/documents/${docId}`, {
          method: 'DELETE',
          headers: getHeaders(),
        });
        if (response.status === 204) return true;
        return handleResponse(response);
      }
    },
    settings: {
      save: async (settingsData) => {
        const response = await fetch(`${BASE_URL}/personal/settings`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(settingsData),
        });
        return handleResponse(response);
      },
      testCloudinary: async (settingsData) => {
        const response = await fetch(`${BASE_URL}/personal/settings/test`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(settingsData),
        });
        return handleResponse(response);
      }
    }
  },
  placements: {
    listLeads: async (batchId) => {
      const url = batchId ? `${BASE_URL}/placements?batch_id=${batchId}` : `${BASE_URL}/placements`;
      const response = await fetch(url, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    createLead: async (leadData) => {
      const response = await fetch(`${BASE_URL}/placements`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(leadData),
      });
      return handleResponse(response);
    },
    updateLead: async (leadId, leadData) => {
      const response = await fetch(`${BASE_URL}/placements/${leadId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(leadData),
      });
      return handleResponse(response);
    },
    deleteLead: async (leadId) => {
      const response = await fetch(`${BASE_URL}/placements/${leadId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (response.status === 204) return true;
      return handleResponse(response);
    },
    getStats: async () => {
      const response = await fetch(`${BASE_URL}/placements/stats`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    generateOutreach: async (outreachData) => {
      const response = await fetch(`${BASE_URL}/placements/generate-outreach`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(outreachData),
      });
      return handleResponse(response);
    }
  },
  portfolios: {
    get: async () => {
      const response = await fetch(`${BASE_URL}/portfolios/my`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    save: async (data) => {
      const response = await fetch(`${BASE_URL}/portfolios/save`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    deploy: async (isDeployed) => {
      const response = await fetch(`${BASE_URL}/portfolios/deploy?is_deployed=${isDeployed}`, {
        method: 'POST',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    export: async () => {
      const response = await fetch(`${BASE_URL}/portfolios/export`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to export portfolio');
      return response.blob();
    }
  },
  geoAttendance: {
    getCenters: async () => {
      const response = await fetch(`${BASE_URL}/geo-attendance/centers`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    createCenter: async (centerData) => {
      const response = await fetch(`${BASE_URL}/geo-attendance/centers`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(centerData),
      });
      return handleResponse(response);
    },
    updateCenter: async (centerId, centerData) => {
      const response = await fetch(`${BASE_URL}/geo-attendance/centers/${centerId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(centerData),
      });
      return handleResponse(response);
    },
    deleteCenter: async (centerId) => {
      const response = await fetch(`${BASE_URL}/geo-attendance/centers/${centerId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (response.status === 204) return true;
      return handleResponse(response);
    },
    getStudentCenter: async () => {
      const response = await fetch(`${BASE_URL}/geo-attendance/student-center`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    assignCenter: async (assignData) => {
      const response = await fetch(`${BASE_URL}/geo-attendance/assign-center`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(assignData),
      });
      return handleResponse(response);
    },
    assignCenterBulk: async (assignBulkData) => {
      const response = await fetch(`${BASE_URL}/geo-attendance/assign-center/bulk`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(assignBulkData),
      });
      return handleResponse(response);
    },
    markAttendance: async (coords) => {
      const response = await fetch(`${BASE_URL}/geo-attendance/mark`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(coords),
      });
      return handleResponse(response);
    },
    getHistory: async () => {
      const response = await fetch(`${BASE_URL}/geo-attendance/history`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getRecords: async (date, centerId, batchId) => {
      let url = `${BASE_URL}/geo-attendance/records?`;
      if (date) url += `date=${encodeURIComponent(date)}&`;
      if (centerId) url += `center_id=${encodeURIComponent(centerId)}&`;
      if (batchId) url += `batch_id=${encodeURIComponent(batchId)}&`;
      const response = await fetch(url, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    correctRecord: async (recordId, payload) => {
      const response = await fetch(`${BASE_URL}/geo-attendance/records/${recordId}/correct`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(response);
    },
    getStudents: async (centerId) => {
      let url = `${BASE_URL}/geo-attendance/students`;
      if (centerId) url += `?center_id=${encodeURIComponent(centerId)}`;
      const response = await fetch(url, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    }
  }
};

