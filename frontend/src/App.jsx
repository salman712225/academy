import React, { useState, useEffect } from 'react';
import { api } from './services/api';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('academy_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [activeTab, setActiveTab] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Public Apply Form
  const [batchesOpen, setBatchesOpen] = useState([]);
  const [isApplying, setIsApplying] = useState(false);
  const [applyBatchId, setApplyBatchId] = useState('');
  const [applyName, setApplyName] = useState('');
  const [applyEmail, setApplyEmail] = useState('');

  // Listen for login/logout events across tabs
  useEffect(() => {
    const handleAuth = () => {
      const saved = localStorage.getItem('academy_user');
      setUser(saved ? JSON.parse(saved) : null);
    };
    window.addEventListener('auth_change', handleAuth);
    return () => window.removeEventListener('auth_change', handleAuth);
  }, []);

  // Set default tab on role load
  useEffect(() => {
    if (user) {
      if (user.role === 'student') setActiveTab('student_attendance');
      else if (user.role === 'trainer') setActiveTab('trainer_attendance');
      else if (user.role === 'associate') setActiveTab('associate_leads');
      else if (user.role === 'head') setActiveTab('head_dashboard');
    } else {
      setActiveTab('login');
      fetchPublicBatches();
    }
  }, [user]);

  const fetchPublicBatches = async () => {
    try {
      const data = await api.batches.list(true);
      setBatchesOpen(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.batches.apply(applyBatchId, {
        student_name: applyName,
        student_email: applyEmail
      });
      setSuccess('Application submitted successfully!');
      setApplyName('');
      setApplyEmail('');
      setIsApplying(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    api.auth.logout();
  };

  return (
    <div className="app-container">
      {user ? (
        <div className="dashboard-layout">
          {/* Sidebar */}
          <aside className="sidebar">
            <div>
              <div className="logo-container">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
                  <path d="M6 6h10M6 10h10"/>
                </svg>
                <span className="logo-text">ACADEMY</span>
              </div>
              <ul className="nav-menu">
                {/* Student Navigation */}
                {user.role === 'student' && (
                  <>
                    <li className={`nav-item ${activeTab === 'student_attendance' ? 'active' : ''}`} onClick={() => setActiveTab('student_attendance')}>
                      Attendance
                    </li>
                    <li className={`nav-item ${activeTab === 'student_library' ? 'active' : ''}`} onClick={() => setActiveTab('student_library')}>
                      My Books & Fines
                    </li>
                    <li className={`nav-item ${activeTab === 'student_leads' ? 'active' : ''}`} onClick={() => setActiveTab('student_leads')}>
                      Placement Leads
                    </li>
                  </>
                )}

                {/* Trainer Navigation */}
                {user.role === 'trainer' && (
                  <>
                    <li className={`nav-item ${activeTab === 'trainer_attendance' ? 'active' : ''}`} onClick={() => setActiveTab('trainer_attendance')}>
                      Upload Attendance
                    </li>
                  </>
                )}

                {/* Center Associate Navigation */}
                {user.role === 'associate' && (
                  <>
                    <li className={`nav-item ${activeTab === 'associate_leads' ? 'active' : ''}`} onClick={() => setActiveTab('associate_leads')}>
                      Lead Generation
                    </li>
                    <li className={`nav-item ${activeTab === 'associate_library' ? 'active' : ''}`} onClick={() => setActiveTab('associate_library')}>
                      Lend / Return Books
                    </li>
                    <li className={`nav-item ${activeTab === 'associate_applications' ? 'active' : ''}`} onClick={() => setActiveTab('associate_applications')}>
                      Applications
                    </li>
                  </>
                )}

                {/* Area Head Navigation */}
                {user.role === 'head' && (
                  <>
                    <li className={`nav-item ${activeTab === 'head_dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('head_dashboard')}>
                      Overview
                    </li>
                    <li className={`nav-item ${activeTab === 'head_bulk_upload' ? 'active' : ''}`} onClick={() => setActiveTab('head_bulk_upload')}>
                      Records Manager
                    </li>
                    <li className={`nav-item ${activeTab === 'head_library' ? 'active' : ''}`} onClick={() => setActiveTab('head_library')}>
                      Library Manager
                    </li>
                    <li className={`nav-item ${activeTab === 'head_leads' ? 'active' : ''}`} onClick={() => setActiveTab('head_leads')}>
                      Leads Tracker
                    </li>
                    <li className={`nav-item ${activeTab === 'head_emails' ? 'active' : ''}`} onClick={() => setActiveTab('head_emails')}>
                      Follow-up Mail Box
                    </li>
                    <li className={`nav-item ${activeTab === 'head_batches' ? 'active' : ''}`} onClick={() => setActiveTab('head_batches')}>
                      Batch Openings
                    </li>
                    <li className={`nav-item ${activeTab === 'head_attendance' ? 'active' : ''}`} onClick={() => setActiveTab('head_attendance')}>
                      Class Attendance
                    </li>
                  </>
                )}
              </ul>
            </div>
            
            <div className="sidebar-footer">
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{user.name}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'capitalize' }}>Role: {user.role}</div>
              </div>
              <button className="btn btn-secondary" style={{ width: '100%' }} onClick={handleLogout}>Log Out</button>
            </div>
          </aside>

          {/* Main Work Area */}
          <main className="main-content">
            {error && (
              <div className="alert-banner error">
                <span>{error}</span>
                <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>&times;</button>
              </div>
            )}
            {success && (
              <div className="alert-banner success">
                <span>{success}</span>
                <button onClick={() => setSuccess('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>&times;</button>
              </div>
            )}

            {/* Student Panels */}
            {activeTab === 'student_attendance' && <StudentAttendancePanel />}
            {activeTab === 'student_library' && <StudentLibraryPanel />}
            {activeTab === 'student_leads' && <PlacementLeadsPanel />}

            {/* Trainer Panels */}
            {activeTab === 'trainer_attendance' && <TrainerAttendancePanel user={user} />}

            {/* Center Associate Panels */}
            {activeTab === 'associate_leads' && <LeadsManagementPanel />}
            {activeTab === 'associate_library' && <AssociateLibraryPanel />}
            {activeTab === 'associate_applications' && <ApplicationsPanel />}

            {/* Area Head Panels */}
            {activeTab === 'head_dashboard' && <HeadDashboardPanel setTab={setActiveTab} />}
            {activeTab === 'head_bulk_upload' && <HeadBulkUploadPanel />}
            {activeTab === 'head_library' && <HeadLibraryManagerPanel />}
            {activeTab === 'head_leads' && <LeadsManagementPanel />}
            {activeTab === 'head_emails' && <HeadEmailsPanel />}
            {activeTab === 'head_batches' && <HeadBatchesPanel />}
            {activeTab === 'head_attendance' && <TrainerAttendancePanel user={user} />}
          </main>
        </div>
      ) : (
        /* Guest & Login View */
        <div className="auth-wrapper">
          {isApplying ? (
            <div className="glass-card auth-card">
              <h2 style={{ marginBottom: '8px' }}>Apply for Admission</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>Fill in details to apply for batch openings.</p>
              
              {error && <div className="alert-banner error">{error}</div>}

              <form onSubmit={handleApply}>
                <div className="form-group">
                  <label className="form-label">Select Batch</label>
                  <select 
                    className="form-control" 
                    required 
                    value={applyBatchId} 
                    onChange={e => setApplyBatchId(e.target.value)}
                  >
                    <option value="">-- Choose Batch --</option>
                    {batchesOpen.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    value={applyName} 
                    onChange={e => setApplyName(e.target.value)} 
                    placeholder="Enter full name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    required 
                    value={applyEmail} 
                    onChange={e => setApplyEmail(e.target.value)} 
                    placeholder="name@example.com"
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }}>Submit Application</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsApplying(false)}>Back to Login</button>
                </div>
              </form>
            </div>
          ) : (
            <LoginPanel setIsApplying={setIsApplying} fetchPublicBatches={fetchPublicBatches} />
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   COMPONENTS
   ========================================================================= */

function LoginPanel({ setIsApplying, fetchPublicBatches }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.auth.login(email, password);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="glass-card auth-card">
      <h2 style={{ marginBottom: '8px' }} className="title-gradient">Academy Login</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>Sign in to manage classes, library, and leads.</p>
      
      {error && <div className="alert-banner error" style={{ marginBottom: '20px' }}>{error}</div>}

      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input 
            type="email" 
            className="form-control" 
            required 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            placeholder="head@academy.com"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input 
            type="password" 
            className="form-control" 
            required 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="••••••••"
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }} disabled={loading}>
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>

      <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        Are you a prospective student? <br />
        <button 
          onClick={async () => {
            await fetchPublicBatches();
            setIsApplying(true);
          }} 
          style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontWeight: '600', cursor: 'pointer', marginTop: '8px', textDecoration: 'underline' }}
        >
          Apply for Next Batch Opening
        </button>
      </div>
    </div>
  );
}

function StudentAttendancePanel() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const data = await api.attendance.myAttendance();
        setRecords(data.records || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  const getStatusBadge = (val) => {
    if (val === 'Present') return <span className="badge badge-present">P</span>;
    if (val === 'Absent') return <span className="badge badge-absent">A</span>;
    if (val === 'Late') return <span className="badge badge-late">L</span>;
    return <span style={{ color: 'var(--text-muted)' }}>-</span>;
  };

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Daily Class Attendance</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Here is your 4-session daily attendance log details.</p>
      
      {loading ? (
        <p>Loading attendance data...</p>
      ) : records.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No attendance logs available yet.</p>
      ) : (
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Session 1</th>
                <th>Session 2</th>
                <th>Session 3</th>
                <th>Session 4</th>
                <th>Uploader</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  <td>{getStatusBadge(r.session_1)}</td>
                  <td>{getStatusBadge(r.session_2)}</td>
                  <td>{getStatusBadge(r.session_3)}</td>
                  <td>{getStatusBadge(r.session_4)}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{r.uploaded_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StudentLibraryPanel() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchFines = async () => {
    try {
      const data = await api.library.myFines();
      setSummary(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFines();
  }, []);

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>My Library Books & Overdue Fines</h2>
      
      {loading ? (
        <p>Loading library logs...</p>
      ) : (
        <>
          <div className="stats-grid">
            <div className="glass-card">
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Cumulative Library Fine</div>
              <div className="stat-number" style={{ color: summary.cumulative_fine > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                ₹ {summary.cumulative_fine.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Accumulates at ₹10/day post 5 days from borrow</div>
            </div>
            <div className="glass-card">
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Books Borrowed (Active)</div>
              <div className="stat-number">
                {summary.lendings.filter(l => l.status === 'lent' || l.status === 'overdue').length}
              </div>
            </div>
          </div>

          <h3 style={{ marginBottom: '16px' }}>Lending Logs History</h3>
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Copy Unique ID</th>
                  <th>Lend Date</th>
                  <th>Due Date</th>
                  <th>Return Date</th>
                  <th>Status</th>
                  <th>Fine (₹)</th>
                </tr>
              </thead>
              <tbody>
                {summary.lendings.map(l => (
                  <tr key={l.id}>
                    <td>{l.book_title}</td>
                    <td><code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>{l.copy_id}</code></td>
                    <td>{new Date(l.lend_date).toLocaleDateString()}</td>
                    <td>{new Date(l.due_date).toLocaleDateString()}</td>
                    <td>{l.return_date ? new Date(l.return_date).toLocaleDateString() : '-'}</td>
                    <td>
                      {l.status === 'lent' && <span className="badge" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)' }}>Lent</span>}
                      {l.status === 'overdue' && <span className="badge" style={{ background: 'rgba(244,63,94,0.15)', color: 'var(--accent-rose)' }}>Overdue</span>}
                      {l.status === 'returned' && <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--accent-emerald)' }}>Returned</span>}
                    </td>
                    <td style={{ fontWeight: '600', color: l.fine_amount > 0 ? 'var(--accent-rose)' : 'inherit' }}>₹{l.fine_amount.toFixed(2)}</td>
                  </tr>
                ))}
                {summary.lendings.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No books borrowed yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function PlacementLeadsPanel() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const data = await api.leads.list();
        setLeads(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, []);

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Job Placement & Leads Tracker</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Review available academy references and application details.</p>

      {loading ? (
        <p>Loading placement listings...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {leads.map(l => (
            <div className="glass-card" key={l.id}>
              <div className="flex-between" style={{ marginBottom: '12px' }}>
                <h3 className="title-gradient">{l.company_name}</h3>
                <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-indigo)' }}>{l.package}</span>
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: '500', marginBottom: '8px' }}>{l.role}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                <div><strong>HR:</strong> {l.hr_name}</div>
                <div><strong>Contact:</strong> {l.number} | {l.email}</div>
                <div style={{ marginTop: '8px', color: 'var(--accent-rose)' }}><strong>Deadline:</strong> {l.last_date}</div>
              </div>
              <a href={l.link_to_apply} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ width: '100%', textDecoration: 'none' }}>
                Apply Link
              </a>
            </div>
          ))}
          {leads.length === 0 && (
            <p style={{ color: 'var(--text-muted)' }}>No leads registered yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

function TrainerAttendancePanel({ user }) {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [file, setFile] = useState(null);
  const [columns, setColumns] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [warnings, setWarnings] = useState([]);

  useEffect(() => {
    const fetchSchemaAndBatches = async () => {
      try {
        const schemaData = await api.attendance.getSchema();
        setColumns(schemaData.expected_columns || []);
        
        // Retrieve batch listing
        const batchData = await api.batches.list();
        // If trainer, restrict to classes_assigned
        if (user.role === 'trainer') {
          const assigned = user.classes_assigned || [];
          setBatches(batchData.filter(b => assigned.includes(b.name)));
        } else {
          setBatches(batchData);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSchemaAndBatches();
  }, [user]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedBatch || !file) return;
    
    setLoading(true);
    setWarnings([]);
    try {
      const response = await api.attendance.upload(selectedBatch, file);
      alert(response.message);
      if (response.warnings_errors && response.warnings_errors.length > 0) {
        setWarnings(response.warnings_errors);
      }
      setFile(null);
      // reload attendance
      fetchBatchAttendance();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchAttendance = async () => {
    if (!selectedBatch) return;
    try {
      const data = await api.attendance.getBatchAttendance(selectedBatch);
      setLogs(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBatchAttendance();
  }, [selectedBatch]);

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Upload Class Attendance (XLSX)</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Select a batch to upload attendance files. Each spreadsheet is verified against the structured schema headers.
      </p>

      {/* Schema Checklist */}
      <div className="schema-alert">
        <h4 style={{ color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 16h.01M12 8v4M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z"/></svg>
          Verification: Expected XLSX Column Order
        </h4>
        <ul className="schema-columns-list">
          {columns.map((c, i) => (
            <li key={i} className="schema-column-tag">{c}</li>
          ))}
        </ul>
      </div>

      <div className="grid-2" style={{ marginBottom: '32px' }}>
        {/* Upload Form */}
        <div className="glass-card">
          <form onSubmit={handleUpload}>
            <div className="form-group">
              <label className="form-label">Target Batch / Class</label>
              <select 
                className="form-control" 
                required 
                value={selectedBatch} 
                onChange={e => setSelectedBatch(e.target.value)}
              >
                <option value="">-- Select Class --</option>
                {batches.map(b => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Excel Spreadsheet (.xlsx)</label>
              <input 
                type="file" 
                className="form-control" 
                required 
                accept=".xlsx" 
                onChange={e => setFile(e.target.files[0])}
              />
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={loading}>
              {loading ? 'Uploading & Parsing...' : 'Import Attendance File'}
            </button>
          </form>
        </div>

        {/* Warnings / Errors Log */}
        {warnings.length > 0 && (
          <div className="glass-card" style={{ borderColor: 'var(--accent-rose)' }}>
            <h3 style={{ color: 'var(--accent-rose)', marginBottom: '12px' }}>Upload Warnings / Skipped Rows</h3>
            <div style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '0.85rem' }}>
              <ul style={{ paddingLeft: '16px', color: 'var(--text-secondary)' }}>
                {warnings.map((w, idx) => (
                  <li key={idx} style={{ marginBottom: '6px' }}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {selectedBatch && (
        <>
          <h3 style={{ marginBottom: '16px' }}>Existing Records for Batch: {selectedBatch}</h3>
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Student Email</th>
                  <th>Date</th>
                  <th>Session 1</th>
                  <th>Session 2</th>
                  <th>Session 3</th>
                  <th>Session 4</th>
                  <th>Uploader</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id}>
                    <td>{l.student_email}</td>
                    <td>{l.date}</td>
                    <td>{l.session_1}</td>
                    <td>{l.session_2}</td>
                    <td>{l.session_3}</td>
                    <td>{l.session_4}</td>
                    <td>{l.uploaded_by}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No records uploaded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function LeadsManagementPanel() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit / Create states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [company, setCompany] = useState('');
  const [hr, setHr] = useState('');
  const [number, setNumber] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [packageVal, setPackageVal] = useState('');
  const [link, setLink] = useState('');
  const [lastDate, setLastDate] = useState('');

  const fetchLeads = async () => {
    try {
      const data = await api.leads.list();
      setLeads(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      company_name: company,
      hr_name: hr,
      number,
      email,
      role,
      package: packageVal,
      link_to_apply: link,
      last_date: lastDate
    };
    
    try {
      if (editId) {
        await api.leads.update(editId, payload);
        alert('Lead updated successfully!');
      } else {
        await api.leads.create(payload);
        alert('Lead registered successfully!');
      }
      resetForm();
      fetchLeads();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (lead) => {
    setEditId(lead.id);
    setCompany(lead.company_name);
    setHr(lead.hr_name);
    setNumber(lead.number);
    setEmail(lead.email);
    setRole(lead.role);
    setPackageVal(lead.package);
    setLink(lead.link_to_apply);
    setLastDate(lead.last_date);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this placement lead?')) return;
    try {
      await api.leads.delete(id);
      fetchLeads();
    } catch (err) {
      alert(err.message);
    }
  };

  const resetForm = () => {
    setEditId(null);
    setCompany('');
    setHr('');
    setNumber('');
    setEmail('');
    setRole('');
    setPackageVal('');
    setLink('');
    setLastDate('');
    setIsFormOpen(false);
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <div>
          <h2>Corporate Leads & Job Generation</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Log and track recruitment listings from verified corporate partners.</p>
        </div>
        {!isFormOpen && (
          <button className="btn btn-primary" onClick={() => setIsFormOpen(true)}>+ Add New Lead</button>
        )}
      </div>

      {isFormOpen && (
        <div className="glass-card" style={{ marginBottom: '32px' }}>
          <h3>{editId ? 'Modify Lead Details' : 'Create Job Opportunity Lead'}</h3>
          <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input type="text" className="form-control" required value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Google" />
              </div>
              <div className="form-group">
                <label className="form-label">Job Role / Designation</label>
                <input type="text" className="form-control" required value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Full Stack Engineer" />
              </div>
            </div>
            
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">HR Recruiter Name</label>
                <input type="text" className="form-control" required value={hr} onChange={e => setHr(e.target.value)} placeholder="e.g. Sarah Jenkins" />
              </div>
              <div className="form-group">
                <label className="form-label">HR Mobile Number</label>
                <input type="text" className="form-control" required value={number} onChange={e => setNumber(e.target.value)} placeholder="e.g. +91 9999988888" />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">HR Email Address</label>
                <input type="email" className="form-control" required value={email} onChange={e => setEmail(e.target.value)} placeholder="hr@company.com" />
              </div>
              <div className="form-group">
                <label className="form-label">CTC Package (LPA / Salary)</label>
                <input type="text" className="form-control" required value={packageVal} onChange={e => setPackageVal(e.target.value)} placeholder="e.g. 10 LPA" />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Application Link URL</label>
                <input type="url" className="form-control" required value={link} onChange={e => setLink(e.target.value)} placeholder="https://careers.google.com/jobs" />
              </div>
              <div className="form-group">
                <label className="form-label">Deadline to Apply (YYYY-MM-DD)</label>
                <input type="date" className="form-control" required value={lastDate} onChange={e => setLastDate(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button type="submit" className="btn btn-primary">{editId ? 'Apply Update' : 'Publish Lead'}</button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p>Loading leads...</p>
      ) : (
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Role</th>
                <th>HR Contact</th>
                <th>Package</th>
                <th>Deadline</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(l => (
                <tr key={l.id}>
                  <td>
                    <div style={{ fontWeight: '600' }}>{l.company_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Created {new Date(l.created_at).toLocaleDateString()}</div>
                  </td>
                  <td>{l.role}</td>
                  <td>
                    <div style={{ fontSize: '0.9rem' }}>{l.hr_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{l.email} | {l.number}</div>
                  </td>
                  <td><span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-indigo)' }}>{l.package}</span></td>
                  <td style={{ color: 'var(--accent-rose)', fontWeight: '600' }}>{l.last_date}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleEdit(l)}>Edit</button>
                      <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleDelete(l.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No job leads logged yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AssociateLibraryPanel() {
  const [books, setBooks] = useState([]);
  const [activeLendings, setActiveLendings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms states
  const [studentEmail, setStudentEmail] = useState('');
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedCopyId, setSelectedCopyId] = useState('');

  const fetchLibraryData = async () => {
    try {
      const bList = await api.library.listBooks();
      setBooks(bList);
      
      const lList = await api.library.activeLendings();
      setActiveLendings(lList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibraryData();
  }, []);

  const handleLend = async (e) => {
    e.preventDefault();
    if (!studentEmail || !selectedBookId || !selectedCopyId) return;

    try {
      await api.library.lendBook({
        student_email: studentEmail,
        book_id: selectedBookId,
        copy_id: selectedCopyId
      });
      alert('Book lent successfully!');
      setStudentEmail('');
      setSelectedBookId('');
      setSelectedCopyId('');
      fetchLibraryData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReturn = async (id) => {
    try {
      const response = await api.library.returnBook(id);
      alert(`Book copy returned successfully! Final accumulated fine: ₹${response.fine_amount}`);
      fetchLibraryData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Get available copies for selected book
  const getAvailableCopies = () => {
    if (!selectedBookId) return [];
    const book = books.find(b => b.id === selectedBookId);
    return book ? book.copies.filter(c => c.status === 'available') : [];
  };

  return (
    <div>
      <h2>Library Lending Operations</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Distribute copies collision-free to enrolled students.</p>

      <div className="grid-2" style={{ marginBottom: '32px' }}>
        {/* Lend Form */}
        <div className="glass-card">
          <h3>Issue Book Copy</h3>
          <form onSubmit={handleLend} style={{ marginTop: '16px' }}>
            <div className="form-group">
              <label className="form-label">Student Email ID</label>
              <input 
                type="email" 
                className="form-control" 
                required 
                value={studentEmail} 
                onChange={e => setStudentEmail(e.target.value)} 
                placeholder="student@academy.com" 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Select Book</label>
              <select 
                className="form-control" 
                required 
                value={selectedBookId} 
                onChange={e => { setSelectedBookId(e.target.value); setSelectedCopyId(''); }}
              >
                <option value="">-- Choose Book Title --</option>
                {books.map(b => (
                  <option key={b.id} value={b.id}>{b.title} (by {b.author})</option>
                ))}
              </select>
            </div>

            {selectedBookId && (
              <div className="form-group">
                <label className="form-label">Select Available Copy Unique ID</label>
                <select 
                  className="form-control" 
                  required 
                  value={selectedCopyId} 
                  onChange={e => setSelectedCopyId(e.target.value)}
                >
                  <option value="">-- Choose Copy --</option>
                  {getAvailableCopies().map(c => (
                    <option key={c.copy_id} value={c.copy_id}>{c.copy_id}</option>
                  ))}
                </select>
                {getAvailableCopies().length === 0 && (
                  <div style={{ color: 'var(--accent-rose)', fontSize: '0.8rem', marginTop: '6px' }}>
                    Warning: All copies of this book are currently out of stock (lent).
                  </div>
                )}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={selectedBookId && getAvailableCopies().length === 0}>
              Commit Lending Order
            </button>
          </form>
        </div>

        {/* Current book inventory lookup */}
        <div className="glass-card" style={{ maxHeight: '420px', overflowY: 'auto' }}>
          <h3>Books Inventory & Copies Status</h3>
          <div style={{ marginTop: '16px' }}>
            {books.map(b => (
              <div key={b.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: '600' }}>{b.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ISBN: {b.isbn} | Author: {b.author}</div>
                
                <div className="copies-grid">
                  {b.copies.map(c => (
                    <div 
                      key={c.copy_id} 
                      className={`copy-badge ${c.status}`}
                      title={
                        c.status === 'lent'
                          ? `Lent to: ${c.lent_to}\nStudent ID: ${c.lent_to_id || 'N/A'}`
                          : c.last_lent_to
                            ? `Last lent to: ${c.last_lent_to}\nStudent ID: ${c.last_lent_to_id || 'N/A'}`
                            : 'Never lent'
                      }
                    >
                      <div style={{ fontWeight: '500' }}>{c.copy_id.split('-').pop()}</div>
                      <div style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>{c.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {books.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No books in catalog.</p>}
          </div>
        </div>
      </div>

      <h3>Active Outbox (Lent Items)</h3>
      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Book Title</th>
              <th>Copy Unique ID</th>
              <th>Lend Date</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Accrued Fine</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {activeLendings.map(l => (
              <tr key={l.id}>
                <td>{l.student_email}</td>
                <td>{l.book_title}</td>
                <td><code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>{l.copy_id}</code></td>
                <td>{new Date(l.lend_date).toLocaleDateString()}</td>
                <td>{new Date(l.due_date).toLocaleDateString()}</td>
                <td>
                  {l.status === 'overdue' ? (
                    <span className="badge badge-absent" style={{ textTransform: 'capitalize' }}>Overdue</span>
                  ) : (
                    <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-blue)', textTransform: 'capitalize' }}>Lent</span>
                  )}
                </td>
                <td style={{ fontWeight: '600', color: l.fine_amount > 0 ? 'var(--accent-rose)' : 'inherit' }}>₹{l.fine_amount.toFixed(2)}</td>
                <td>
                  <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => handleReturn(l.id)}>
                    Log Return
                  </button>
                </td>
              </tr>
            ))}
            {activeLendings.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No active lendings out.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ApplicationsPanel() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApps = async () => {
    try {
      const data = await api.batches.listApplications();
      setApps(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleUpdate = async (id, status) => {
    try {
      await api.batches.updateApplicationStatus(id, status);
      alert(`Application marked as ${status}.`);
      fetchApps();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <h2>Course Admission Applications</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Evaluate and approve submissions from customers applying online.</p>

      {loading ? (
        <p>Loading applications...</p>
      ) : (
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Applicant Name</th>
                <th>Email ID</th>
                <th>Target Batch ID</th>
                <th>Submission Date</th>
                <th>Current Status</th>
                <th>Approval Actions</th>
              </tr>
            </thead>
            <tbody>
              {apps.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: '600' }}>{a.student_name}</td>
                  <td>{a.student_email}</td>
                  <td>{a.batch_id}</td>
                  <td>{new Date(a.applied_at).toLocaleDateString()}</td>
                  <td>
                    {a.status === 'pending' && <span className="badge" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--accent-amber)' }}>Pending</span>}
                    {a.status === 'approved' && <span className="badge badge-present">Approved</span>}
                    {a.status === 'rejected' && <span className="badge badge-absent">Rejected</span>}
                  </td>
                  <td>
                    {a.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'var(--accent-emerald)', boxShadow: 'none' }} onClick={() => handleUpdate(a.id, 'approved')}>Approve</button>
                        <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleUpdate(a.id, 'rejected')}>Reject</button>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Completed</span>
                    )}
                  </td>
                </tr>
              ))}
              {apps.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No student applications submitted yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function HeadDashboardPanel({ setTab }) {
  const [stats, setStats] = useState({ books: 0, leads: 0, applications: 0, activeLends: 0 });

  const fetchStats = async () => {
    try {
      const bList = await api.library.listBooks();
      const lList = await api.leads.list();
      const aList = await api.batches.listApplications();
      const activeLends = await api.library.activeLendings();
      
      setStats({
        books: bList.length,
        leads: lList.length,
        applications: aList.length,
        activeLends: activeLends.length
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const triggerAuditCheck = async () => {
    try {
      const res = await api.test.triggerDailyCheck();
      alert(`Manual Daily Overdue Audit executed!\n- Notifications sent: ${res.results.notices_sent}\n- Fines updated: ${res.results.fines_updated}`);
      fetchStats();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <div>
          <h2>Area Head Dashboard</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Overview control center and modules audit trigger.</p>
        </div>
        <button className="btn btn-primary" onClick={triggerAuditCheck}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
          Run Daily Overdue Audit Check
        </button>
      </div>

      <div className="stats-grid">
        <div className="glass-card" style={{ cursor: 'pointer' }} onClick={() => setTab('head_library')}>
          <div style={{ color: 'var(--text-secondary)' }}>Total Book Titles</div>
          <div className="stat-number">{stats.books}</div>
          <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>Manage copies &rarr;</span>
        </div>
        <div className="glass-card" style={{ cursor: 'pointer' }} onClick={() => setTab('head_library')}>
          <div style={{ color: 'var(--text-secondary)' }}>Books Currently Out</div>
          <div className="stat-number" style={{ color: stats.activeLends > 0 ? 'var(--accent-amber)' : 'inherit' }}>{stats.activeLends}</div>
          <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>Track returns &rarr;</span>
        </div>
        <div className="glass-card" style={{ cursor: 'pointer' }} onClick={() => setTab('head_leads')}>
          <div style={{ color: 'var(--text-secondary)' }}>Placement Leads Active</div>
          <div className="stat-number">{stats.leads}</div>
          <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>Create listings &rarr;</span>
        </div>
        <div className="glass-card" style={{ cursor: 'pointer' }} onClick={() => setTab('head_bulk_upload')}>
          <div style={{ color: 'var(--text-secondary)' }}>Pending Batch Applications</div>
          <div className="stat-number">{stats.applications}</div>
          <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>Verify enrollment &rarr;</span>
        </div>
      </div>

      <div className="glass-card">
        <h3>Administrative Controls Guidance</h3>
        <p style={{ marginTop: '12px', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
          Welcome, Area Head. You have elevated authorization to run global actions. 
          Use the left sidebar navigation items to:
        </p>
        <ul style={{ marginTop: '12px', paddingLeft: '20px', color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '0.95rem' }}>
          <li><strong>Records Manager:</strong> Add, update, delete, or bulk upload student accounts and library catalogs.</li>
          <li><strong>Follow-up Mail Box:</strong> Analyze outbox records matching keywords with smart recipients search.</li>
          <li><strong>Batch Openings:</strong> Create and publish openings where customers can submit admission forms.</li>
          <li><strong>Class Attendance:</strong> Access Trainer-level class excel upload.</li>
        </ul>
      </div>
    </div>
  );
}

function HeadBulkUploadPanel() {
  const [recordsTab, setRecordsTab] = useState('students');
  const [selectedSchema, setSelectedSchema] = useState('students');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorsLog, setErrorsLog] = useState([]);

  // Student directory states
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentRole, setStudentRole] = useState('student');
  const [studentBatch, setStudentBatch] = useState('');

  // Book catalog states
  const [books, setBooks] = useState([]);
  const [bookId, setBookId] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookIsbn, setBookIsbn] = useState('');
  const [bookQuantity, setBookQuantity] = useState(1);

  const fetchInitialData = async () => {
    try {
      const uList = await api.auth.listUsers();
      setStudents(uList);
      
      const bList = await api.library.listBooks();
      setBooks(bList);
      
      const batchList = await api.batches.list();
      setBatches(batchList);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleUploadTabbed = async (e, targetSchema) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setErrorsLog([]);
    setSelectedSchema(targetSchema);
    try {
      let res;
      if (targetSchema === 'students') {
        res = await api.bulkUpload.uploadStudents(file);
      } else {
        res = await api.bulkUpload.uploadBooks(file);
      }
      alert(res.message);
      if (res.errors && res.errors.length > 0) {
        setErrorsLog(res.errors);
      }
      setFile(null);
      fetchInitialData();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Student manual actions
  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    try {
      const userData = {
        name: studentName,
        email: studentEmail,
        role: studentRole,
        batch_id: studentBatch || null
      };

      if (studentId) {
        // Update user
        if (studentPassword) {
          userData.password = studentPassword;
        }
        await api.auth.updateUser(studentId, userData);
        alert('Student record updated successfully!');
      } else {
        // Create user
        if (!studentPassword) {
          alert('Password is required for new accounts.');
          return;
        }
        userData.password = studentPassword;
        await api.auth.addUser(userData);
        alert('Student account created successfully!');
      }

      // Reset
      resetStudentForm();
      fetchInitialData();
    } catch (err) {
      alert(err.message);
    }
  };

  const resetStudentForm = () => {
    setStudentId('');
    setStudentName('');
    setStudentEmail('');
    setStudentPassword('');
    setStudentRole('student');
    setStudentBatch('');
  };

  const handleEditStudent = (user) => {
    setStudentId(user.id);
    setStudentName(user.name);
    setStudentEmail(user.email);
    setStudentRole(user.role);
    setStudentBatch(user.batch_id || '');
    setStudentPassword('');
  };

  const handleDeleteStudent = async (userId) => {
    if (!confirm('Are you sure you want to delete this student account?')) return;
    try {
      await api.auth.deleteUser(userId);
      alert('Student record deleted successfully.');
      fetchInitialData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Book manual actions
  const handleBookSubmit = async (e) => {
    e.preventDefault();
    try {
      const bookData = {
        title: bookTitle,
        author: bookAuthor,
        isbn: bookIsbn,
        quantity: parseInt(bookQuantity)
      };

      if (bookId) {
        await api.library.updateBook(bookId, bookData);
        alert('Book catalog record updated successfully!');
      } else {
        await api.library.addBook(bookData);
        alert('Book added to library catalog successfully!');
      }

      resetBookForm();
      fetchInitialData();
    } catch (err) {
      alert(err.message);
    }
  };

  const resetBookForm = () => {
    setBookId('');
    setBookTitle('');
    setBookAuthor('');
    setBookIsbn('');
    setBookQuantity(1);
  };

  const handleEditBook = (book) => {
    setBookId(book.id);
    setBookTitle(book.title);
    setBookAuthor(book.author);
    setBookIsbn(book.isbn);
    setBookQuantity(book.quantity);
  };

  const handleDeleteBook = async (bId) => {
    if (!confirm('Are you sure you want to delete this book from the catalog entirely?')) return;
    try {
      await api.library.deleteBook(bId);
      alert('Book catalog record deleted successfully.');
      fetchInitialData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <h2>Records & Directory Manager</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Manage student accounts, academic staff, and library catalogs manually or via bulk uploads.
      </p>

      {/* Sub-tab navigation */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
        <button 
          className={`btn ${recordsTab === 'students' ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ padding: '8px 16px', borderRadius: '4px 4px 0 0', borderBottom: 'none' }}
          onClick={() => setRecordsTab('students')}
        >
          Student Directory
        </button>
        <button 
          className={`btn ${recordsTab === 'books' ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ padding: '8px 16px', borderRadius: '4px 4px 0 0', borderBottom: 'none' }}
          onClick={() => setRecordsTab('books')}
        >
          Book Catalog
        </button>
      </div>

      {recordsTab === 'students' ? (
        <div>
          <div className="grid-2" style={{ alignItems: 'start' }}>
            {/* Manual Student Form */}
            <div className="glass-card">
              <h3>{studentId ? 'Update Student Account' : 'Add Student Manually'}</h3>
              <form onSubmit={handleStudentSubmit} style={{ marginTop: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-control" required value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="e.g. John Doe" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" className="form-control" required value={studentEmail} onChange={e => setStudentEmail(e.target.value)} placeholder="student@academy.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Password {studentId && '(leave blank to keep unchanged)'}</label>
                  <input type="password" className="form-control" required={!studentId} value={studentPassword} onChange={e => setStudentPassword(e.target.value)} placeholder="Secure Password" />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">System Role</label>
                    <select className="form-control" value={studentRole} onChange={e => setStudentRole(e.target.value)}>
                      <option value="student">Student</option>
                      <option value="associate">Center Associate</option>
                      <option value="trainer">Trainer</option>
                      <option value="head">Area Head</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Select Batch</label>
                    <select className="form-control" value={studentBatch} onChange={e => setStudentBatch(e.target.value)}>
                      <option value="">-- Choose Batch --</option>
                      {batches.map(b => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    {studentId ? 'Update Account' : 'Create Student'}
                  </button>
                  {studentId && (
                    <button type="button" className="btn btn-secondary" onClick={resetStudentForm}>
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Student List Table */}
            <div className="glass-card" style={{ maxHeight: '520px', overflowY: 'auto' }}>
              <h3>Academy Members</h3>
              <div style={{ marginTop: '16px' }} className="table-wrapper">
                <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Batch</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s.id}>
                        <td>{s.name}</td>
                        <td>{s.email}</td>
                        <td style={{ textTransform: 'capitalize' }}>{s.role}</td>
                        <td>{s.batch_id || '-'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleEditStudent(s)}>Edit</button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--accent-rose)' }} onClick={() => handleDeleteStudent(s.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {students.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No accounts registered yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Contextual Student XLSX Upload */}
          <div className="glass-card" style={{ marginTop: '24px' }}>
            <h3>Bulk Students Importer (XLSX)</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
              Import multiple student accounts at once. The Excel sheet MUST follow this exact column layout and order:
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {['Name', 'Email', 'Password', 'Role', 'BatchName'].map((col, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '4px 10px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--accent-indigo)' }}>
                    {idx + 1}. {col}
                  </span>
                  {idx < 4 && <span style={{ color: 'var(--text-muted)' }}>&rarr;</span>}
                </div>
              ))}
            </div>
            <form onSubmit={(e) => handleUploadTabbed(e, 'students')} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input 
                type="file" 
                className="form-control" 
                required 
                accept=".xlsx" 
                onChange={e => setFile(e.target.files[0])} 
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: '180px' }}>
                {loading ? 'Importing...' : 'Upload Student XLSX'}
              </button>
            </form>
            {errorsLog.length > 0 && selectedSchema === 'students' && (
              <div style={{ borderColor: 'var(--accent-rose)', marginTop: '20px', background: 'rgba(244,63,94,0.02)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ color: 'var(--accent-rose)', margin: '0 0 8px 0', fontSize: '0.9rem' }}>Student Import Errors Log:</h4>
                <ul style={{ paddingLeft: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                  {errorsLog.map((err, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}><span style={{ color: 'var(--accent-rose)' }}>Error</span>: {err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div className="grid-2" style={{ alignItems: 'start' }}>
            {/* Manual Book Form */}
            <div className="glass-card">
              <h3>{bookId ? 'Update Book Catalog' : 'Add Book Manually'}</h3>
              <form onSubmit={handleBookSubmit} style={{ marginTop: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Book Title</label>
                  <input type="text" className="form-control" required value={bookTitle} onChange={e => setBookTitle(e.target.value)} placeholder="e.g. Introduction to Algorithms" />
                </div>
                <div className="form-group">
                  <label className="form-label">Author Name</label>
                  <input type="text" className="form-control" required value={bookAuthor} onChange={e => setBookAuthor(e.target.value)} placeholder="e.g. Thomas H. Cormen" />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">ISBN Reference</label>
                    <input type="text" className="form-control" required value={bookIsbn} onChange={e => setBookIsbn(e.target.value)} placeholder="e.g. 9780262033848" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total Copies Quantity</label>
                    <input type="number" min="1" className="form-control" required value={bookQuantity} onChange={e => setBookQuantity(e.target.value)} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    {bookId ? 'Update Book' : 'Add to Catalog'}
                  </button>
                  {bookId && (
                    <button type="button" className="btn btn-secondary" onClick={resetBookForm}>
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Book List Table */}
            <div className="glass-card" style={{ maxHeight: '520px', overflowY: 'auto' }}>
              <h3>Library Catalog</h3>
              <div style={{ marginTop: '16px' }} className="table-wrapper">
                <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Author</th>
                      <th>ISBN</th>
                      <th>Qty</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.map(b => (
                      <tr key={b.id}>
                        <td style={{ fontWeight: '600' }}>{b.title}</td>
                        <td>{b.author}</td>
                        <td><code>{b.isbn}</code></td>
                        <td>{b.quantity}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleEditBook(b)}>Edit</button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--accent-rose)' }} onClick={() => handleDeleteBook(b.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {books.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No books in inventory.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Contextual Book XLSX Upload */}
          <div className="glass-card" style={{ marginTop: '24px' }}>
            <h3>Bulk Books Importer (XLSX)</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
              Import multiple book titles at once. The Excel sheet MUST follow this exact column layout and order:
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {['Title', 'Author', 'ISBN', 'Quantity'].map((col, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '4px 10px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--accent-indigo)' }}>
                    {idx + 1}. {col}
                  </span>
                  {idx < 3 && <span style={{ color: 'var(--text-muted)' }}>&rarr;</span>}
                </div>
              ))}
            </div>
            <form onSubmit={(e) => handleUploadTabbed(e, 'books')} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input 
                type="file" 
                className="form-control" 
                required 
                accept=".xlsx" 
                onChange={e => setFile(e.target.files[0])} 
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: '180px' }}>
                {loading ? 'Importing...' : 'Upload Book XLSX'}
              </button>
            </form>
            {errorsLog.length > 0 && selectedSchema === 'books' && (
              <div style={{ borderColor: 'var(--accent-rose)', marginTop: '20px', background: 'rgba(244,63,94,0.02)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ color: 'var(--accent-rose)', margin: '0 0 8px 0', fontSize: '0.9rem' }}>Book Import Errors Log:</h4>
                <ul style={{ paddingLeft: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                  {errorsLog.map((err, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}><span style={{ color: 'var(--accent-rose)' }}>Error</span>: {err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function HeadLibraryManagerPanel() {
  const [books, setBooks] = useState([]);
  const [activeLendings, setActiveLendings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Forms states
  const [studentEmail, setStudentEmail] = useState('');
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedCopyId, setSelectedCopyId] = useState('');

  const fetchLibraryData = async () => {
    try {
      const bList = await api.library.listBooks();
      setBooks(bList);
      
      const lList = await api.library.activeLendings();
      setActiveLendings(lList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibraryData();
  }, []);

  const handleLend = async (e) => {
    if (e) e.preventDefault();
    if (!studentEmail || !selectedBookId || !selectedCopyId) return;

    try {
      await api.library.lendBook({
        student_email: studentEmail,
        book_id: selectedBookId,
        copy_id: selectedCopyId
      });
      alert('Book copy lent successfully!');
      setStudentEmail('');
      setSelectedBookId('');
      setSelectedCopyId('');
      fetchLibraryData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReturn = async (id) => {
    try {
      const response = await api.library.returnBook(id);
      alert(`Book copy returned successfully! Final fine: ₹${response.fine_amount}`);
      fetchLibraryData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReturnByCopyId = async (copyId) => {
    const lending = activeLendings.find(l => l.copy_id === copyId && (l.status === 'lent' || l.status === 'overdue'));
    if (lending) {
      await handleReturn(lending.id);
    } else {
      alert('Lending record not found for this copy.');
    }
  };

  const handleQuickLend = (bookId, copyId) => {
    setSelectedBookId(bookId);
    setSelectedCopyId(copyId);
    document.getElementById('issue-student-email')?.focus();
  };

  const getAvailableCopies = () => {
    if (!selectedBookId) return [];
    const book = books.find(b => b.id === selectedBookId);
    return book ? book.copies.filter(c => c.status === 'available') : [];
  };

  const flatCopies = [];
  books.forEach(b => {
    if (b.copies) {
      b.copies.forEach(c => {
        flatCopies.push({
          isbn: b.isbn,
          title: b.title,
          bookId: b.id,
          copyId: c.copy_id,
          status: c.status,
          lentTo: c.lent_to,
          lentToId: c.lent_to_id,
          lastLentTo: c.last_lent_to,
          lastLentToId: c.last_lent_to_id
        });
      });
    }
  });

  const filteredCopies = flatCopies.filter(c => 
    c.isbn.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.copyId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <h2>Library Manager</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Lend book copies to students and log returned inventory items cleanly.
      </p>

      <div className="grid-2" style={{ marginBottom: '32px', alignItems: 'start' }}>
        {/* Issue form */}
        <div className="glass-card">
          <h3>Issue Book Copy</h3>
          <form onSubmit={handleLend} style={{ marginTop: '16px' }}>
            <div className="form-group">
              <label className="form-label">Student Email ID</label>
              <input 
                id="issue-student-email"
                type="email" 
                className="form-control" 
                required 
                value={studentEmail} 
                onChange={e => setStudentEmail(e.target.value)} 
                placeholder="student@academy.com" 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Select Book</label>
              <select 
                className="form-control" 
                required 
                value={selectedBookId} 
                onChange={e => { setSelectedBookId(e.target.value); setSelectedCopyId(''); }}
              >
                <option value="">-- Choose Book Title --</option>
                {books.map(b => (
                  <option key={b.id} value={b.id}>{b.title} (by {b.author})</option>
                ))}
              </select>
            </div>

            {selectedBookId && (
              <div className="form-group">
                <label className="form-label">Select Available Copy Unique ID</label>
                <select 
                  className="form-control" 
                  required 
                  value={selectedCopyId} 
                  onChange={e => setSelectedCopyId(e.target.value)}
                >
                  <option value="">-- Choose Copy --</option>
                  {getAvailableCopies().map(c => (
                    <option key={c.copy_id} value={c.copy_id}>{c.copy_id}</option>
                  ))}
                </select>
                {getAvailableCopies().length === 0 && (
                  <div style={{ color: 'var(--accent-rose)', fontSize: '0.8rem', marginTop: '6px' }}>
                    Warning: All copies of this book are currently lent out.
                  </div>
                )}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={selectedBookId && getAvailableCopies().length === 0}>
              Commit Lending Order
            </button>
          </form>
        </div>

        {/* Active Outbox */}
        <div className="glass-card" style={{ maxHeight: '420px', overflowY: 'auto' }}>
          <h3>Active Outbox (Lent Items)</h3>
          <div style={{ marginTop: '16px' }} className="table-wrapper">
            <table className="custom-table" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Book Title</th>
                  <th>Copy ID</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {activeLendings.map(l => (
                  <tr key={l.id}>
                    <td>{l.student_email}</td>
                    <td>{l.book_title}</td>
                    <td><code>{l.copy_id}</code></td>
                    <td>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleReturn(l.id)}>
                        Log Return
                      </button>
                    </td>
                  </tr>
                ))}
                {activeLendings.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No active lendings out.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Flat Copies Table */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h3>Book Copies Directory</h3>
          <input 
            type="text" 
            className="form-control" 
            style={{ maxWidth: '300px' }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by ISBN, Name, Unique ID..."
          />
        </div>

        <div className="table-wrapper">
          <table className="custom-table" style={{ fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th>ISBN</th>
                <th>Book Name</th>
                <th>Unique ID</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCopies.map((c, i) => (
                <tr key={i}>
                  <td><code>{c.isbn}</code></td>
                  <td>{c.title}</td>
                  <td><code>{c.copyId.split('-').pop()}</code></td>
                  <td>
                    {c.status === 'lent' ? (
                      <span 
                        className="badge badge-absent" 
                        style={{ fontSize: '0.75rem', cursor: 'help' }}
                        title={`Lent to: ${c.lentTo}\nStudent ID: ${c.lentToId || 'N/A'}`}
                      >
                        Lent (to: {c.lentTo})
                      </span>
                    ) : (
                      <span 
                        className="badge" 
                        style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', cursor: c.lastLentTo ? 'help' : 'default' }}
                        title={c.lastLentTo ? `Last lent to: ${c.lastLentTo}\nStudent ID: ${c.lastLentToId || 'N/A'}` : 'Never lent'}
                      >
                        Available
                      </span>
                    )}
                  </td>
                  <td>
                    {c.status === 'available' ? (
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }} 
                        onClick={() => handleQuickLend(c.bookId, c.copyId)}
                      >
                        Lend Copy
                      </button>
                    ) : (
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--accent-rose)' }} 
                        onClick={() => handleReturnByCopyId(c.copyId)}
                      >
                        Log Return
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredCopies.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No copy records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function HeadEmailsPanel() {
  const [sentList, setSentList] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  // New Email states
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [mailCategory, setMailCategory] = useState('follow_up');
  
  // Recipient search autocomplete state
  const [recipients, setRecipients] = useState([]);
  const [recipientQuery, setRecipientQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchEmails = async () => {
    try {
      const data = await api.emails.listSent(keyword, category);
      setSentList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [keyword, category]);

  // Recipient Autocomplete triggers
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (recipientQuery.trim().length > 0) {
        try {
          const list = await api.emails.recentRecipients(recipientQuery);
          setRecipients(list);
          setShowDropdown(true);
        } catch (err) {
          console.error(err);
        }
      } else {
        setRecipients([]);
        setShowDropdown(false);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [recipientQuery]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!toEmail || !subject || !body) return;

    try {
      await api.emails.send({
        to_email: toEmail,
        subject,
        body,
        category: mailCategory
      });
      alert('Email logged and scheduled successfully!');
      setToEmail('');
      setRecipientQuery('');
      setSubject('');
      setBody('');
      fetchEmails();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <h2>Email outbox & Follow-up Mail Box</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Log sent mail sorted by keyword filters. Look up recipients from recent logs history.
      </p>

      <div className="grid-2" style={{ marginBottom: '32px' }}>
        {/* Compose Form */}
        <div className="glass-card" style={{ position: 'relative' }}>
          <h3>Compose & Log Email</h3>
          <form onSubmit={handleSend} style={{ marginTop: '16px' }}>
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">To: Email ID (Searched through recent mail)</label>
              <input 
                type="text" 
                className="form-control" 
                required 
                value={recipientQuery} 
                onChange={e => {
                  setRecipientQuery(e.target.value);
                  setToEmail(e.target.value);
                }} 
                placeholder="Search recent or type email..." 
              />
              {showDropdown && recipients.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)',
                  zIndex: 10,
                  maxHeight: '150px',
                  overflowY: 'auto'
                }}>
                  {recipients.map(r => (
                    <div 
                      key={r.email} 
                      onClick={() => {
                        setToEmail(r.email);
                        setRecipientQuery(r.email);
                        setShowDropdown(false);
                      }}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border-color)',
                        fontSize: '0.85rem'
                      }}
                      onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.target.style.background = 'transparent'}
                    >
                      {r.email}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Subject</label>
                <input type="text" className="form-control" required value={subject} onChange={e => setSubject(e.target.value)} placeholder="Enter email subject" />
              </div>
              <div className="form-group">
                <label className="form-label">Mail Classification Category</label>
                <select className="form-control" value={mailCategory} onChange={e => setMailCategory(e.target.value)}>
                  <option value="follow_up">Follow-up Mail</option>
                  <option value="due_notice">Library Due Warning</option>
                  <option value="general">General Academy Notice</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Body Text</label>
              <textarea 
                className="form-control" 
                required 
                rows="4" 
                value={body} 
                onChange={e => setBody(e.target.value)} 
                placeholder="Compose your email text body here..."
              ></textarea>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>
              Dispatch & Log Mail
            </button>
          </form>
        </div>

        {/* Follow-up search outbox logs list */}
        <div className="glass-card">
          <h3>Keyword Sorted Outbox</h3>
          <div style={{ display: 'flex', gap: '12px', margin: '16px 0' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search subject/body keywords..." 
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              style={{ flexGrow: 1 }}
            />
            <select 
              className="form-control" 
              value={category} 
              onChange={e => setCategory(e.target.value)}
              style={{ width: '160px' }}
            >
              <option value="">-- All categories --</option>
              <option value="follow_up">Follow-ups</option>
              <option value="due_notice">Due Warnings</option>
              <option value="general">General</option>
            </select>
          </div>

          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {loading ? (
              <p>Searching sent logs...</p>
            ) : sentList.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No matching sent mails found.</p>
            ) : (
              sentList.map(m => (
                <div key={m.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <div className="flex-between">
                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{m.subject}</span>
                    <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)' }}>{m.category}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0' }}>
                    To: {m.to_email} | Sent {new Date(m.sent_at).toLocaleString()}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'pre-line' }}>{m.body}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function HeadBatchesPanel() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [isOpen, setIsOpen] = useState(true);

  const fetchBatches = async () => {
    try {
      const data = await api.batches.list();
      setBatches(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.batches.create({
        name,
        description: desc,
        is_open: isOpen
      });
      alert('Batch opening created successfully!');
      setName('');
      setDesc('');
      setIsOpen(true);
      fetchBatches();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <h2>Academy Batches & Course Openings</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Create and configure openings for prospective students to apply.</p>

      <div className="grid-2">
        {/* Create Card */}
        <div className="glass-card">
          <h3>Create New Opening</h3>
          <form onSubmit={handleCreate} style={{ marginTop: '16px' }}>
            <div className="form-group">
              <label className="form-label">Batch Name / Code</label>
              <input type="text" className="form-control" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Batch A Autumn 2026" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" required rows="3" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Batch course description, CTC info etc." />
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={isOpen} onChange={e => setIsOpen(e.target.checked)} />
                Open for Public Applications
              </label>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>
              Publish Opening
            </button>
          </form>
        </div>

        {/* Batches list */}
        <div className="glass-card">
          <h3>Current Batches Catalog</h3>
          <div style={{ marginTop: '16px', maxHeight: '350px', overflowY: 'auto' }}>
            {loading ? (
              <p>Loading batches...</p>
            ) : batches.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No batches registered yet.</p>
            ) : (
              batches.map(b => (
                <div key={b.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <div className="flex-between">
                    <span style={{ fontWeight: '600' }}>{b.name}</span>
                    {b.is_open ? (
                      <span className="badge badge-present">Open</span>
                    ) : (
                      <span className="badge badge-absent">Closed</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{b.description}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>Created {new Date(b.created_at).toLocaleDateString()}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
