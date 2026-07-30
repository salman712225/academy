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
                    <li className={`nav-item ${activeTab === 'student_events' ? 'active' : ''}`} onClick={() => setActiveTab('student_events')}>
                      Events & Calendar
                    </li>
                    <li className={`nav-item ${activeTab === 'student_notes' ? 'active' : ''}`} onClick={() => setActiveTab('student_notes')}>
                      Study Material
                    </li>
                    <li className={`nav-item ${activeTab === 'student_resume' ? 'active' : ''}`} onClick={() => setActiveTab('student_resume')}>
                      My Resume
                    </li>
                  </>
                )}

                {/* Trainer Navigation */}
                {user.role === 'trainer' && (
                  <>
                    <li className={`nav-item ${activeTab === 'trainer_attendance' ? 'active' : ''}`} onClick={() => setActiveTab('trainer_attendance')}>
                      Upload Attendance
                    </li>
                    <li className={`nav-item ${activeTab === 'trainer_events' ? 'active' : ''}`} onClick={() => setActiveTab('trainer_events')}>
                      Events & Calendar
                    </li>
                    <li className={`nav-item ${activeTab === 'trainer_notes' ? 'active' : ''}`} onClick={() => setActiveTab('trainer_notes')}>
                      Study Material
                    </li>
                    <li className={`nav-item ${activeTab === 'trainer_resumes' ? 'active' : ''}`} onClick={() => setActiveTab('trainer_resumes')}>
                      Student Resumes
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
                    <li className={`nav-item ${activeTab === 'associate_events' ? 'active' : ''}`} onClick={() => setActiveTab('associate_events')}>
                      Events & Calendar
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
                    <li className={`nav-item ${activeTab === 'head_events' ? 'active' : ''}`} onClick={() => setActiveTab('head_events')}>
                      Events & Calendar
                    </li>
                    <li className={`nav-item ${activeTab === 'head_notes' ? 'active' : ''}`} onClick={() => setActiveTab('head_notes')}>
                      Study Material
                    </li>
                    <li className={`nav-item ${activeTab === 'head_resumes' ? 'active' : ''}`} onClick={() => setActiveTab('head_resumes')}>
                      Student Resumes
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
            
            {/* Events Panels */}
            {['student_events', 'trainer_events', 'associate_events', 'head_events'].includes(activeTab) && <EventsPanel user={user} />}

            {/* Study Material Panels */}
            {['student_notes', 'trainer_notes', 'head_notes'].includes(activeTab) && <StudyMaterialPanel user={user} />}

            {/* Resume Upload Panel */}
            {activeTab === 'student_resume' && <StudentResumeUploadPanel />}

            {/* Student Resumes List Panel */}
            {['trainer_resumes', 'head_resumes'].includes(activeTab) && <ResumesListPanel />}
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
  const [summary, setSummary] = useState({
    records: [],
    day_wise_attendance_pct: 0,
    session_wise_attendance_pct: 0,
    total_conducted_sessions: 0,
    attended_sessions: 0,
    total_conducted_days: 0,
    attended_days: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const data = await api.attendance.myAttendance();
        setSummary(data || {
          records: [],
          day_wise_attendance_pct: 0,
          session_wise_attendance_pct: 0,
          total_conducted_sessions: 0,
          attended_sessions: 0,
          total_conducted_days: 0,
          attended_days: 0
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  const getStatusBadge = (val) => {
    if (!val) return <span style={{ color: 'var(--text-muted)' }}>-</span>;
    const s_lower = val.toString().trim().toLowerCase();
    if (s_lower === 'none' || s_lower === '-' || s_lower === '') {
      return <span style={{ color: 'var(--text-muted)' }}>-</span>;
    }
    if (s_lower === 'absent') return <span className="badge badge-absent">A</span>;
    if (s_lower === 'late') return <span className="badge badge-late">L</span>;
    if (s_lower === 'present') return <span className="badge badge-present">P</span>;
    return <span className="badge badge-present" title="Present">{val}</span>;
  };

  const records = summary.records || [];
  const dayWisePct = summary.day_wise_attendance_pct || 0;
  const sessionWisePct = summary.session_wise_attendance_pct || 0;
  const conductedSessions = summary.total_conducted_sessions || 0;
  const attendedSessions = summary.attended_sessions || 0;
  const conductedDays = summary.total_conducted_days || 0;
  const attendedDays = summary.attended_days || 0;

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Daily Class Attendance</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Here is your 4-session daily attendance log details.</p>
      
      {loading ? (
        <p>Loading attendance data...</p>
      ) : records.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No attendance logs available yet.</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: `conic-gradient(var(--accent-indigo) 0% ${sessionWisePct}%, rgba(255, 255, 255, 0.05) ${sessionWisePct}% 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--glow-shadow)'
              }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  color: 'var(--text-primary)'
                }}>
                  {sessionWisePct}%
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>Session Attendance</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', marginTop: '2px', color: 'var(--accent-indigo)' }}>
                  {sessionWisePct}%
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                  Attended {attendedSessions} of {conductedSessions} sessions
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: `conic-gradient(var(--accent-cyan) 0% ${dayWisePct}%, rgba(255, 255, 255, 0.05) ${dayWisePct}% 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--glow-shadow)'
              }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  color: 'var(--text-primary)'
                }}>
                  {dayWisePct}%
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>Day Attendance</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', marginTop: '2px', color: 'var(--accent-cyan)' }}>
                  {dayWisePct}%
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                  Attended {attendedDays} of {conductedDays} days
                </div>
              </div>
            </div>
          </div>

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
        </>
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
                  <th>Lend Date & Time</th>
                  <th>Due Date & Time</th>
                  <th>Return Date & Time</th>
                  <th>Status</th>
                  <th>Fine (₹)</th>
                </tr>
              </thead>
              <tbody>
                {summary.lendings.map(l => (
                  <tr key={l.id}>
                    <td>{l.book_title}</td>
                    <td><code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>{l.copy_id}</code></td>
                    <td>{new Date(l.lend_date).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td>{new Date(l.due_date).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td>{l.return_date ? new Date(l.return_date).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '-'}</td>
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
  const [stats, setStats] = useState({ day_summaries: [], topic_counts: {} });
  const [statsLoading, setStatsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // list, stats

  // Sub-pages states
  const [subTab, setSubTab] = useState('manual_update'); // manual_update, xlsx_upload, view_attendance
  
  // Helper to format today's date
  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [students, setStudents] = useState([]);
  const [manualRecords, setManualRecords] = useState({});
  const [manualLoading, setManualLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // View state filters
  const [viewDateFilter, setViewDateFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch batches & schema on load
  useEffect(() => {
    const fetchSchemaAndBatches = async () => {
      try {
        const schemaData = await api.attendance.getSchema();
        setColumns(schemaData.expected_columns || []);
        
        const batchData = await api.batches.list();
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

  // Fetch student list & existing attendance for manual tab
  const fetchManualAttendance = async () => {
    if (!selectedBatch) {
      setStudents([]);
      setManualRecords({});
      return;
    }
    setManualLoading(true);
    try {
      const studentsList = await api.attendance.getBatchStudents(selectedBatch);
      setStudents(studentsList);

      const existing = await api.attendance.getBatchAttendance(selectedBatch, selectedDate);
      
      const recordsMap = {};
      studentsList.forEach(student => {
        const studentEmail = student.email.toLowerCase();
        const found = existing.find(r => r.student_email.toLowerCase() === studentEmail);
        recordsMap[student.email] = {
          session_1: found ? found.session_1 : 'None',
          session_2: found ? found.session_2 : 'None',
          session_3: found ? found.session_3 : 'None',
          session_4: found ? found.session_4 : 'None'
        };
      });
      setManualRecords(recordsMap);
    } catch (err) {
      console.error("Error loading manual attendance: ", err);
    } finally {
      setManualLoading(false);
    }
  };

  useEffect(() => {
    if (subTab === 'manual_update') {
      fetchManualAttendance();
    }
  }, [selectedBatch, selectedDate, subTab]);

  // Fetch all batch logs for view tab
  const fetchBatchAttendance = async () => {
    if (!selectedBatch) return;
    try {
      const data = await api.attendance.getBatchAttendance(selectedBatch, viewDateFilter);
      setLogs(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    if (!selectedBatch) return;
    setStatsLoading(true);
    try {
      const data = await api.attendance.getStats(selectedBatch);
      setStats(data || { day_summaries: [], topic_counts: {} });
    } catch (err) {
      console.error(err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (subTab === 'view_attendance') {
      fetchBatchAttendance();
      fetchStats();
    }
  }, [selectedBatch, viewDateFilter, subTab]);

  // Handlers
  const handleSessionChange = (email, sessionKey, value) => {
    setManualRecords(prev => ({
      ...prev,
      [email]: {
        ...prev[email],
        [sessionKey]: value
      }
    }));
  };

  const handleSaveManual = async (e) => {
    e.preventDefault();
    if (!selectedBatch || !selectedDate) return;
    
    setSaving(true);
    try {
      const recordsList = Object.entries(manualRecords).map(([email, sessions]) => ({
        student_email: email,
        ...sessions
      }));
      
      const payload = {
        batch_id: selectedBatch,
        date: selectedDate,
        records: recordsList
      };
      
      const response = await api.attendance.manualUpdate(payload);
      alert(response.message);
      fetchBatchAttendance();
      fetchStats();
    } catch (err) {
      alert(err.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

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
      fetchBatchAttendance();
      fetchStats();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDate = async () => {
    if (!selectedBatch || !viewDateFilter) return;
    if (!window.confirm(`Are you sure you want to delete all attendance records for batch '${selectedBatch}' on ${viewDateFilter}?`)) return;
    
    setLoading(true);
    try {
      const res = await api.attendance.deleteDate(selectedBatch, viewDateFilter);
      alert(res.message);
      fetchBatchAttendance();
      fetchStats();
    } catch (err) {
      alert(err.message || "Failed to delete date attendance");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!selectedBatch) return;
    if (!window.confirm(`WARNING: Are you sure you want to delete ALL attendance records and summaries for batch '${selectedBatch}'? This cannot be undone.`)) return;
    
    setLoading(true);
    try {
      const res = await api.attendance.deleteAll(selectedBatch);
      alert(res.message);
      fetchBatchAttendance();
      fetchStats();
    } catch (err) {
      alert(err.message || "Failed to delete all attendance");
    } finally {
      setLoading(false);
    }
  };

  const getSessionBgColor = (status) => {
    if (!status) return '#475569';
    const s = status.toString().trim().toLowerCase();
    if (s === 'none' || s === '-' || s === '') return '#475569'; // Slate/None
    if (s === 'absent') return '#f43f5e';  // Rose
    if (s === 'late') return '#f59e0b';    // Amber
    return '#10b981';                       // Emerald (Present/Topic)
  };

  const filteredLogs = logs.filter(l => 
    l.student_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <h2 style={{ marginBottom: '8px' }}>Class Attendance</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Manage and track student class attendance. Supports manual updates, XLSX sheet imports, and date-filtered log reviews.
      </p>

      {/* Sub-tabs Navigation */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px', paddingBottom: '12px' }}>
        <button 
          className={`btn ${subTab === 'manual_update' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSubTab('manual_update')}
          style={{ padding: '8px 16px', borderRadius: '8px' }}
        >
          Manual Update
        </button>
        <button 
          className={`btn ${subTab === 'xlsx_upload' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSubTab('xlsx_upload')}
          style={{ padding: '8px 16px', borderRadius: '8px' }}
        >
          XLSX Upload
        </button>
        <button 
          className={`btn ${subTab === 'view_attendance' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSubTab('view_attendance')}
          style={{ padding: '8px 16px', borderRadius: '8px' }}
        >
          View Attendance
        </button>
      </div>

      {/* Batch Selector (Required for all sub-tabs) */}
      <div className="glass-card" style={{ marginBottom: '24px', padding: '16px 24px' }}>
        <div className="form-group" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '16px' }}>
          <label className="form-label" style={{ margin: 0, minWidth: '120px', fontWeight: '600' }}>Active Batch:</label>
          <select 
            className="form-control" 
            required 
            value={selectedBatch} 
            onChange={e => setSelectedBatch(e.target.value)}
            style={{ maxWidth: '300px' }}
          >
            <option value="">-- Select Class / Batch --</option>
            {batches.map(b => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedBatch && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Please select an active batch to manage attendance.
        </div>
      )}

      {/* --- SUB-TAB: MANUAL UPDATE --- */}
      {selectedBatch && subTab === 'manual_update' && (
        <div>
          <div className="glass-card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-indigo)" strokeWidth="2.5"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                Manual Attendance Entry
              </h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label className="form-label" style={{ margin: 0, fontWeight: '600' }}>Attendance Date:</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={selectedDate} 
                  onChange={e => setSelectedDate(e.target.value)} 
                  style={{ width: '160px' }}
                />
              </div>
            </div>

            {manualLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading students data...</div>
            ) : students.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No students registered under this batch.</div>
            ) : (
              <form onSubmit={handleSaveManual}>
                <div className="table-wrapper" style={{ marginBottom: '20px' }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Asp ID</th>
                        <th>Student Details</th>
                        <th>Session 1</th>
                        <th>Session 2</th>
                        <th>Session 3</th>
                        <th>Session 4</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(student => (
                        <tr key={student.email}>
                          <td>
                            <span style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>
                              {student.asp_id || 'N/A'}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: '600' }}>{student.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{student.email}</div>
                          </td>
                          {['session_1', 'session_2', 'session_3', 'session_4'].map(sess => (
                            <td key={sess}>
                              <select 
                                className="form-control" 
                                value={manualRecords[student.email]?.[sess] || 'None'}
                                onChange={e => handleSessionChange(student.email, sess, e.target.value)}
                                style={{
                                  backgroundColor: getSessionBgColor(manualRecords[student.email]?.[sess]),
                                  color: '#fff',
                                  fontWeight: '600',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '4px 8px',
                                  width: '110px',
                                  cursor: 'pointer'
                                }}
                              >
                                <option value="None" style={{ backgroundColor: '#1e293b' }}>None</option>
                                <option value="Present" style={{ backgroundColor: '#1e293b' }}>Present</option>
                                <option value="Absent" style={{ backgroundColor: '#1e293b' }}>Absent</option>
                                <option value="Late" style={{ backgroundColor: '#1e293b' }}>Late</option>
                              </select>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" style={{ minWidth: '180px' }} disabled={saving}>
                    {saving ? 'Saving Attendance...' : 'Save Attendance Records'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* --- SUB-TAB: XLSX UPLOAD --- */}
      {selectedBatch && subTab === 'xlsx_upload' && (
        <div>
          <div className="schema-alert" style={{ marginBottom: '24px' }}>
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
            <div className="glass-card">
              <form onSubmit={handleUpload}>
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
        </div>
      )}

      {/* --- SUB-TAB: VIEW ATTENDANCE --- */}
      {selectedBatch && subTab === 'view_attendance' && (
        <div className="glass-card">
          {user.role === 'head' && (
            <div style={{ background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '16px 20px', borderRadius: '8px', marginBottom: '24px' }}>
              <h5 style={{ color: '#f43f5e', margin: '0 0 8px 0', fontSize: '0.95rem', fontWeight: '600' }}>Admin Danger Zone</h5>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={handleDeleteDate}
                  disabled={!viewDateFilter || loading}
                  style={{ backgroundColor: '#f43f5e', color: '#fff', border: 'none', padding: '6px 14px', fontSize: '0.85rem', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Delete Selected Date Attendance
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={handleDeleteAll}
                  disabled={loading}
                  style={{ backgroundColor: 'transparent', color: '#f43f5e', border: '1px solid #f43f5e', padding: '6px 14px', fontSize: '0.85rem', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Delete All Batch Attendance
                </button>
                {!viewDateFilter && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    * Select a date filter below first to delete attendance for a specific date.
                  </span>
                )}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
            <h3 style={{ margin: 0 }}>Attendance Log Review</h3>
            
            {viewMode === 'list' && (
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label className="form-label" style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Search Student:</label>
                  <input 
                    type="text" 
                    placeholder="Email..." 
                    className="form-control" 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ width: '180px', height: '36px', padding: '4px 10px', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label className="form-label" style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Filter Date:</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={viewDateFilter}
                    onChange={e => setViewDateFilter(e.target.value)}
                    style={{ width: '150px', height: '36px', padding: '4px 10px', fontSize: '0.9rem' }}
                  />
                  {viewDateFilter && (
                    <button 
                      type="button"
                      className="btn btn-secondary" 
                      onClick={() => setViewDateFilter('')}
                      style={{ height: '36px', padding: '4px 10px', fontSize: '0.8rem' }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Toggle between Daywise list and Summaries */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px', width: 'fit-content' }}>
            <button 
              type="button" 
              className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('list')}
              style={{ padding: '6px 12px', fontSize: '0.85rem', borderRadius: '6px', border: 'none' }}
            >
              Daywise Student List
            </button>
            <button 
              type="button" 
              className={`btn ${viewMode === 'stats' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('stats')}
              style={{ padding: '6px 12px', fontSize: '0.85rem', borderRadius: '6px', border: 'none' }}
            >
              Daywise Presents & Topic Count
            </button>
          </div>

          {viewMode === 'list' ? (
            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Student Email</th>
                    <th>Date</th>
                    <th>Topics Taught</th>
                    <th>Session 1</th>
                    <th>Session 2</th>
                    <th>Session 3</th>
                    <th>Session 4</th>
                    <th>Uploader</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(l => {
                    const dayStats = stats.day_summaries.find(d => d.date === l.date);
                    const topicsTaught = dayStats && dayStats.topics && dayStats.topics.length > 0
                      ? dayStats.topics.join(', ')
                      : 'None';
                    return (
                      <tr key={l.id}>
                        <td>{l.student_email}</td>
                        <td>{l.date}</td>
                        <td>
                          <span className="badge" style={{ backgroundColor: 'var(--accent-cyan)', color: '#000', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', fontWeight: '600' }}>
                            {topicsTaught}
                          </span>
                        </td>
                        <td>
                          <span className="badge" style={{ backgroundColor: getSessionBgColor(l.session_1), color: '#fff', padding: '4px 8px', borderRadius: '4px', fontWeight: '600' }}>
                            {l.session_1}
                          </span>
                        </td>
                        <td>
                          <span className="badge" style={{ backgroundColor: getSessionBgColor(l.session_2), color: '#fff', padding: '4px 8px', borderRadius: '4px', fontWeight: '600' }}>
                            {l.session_2}
                          </span>
                        </td>
                        <td>
                          <span className="badge" style={{ backgroundColor: getSessionBgColor(l.session_3), color: '#fff', padding: '4px 8px', borderRadius: '4px', fontWeight: '600' }}>
                            {l.session_3}
                          </span>
                        </td>
                        <td>
                          <span className="badge" style={{ backgroundColor: getSessionBgColor(l.session_4), color: '#fff', padding: '4px 8px', borderRadius: '4px', fontWeight: '600' }}>
                            {l.session_4}
                          </span>
                        </td>
                        <td>{l.uploaded_by}</td>
                      </tr>
                    );
                  })}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>No matching records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : statsLoading ? (
            <p>Loading attendance summaries...</p>
          ) : (
            <div>
              {/* Overall Topic Counts */}
              <div style={{ marginBottom: '32px' }}>
                <h4 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Classes Conducted by Topic</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                  {Object.entries(stats.topic_counts).length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No topic-specific session logs recorded yet.</p>
                  ) : (
                    Object.entries(stats.topic_counts).map(([topic, count]) => (
                      <div key={topic} className="glass-card" style={{ padding: '16px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-cyan)', marginBottom: '4px' }}>{count}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Topic: {topic}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Daywise Summary */}
              <div>
                <h4 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Daywise Attendance Summary</h4>
                <div className="table-wrapper">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Topics Taught</th>
                        <th>Total Presents</th>
                        <th>Total Absents</th>
                        <th>Total Students</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.day_summaries.map(ds => (
                        <tr key={ds.date}>
                          <td><strong>{ds.date}</strong></td>
                          <td>
                            <span className="badge" style={{ backgroundColor: 'var(--accent-cyan)', color: '#000', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', fontWeight: '600' }}>
                              {ds.topics.length > 0 ? ds.topics.join(', ') : 'None'}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-present" style={{ display: 'inline-block', width: 'fit-content' }}>
                              {ds.presents} Present
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-absent" style={{ display: 'inline-block', width: 'fit-content' }}>
                              {ds.absents} Absent
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>{ds.total_students}</td>
                        </tr>
                      ))}
                      {stats.day_summaries.length === 0 && (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>No daywise summaries found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
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
              <th>Lend Date & Time</th>
              <th>Due Date & Time</th>
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
                <td>{new Date(l.lend_date).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</td>
                <td>{new Date(l.due_date).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</td>
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
                  <th>Lend Date & Time</th>
                  <th>Due Date & Time</th>
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
                    <td><code>{l.copy_id}</code></td>
                    <td>{new Date(l.lend_date).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td>{new Date(l.due_date).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td>
                      {l.status === 'overdue' ? (
                        <span className="badge badge-absent" style={{ textTransform: 'capitalize' }}>Overdue</span>
                      ) : (
                        <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-blue)', textTransform: 'capitalize' }}>Lent</span>
                      )}
                    </td>
                    <td style={{ fontWeight: '600', color: l.fine_amount > 0 ? 'var(--accent-rose)' : 'inherit' }}>₹{l.fine_amount.toFixed(2)}</td>
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

function EventsPanel({ user }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Admin form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [formLink, setFormLink] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await api.events.list();
      setEvents(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!name || !date || !description) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      const payload = {
        name,
        date: new Date(date).toISOString(),
        description,
        form_link: formLink || null
      };
      await api.events.create(payload);
      setSuccess('Event created successfully!');
      setName('');
      setDate('');
      setDescription('');
      setFormLink('');
      setIsFormOpen(false);
      fetchEvents();
    } catch (err) {
      setError(err.message || 'Failed to create event.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    setError('');
    setSuccess('');
    try {
      await api.events.delete(id);
      setSuccess('Event deleted successfully!');
      fetchEvents();
    } catch (err) {
      setError(err.message || 'Failed to delete event.');
    }
  };

  const isManager = ['head', 'associate'].includes(user.role);

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <div>
          <h2>Events Calendar & Notifications</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Stay updated with the latest academy schedules, workshops, and guest lectures.
          </p>
        </div>
        {isManager && !isFormOpen && (
          <button className="btn btn-primary" onClick={() => setIsFormOpen(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '4px' }}>
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add New Event
          </button>
        )}
      </div>

      {error && <div className="alert-banner error" style={{ marginBottom: '20px' }}>{error}</div>}
      {success && <div className="alert-banner success" style={{ marginBottom: '20px' }}>{success}</div>}

      {isFormOpen && (
        <div className="glass-card" style={{ marginBottom: '32px', animation: 'fadeIn 0.3s ease' }}>
          <h3 className="title-gradient">Create Academy Event</h3>
          <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Event Title *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Next.js Masterclass"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Event Date & Time *</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '10px' }}>
              <label className="form-label">Event Description *</label>
              <textarea
                className="form-control"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the topics, schedule, and expectations..."
                rows="3"
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-group" style={{ marginTop: '10px' }}>
              <label className="form-label">Registration / External Form Link (Optional)</label>
              <input
                type="url"
                className="form-control"
                value={formLink}
                onChange={(e) => setFormLink(e.target.value)}
                placeholder="https://forms.gle/... or meeting link"
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button type="submit" className="btn btn-primary">Publish Event</button>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading event list...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
          {events.map((e) => {
            const eventDate = new Date(e.date);
            const isUpcoming = eventDate > new Date();
            return (
              <div className="glass-card" key={e.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '260px' }}>
                <div>
                  <div className="flex-between" style={{ marginBottom: '12px' }}>
                    <span 
                      className="badge" 
                      style={{ 
                        background: isUpcoming ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)', 
                        color: isUpcoming ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                        border: isUpcoming ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(148, 163, 184, 0.3)'
                      }}
                    >
                      {isUpcoming ? 'Upcoming' : 'Past'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      {eventDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  
                  <h3 className="title-gradient" style={{ marginBottom: '8px', fontSize: '1.25rem' }}>{e.name}</h3>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '14px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    {eventDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>

                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '20px', whiteSpace: 'pre-wrap' }}>
                    {e.description}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                  {e.form_link ? (
                    <a 
                      href={e.form_link} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="btn btn-primary" 
                      style={{ flexGrow: 1, padding: '8px 16px', fontSize: '0.85rem', textDecoration: 'none' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '4px' }}>
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                      </svg>
                      Join / Register
                    </a>
                  ) : (
                    <button 
                      className="btn btn-secondary" 
                      disabled 
                      style={{ flexGrow: 1, padding: '8px 16px', fontSize: '0.85rem', cursor: 'not-allowed', opacity: '0.6' }}
                    >
                      No registration needed
                    </button>
                  )}
                  {isManager && (
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => handleDelete(e.id)} 
                      style={{ 
                        padding: '8px 12px', 
                        color: 'var(--accent-rose)', 
                        borderColor: 'rgba(244, 63, 94, 0.2)',
                        background: 'rgba(244, 63, 94, 0.05)'
                      }}
                      title="Delete Event"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {events.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)' }}>No academy events scheduled yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const handleDownloadFile = async (url, filename) => {
  try {
    const token = localStorage.getItem('academy_token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Failed to download file. Status: ${response.status}`);
    }
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error(err);
    alert('Failed to download file. Please check your connection or permissions.');
  }
};

function StudyMaterialPanel({ user }) {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const data = await api.documents.listNotes();
      setNotes(data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch study materials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !file) {
      setError('Please fill in all fields and select a file.');
      return;
    }
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.pdf', '.ppt', '.pptx'].includes(ext)) {
      setError('Invalid file format. Only PDF, PPT, and PPTX are allowed.');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccess('');
      await api.documents.uploadNote(title, description, file);
      setSuccess('Study material uploaded successfully!');
      setTitle('');
      setDescription('');
      setFile(null);
      const fileInput = document.getElementById('note-file-input');
      if (fileInput) fileInput.value = '';
      fetchNotes();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    try {
      setError('');
      setSuccess('');
      await api.documents.deleteNote(noteId);
      setSuccess('Note deleted successfully.');
      fetchNotes();
    } catch (err) {
      console.error(err);
      setError('Failed to delete note.');
    }
  };

  const isInstructor = ['head', 'trainer'].includes(user.role);

  return (
    <div>
      <h2 style={{ marginBottom: '8px' }} className="title-gradient">Study Material & Notes</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        Access course slide decks, class notes, and supplementary reference materials.
      </p>

      {error && <div className="alert-banner error" style={{ marginBottom: '20px' }}>{error}</div>}
      {success && <div className="alert-banner success" style={{ marginBottom: '20px' }}>{success}</div>}

      {isInstructor && (
        <div className="glass-card" style={{ marginBottom: '32px', padding: '24px' }}>
          <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Upload New Study Material</h3>
          <form onSubmit={handleUpload} style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Title</label>
                <input
                  type="text"
                  className="form-control"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Introduction to MongoDB"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>File (PDF or PPT/PPTX)</label>
                <input
                  id="note-file-input"
                  type="file"
                  className="form-control"
                  onChange={(e) => setFile(e.target.files[0])}
                  accept=".pdf,.ppt,.pptx"
                  required
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Description</label>
              <textarea
                className="form-control"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write a brief overview of what this document covers..."
                rows="2"
                required
              />
            </div>
            <div>
              <button type="submit" className="btn btn-primary" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload File'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p>Loading study materials...</p>
      ) : notes.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No study materials uploaded yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {notes.map((note) => {
            const isPpt = note.filename.endsWith('.ppt') || note.filename.endsWith('.pptx');
            return (
              <div key={note.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: isPpt ? 'rgba(245, 158, 11, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {isPpt ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 22V4c0-.5.2-1 .6-1.4C5 2.2 5.5 2 6 2h12c.5 0 1 .2 1.4.6.4.4.6.9.6 1.4v18" />
                          <path d="M12 2v20" />
                          <path d="M4 12h16" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-rose)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                          <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                          <path d="M10 9H8" />
                          <path d="M16 13H8" />
                          <path d="M16 17H8" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <span className="badge" style={{
                        background: isPpt ? 'rgba(245, 158, 11, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                        color: isPpt ? 'var(--accent-amber)' : 'var(--accent-rose)',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {isPpt ? 'PPT' : 'PDF'}
                      </span>
                    </div>
                  </div>
                  <h4 style={{ marginBottom: '6px', color: 'var(--text-primary)' }}>{note.title}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px', lineBreak: 'anywhere' }}>{note.description}</p>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>By: {note.uploaded_by}</span>
                    <span>{new Date(note.uploaded_at).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleDownloadFile(`${BASE_URL}/documents/notes/${note.id}/download`, note.filename)}
                      className="btn btn-secondary"
                      style={{ flex: 1, textAlign: 'center', display: 'inline-block', padding: '6px 12px', fontSize: '0.85rem' }}
                    >
                      Download
                    </button>
                    {isInstructor && (
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="btn btn-danger"
                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StudentResumeUploadPanel() {
  const [resume, setResume] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchResume = async () => {
    try {
      setLoading(true);
      const data = await api.documents.getMyResume();
      setResume(data);
    } catch (err) {
      if (err.message && err.message.includes('No resume uploaded yet')) {
        setResume(null);
      } else {
        console.error(err);
        setError('Failed to fetch resume status.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResume();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file first.');
      return;
    }
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (ext !== '.pdf') {
      setError('Invalid file format. Resume must be in PDF format.');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccess('');
      const data = await api.documents.uploadResume(file);
      setSuccess('Resume uploaded successfully!');
      setResume(data);
      setFile(null);
      const fileInput = document.getElementById('resume-file-input');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      console.error(err);
      setError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '8px' }} className="title-gradient">My Resume</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        Maintain your professional resume here. Trainers and administrators reference this for placements.
      </p>

      {error && <div className="alert-banner error" style={{ marginBottom: '20px' }}>{error}</div>}
      {success && <div className="alert-banner success" style={{ marginBottom: '20px' }}>{success}</div>}

      {loading ? (
        <p>Loading resume details...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Current Status</h3>
            {resume ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-emerald)" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Active Resume Uploaded</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      Last updated: {new Date(resume.uploaded_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>File Name</div>
                  <div style={{ fontWeight: '500', fontSize: '0.9rem', marginTop: '2px', lineBreak: 'anywhere' }}>{resume.filename}</div>
                </div>
                <button
                  onClick={() => handleDownloadFile(`${BASE_URL}/documents/resumes/${resume.id}/download`, resume.filename)}
                  className="btn btn-secondary"
                  style={{ width: '100%', textAlign: 'center', display: 'block' }}
                >
                  View / Download Resume
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(244, 63, 94, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-rose)" strokeWidth="2">
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  </svg>
                </div>
                <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>No Resume Uploaded</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Please upload a PDF resume so your profile can be shared for placements.
                </p>
              </div>
            )}
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>
              {resume ? 'Update Resume' : 'Upload Resume'}
            </h3>
            <form onSubmit={handleUpload}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Select PDF File
                </label>
                <input
                  id="resume-file-input"
                  type="file"
                  className="form-control"
                  onChange={(e) => setFile(e.target.files[0])}
                  accept=".pdf"
                  required
                />
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '6px' }}>
                  Only PDF files are accepted. Maximum size 16MB.
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={uploading}>
                {uploading ? 'Uploading...' : resume ? 'Replace Resume' : 'Submit Resume'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ResumesListPanel() {
  const [resumes, setResumes] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const data = await api.documents.listResumes();
      setResumes(data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load student resumes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const filtered = resumes.filter(r =>
    (r.student_name && r.student_name.toLowerCase().includes(search.toLowerCase())) ||
    (r.student_email && r.student_email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <h2 style={{ marginBottom: '8px' }} className="title-gradient">Student Resumes</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        Review and download active resumes uploaded by enrolled students.
      </p>

      {error && <div className="alert-banner error" style={{ marginBottom: '20px' }}>{error}</div>}

      <div className="glass-card" style={{ marginBottom: '24px', padding: '16px' }}>
        <input
          type="text"
          className="form-control"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by student name or email..."
          style={{ maxWidth: '400px' }}
        />
      </div>

      {loading ? (
        <p>Loading student resumes...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No matching resumes found.</p>
      ) : (
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Student Email</th>
                <th>Upload Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                return (
                  <tr key={r.id}>
                    <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{r.student_name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{r.student_email}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(r.uploaded_at).toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleDownloadFile(`${BASE_URL}/documents/resumes/${r.id}/download`, r.filename)}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.8rem', padding: '4px 10px', display: 'inline-block' }}
                      >
                        Download PDF
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;

