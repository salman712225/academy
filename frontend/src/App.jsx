import React, { useState, useEffect, useRef } from 'react';
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
  const [applyAge, setApplyAge] = useState('');
  const [applyGender, setApplyGender] = useState('');
  const [applyDegree, setApplyDegree] = useState('');
  const [applyBranch, setApplyBranch] = useState('');
  const [applyPassout, setApplyPassout] = useState('');
  const [applyPercentage, setApplyPercentage] = useState('');
  const [applyArrears, setApplyArrears] = useState('');
  const [file10th, setFile10th] = useState(null);
  const [file12th, setFile12th] = useState(null);
  const [fileResume, setFileResume] = useState(null);
  const [fileUg, setFileUg] = useState(null);
  const [fileProvisional, setFileProvisional] = useState(null);

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
      const data = await api.batches.list(true, "upcoming");
      setBatchesOpen(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!applyBatchId) {
      setError('Please select a batch.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('student_name', applyName);
      formData.append('student_email', applyEmail);
      formData.append('age', applyAge);
      formData.append('gender', applyGender);
      formData.append('degree', applyDegree);
      formData.append('branch', applyBranch);
      formData.append('passout_year', applyPassout);
      formData.append('college_percentage', applyPercentage);
      formData.append('any_arrears', applyArrears);
      if (file10th) formData.append('marksheet_10th_file', file10th);
      if (file12th) formData.append('marksheet_12th_file', file12th);
      if (fileResume) formData.append('resume_file', fileResume);
      if (fileUg) formData.append('ug_marksheet_file', fileUg);
      if (fileProvisional) formData.append('provisional_certificate_file', fileProvisional);

      await api.batches.apply(applyBatchId, formData);
      setSuccess('Application submitted successfully!');
      setApplyName('');
      setApplyEmail('');
      setApplyAge('');
      setApplyGender('');
      setApplyDegree('');
      setApplyBranch('');
      setApplyPassout('');
      setApplyPercentage('');
      setApplyArrears('');
      setFile10th(null);
      setFile12th(null);
      setFileResume(null);
      setFileUg(null);
      setFileProvisional(null);
      setTimeout(() => {
        setIsApplying(false);
      }, 1500);
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
                    {user.permissions?.view_attendance && (
                      <li className={`nav-item ${activeTab === 'student_attendance' ? 'active' : ''}`} onClick={() => setActiveTab('student_attendance')}>
                        Attendance
                      </li>
                    )}
                    {user.permissions?.manage_library && (
                      <li className={`nav-item ${activeTab === 'student_library' ? 'active' : ''}`} onClick={() => setActiveTab('student_library')}>
                        My Books & Fines
                      </li>
                    )}
                    {user.permissions?.manage_leads && (
                      <li className={`nav-item ${activeTab === 'student_leads' ? 'active' : ''}`} onClick={() => setActiveTab('student_leads')}>
                        Placement Leads
                      </li>
                    )}
                    {user.permissions?.manage_events && (
                      <li className={`nav-item ${activeTab === 'student_events' ? 'active' : ''}`} onClick={() => setActiveTab('student_events')}>
                        Events & Calendar
                      </li>
                    )}
                    {user.permissions?.manage_notes && (
                      <li className={`nav-item ${activeTab === 'student_notes' ? 'active' : ''}`} onClick={() => setActiveTab('student_notes')}>
                        Study Material
                      </li>
                    )}
                    {user.permissions?.manage_resumes && (
                      <li className={`nav-item ${activeTab === 'student_resume' ? 'active' : ''}`} onClick={() => setActiveTab('student_resume')}>
                        My Resume
                      </li>
                    )}
                    {user.permissions?.manage_tests && (
                      <li className={`nav-item ${activeTab === 'weekly_tests' ? 'active' : ''}`} onClick={() => setActiveTab('weekly_tests')}>
                        Weekly Tests
                      </li>
                    )}
                    {user.permissions?.ai_placement_suite && (
                      <li className={`nav-item ${activeTab === 'ai_placement_suite' ? 'active' : ''}`} onClick={() => setActiveTab('ai_placement_suite')}>
                        AI Placement Suite
                      </li>
                    )}
                    <li className={`nav-item ${activeTab === 'portfolio_builder' ? 'active' : ''}`} onClick={() => setActiveTab('portfolio_builder')}>
                      Portfolio Builder
                    </li>
                    <li className={`nav-item ${activeTab === 'geo_attendance' ? 'active' : ''}`} onClick={() => setActiveTab('geo_attendance')}>
                      Geo Attendance
                    </li>
                    {user.permissions?.digital_library && (
                      <li className={`nav-item ${activeTab === 'digital_library' ? 'active' : ''}`} onClick={() => setActiveTab('digital_library')}>
                        Digital Library
                      </li>
                    )}
                  </>
                )}

                {/* Trainer Navigation */}
                {user.role === 'trainer' && (
                  <>
                    {user.permissions?.upload_attendance && (
                      <li className={`nav-item ${activeTab === 'trainer_attendance' ? 'active' : ''}`} onClick={() => setActiveTab('trainer_attendance')}>
                        Upload Attendance
                      </li>
                    )}
                    {user.permissions?.manage_events && (
                      <li className={`nav-item ${activeTab === 'trainer_events' ? 'active' : ''}`} onClick={() => setActiveTab('trainer_events')}>
                        Events & Calendar
                      </li>
                    )}
                    {user.permissions?.manage_notes && (
                      <li className={`nav-item ${activeTab === 'trainer_notes' ? 'active' : ''}`} onClick={() => setActiveTab('trainer_notes')}>
                        Study Material
                      </li>
                    )}
                    {user.permissions?.manage_resumes && (
                      <li className={`nav-item ${activeTab === 'trainer_resumes' ? 'active' : ''}`} onClick={() => setActiveTab('trainer_resumes')}>
                        Student Resumes
                      </li>
                    )}
                    {user.permissions?.manage_tests && (
                      <li className={`nav-item ${activeTab === 'trainer_test_builder' ? 'active' : ''}`} onClick={() => setActiveTab('trainer_test_builder')}>
                        Class Test Builder
                      </li>
                    )}
                    {user.permissions?.ai_placement_suite && (
                      <li className={`nav-item ${activeTab === 'ai_placement_suite' ? 'active' : ''}`} onClick={() => setActiveTab('ai_placement_suite')}>
                        AI Placement Suite
                      </li>
                    )}
                    <li className={`nav-item ${activeTab === 'portfolio_builder' ? 'active' : ''}`} onClick={() => setActiveTab('portfolio_builder')}>
                      Portfolio Builder
                    </li>
                    <li className={`nav-item ${activeTab === 'geo_attendance' ? 'active' : ''}`} onClick={() => setActiveTab('geo_attendance')}>
                      Geo Attendance
                    </li>
                    {user.permissions?.digital_library && (
                      <li className={`nav-item ${activeTab === 'digital_library' ? 'active' : ''}`} onClick={() => setActiveTab('digital_library')}>
                        Digital Library
                      </li>
                    )}
                  </>
                )}

                {/* Center Associate Navigation */}
                {user.role === 'associate' && (
                  <>
                    {user.permissions?.manage_leads && (
                      <li className={`nav-item ${activeTab === 'associate_leads' ? 'active' : ''}`} onClick={() => setActiveTab('associate_leads')}>
                        Lead Generation
                      </li>
                    )}
                    {user.permissions?.manage_library && (
                      <li className={`nav-item ${activeTab === 'associate_library' ? 'active' : ''}`} onClick={() => setActiveTab('associate_library')}>
                        Lend / Return Books
                      </li>
                    )}
                    {user.permissions?.manage_applications && (
                      <li className={`nav-item ${activeTab === 'associate_applications' ? 'active' : ''}`} onClick={() => setActiveTab('associate_applications')}>
                        Applications
                      </li>
                    )}
                    {user.permissions?.manage_events && (
                      <li className={`nav-item ${activeTab === 'associate_events' ? 'active' : ''}`} onClick={() => setActiveTab('associate_events')}>
                        Events & Calendar
                      </li>
                    )}
                    <li className={`nav-item ${activeTab === 'geo_attendance' ? 'active' : ''}`} onClick={() => setActiveTab('geo_attendance')}>
                      Geo Attendance
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
                    <li className={`nav-item ${activeTab === 'associate_applications' ? 'active' : ''}`} onClick={() => setActiveTab('associate_applications')}>
                      Admissions CRM
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
                    <li className={`nav-item ${activeTab === 'trainer_test_builder' ? 'active' : ''}`} onClick={() => setActiveTab('trainer_test_builder')}>
                      Class Test Builder
                    </li>
                    <li className={`nav-item ${activeTab === 'ai_placement_suite' ? 'active' : ''}`} onClick={() => setActiveTab('ai_placement_suite')}>
                      AI Placement Suite
                    </li>
                    <li className={`nav-item ${activeTab === 'portfolio_builder' ? 'active' : ''}`} onClick={() => setActiveTab('portfolio_builder')}>
                      Portfolio Builder
                    </li>
                    <li className={`nav-item ${activeTab === 'geo_attendance' ? 'active' : ''}`} onClick={() => setActiveTab('geo_attendance')}>
                      Geo Attendance
                    </li>
                    <li className={`nav-item ${activeTab === 'digital_library' ? 'active' : ''}`} onClick={() => setActiveTab('digital_library')}>
                      Digital Library
                    </li>
                    <li className={`nav-item ${activeTab === 'head_permissions' ? 'active' : ''}`} onClick={() => setActiveTab('head_permissions')}>
                      Access Control
                    </li>
                  </>
                )}
                {/* Global Personal Space Option */}
                <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: '12px 0', opacity: '0.4' }} />
                <li className={`nav-item ${activeTab === 'personal_space' ? 'active' : ''}`} onClick={() => setActiveTab('personal_space')}>
                  Personal Space
                </li>
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
            {activeTab === 'student_attendance' && user.permissions?.view_attendance && <StudentAttendancePanel />}
            {activeTab === 'student_library' && user.permissions?.manage_library && <StudentLibraryPanel />}
            {activeTab === 'student_leads' && user.permissions?.manage_leads && <PlacementLeadsPanel />}

            {/* Trainer Panels */}
            {activeTab === 'trainer_attendance' && user.permissions?.upload_attendance && <TrainerAttendancePanel user={user} />}

            {/* Center Associate Panels */}
            {activeTab === 'associate_leads' && user.permissions?.manage_leads && <LeadsManagementPanel />}
            {activeTab === 'associate_library' && user.permissions?.manage_library && <AssociateLibraryPanel />}
            {activeTab === 'associate_applications' && user.permissions?.manage_applications && <ApplicationsPanel />}

            {/* Area Head Panels */}
            {activeTab === 'head_dashboard' && <HeadDashboardPanel setTab={setActiveTab} />}
            {activeTab === 'head_bulk_upload' && <HeadBulkUploadPanel />}
            {activeTab === 'head_library' && <HeadLibraryManagerPanel />}
            {activeTab === 'head_leads' && <LeadsManagementPanel />}
            {activeTab === 'head_emails' && <HeadEmailsPanel currentUser={user} />}
            {activeTab === 'head_batches' && <HeadBatchesPanel />}
            {activeTab === 'head_attendance' && <TrainerAttendancePanel user={user} />}
            {activeTab === 'head_permissions' && <HeadPermissionsPanel />}
            
            {/* Events Panels */}
            {['student_events', 'trainer_events', 'associate_events', 'head_events'].includes(activeTab) && (user.role === 'head' || user.permissions?.manage_events) && <EventsPanel user={user} />}

            {/* Study Material Panels */}
            {['student_notes', 'trainer_notes', 'head_notes'].includes(activeTab) && (user.role === 'head' || user.permissions?.manage_notes) && <StudyMaterialPanel user={user} />}

            {/* Resume Upload Panel */}
            {activeTab === 'student_resume' && user.permissions?.manage_resumes && <StudentResumeUploadPanel />}

            {/* Student Resumes List Panel */}
            {['trainer_resumes', 'head_resumes'].includes(activeTab) && (user.role === 'head' || user.permissions?.manage_resumes) && <ResumesListPanel />}

            {/* Weekly Tests Panel */}
            {activeTab === 'weekly_tests' && user.permissions?.manage_tests && <StudentTestsPanel />}
            {activeTab === 'trainer_test_builder' && (user.role === 'head' || user.permissions?.manage_tests) && <TrainerTestPanel user={user} />}

            {/* AI Placement Suite Panel */}
            {activeTab === 'ai_placement_suite' && (user.role === 'head' || user.permissions?.ai_placement_suite) && <AIPlacementSuitePanel user={user} />}

            {activeTab === 'portfolio_builder' && <PortfolioBuilderPanel user={user} />}
            {activeTab === 'geo_attendance' && <GeoAttendancePanel user={user} />}

            {/* Digital Library Panel */}
            {activeTab === 'digital_library' && (user.role === 'head' || user.permissions?.digital_library) && <DigitalLibraryPanel user={user} />}

            {/* Personal Space Panel */}
            {activeTab === 'personal_space' && <PersonalSpacePanel user={user} />}
          </main>
        </div>
      ) : (
        /* Guest & Login View */
        <div className="auth-wrapper">
          {isApplying ? (
            <div className="glass-card auth-card" style={{ maxWidth: '800px', width: '90%' }}>
              <h2 style={{ marginBottom: '8px' }}>Apply for Admission</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>Fill in your academic details and upload documents to apply for upcoming batch openings.</p>
              
              {error && <div className="alert-banner error" style={{ marginBottom: '16px' }}>{error}</div>}
              {success && <div className="alert-banner success" style={{ marginBottom: '16px' }}>{success}</div>}

              <form onSubmit={handleApply}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  
                  {/* Select Batch */}
                  <div className="form-group">
                    <label className="form-label">Select Upcoming Batch</label>
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

                  {/* Name */}
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

                  {/* Email */}
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

                  {/* Age */}
                  <div className="form-group">
                    <label className="form-label">Age</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      required 
                      value={applyAge} 
                      onChange={e => setApplyAge(e.target.value)} 
                      placeholder="e.g. 21"
                    />
                  </div>

                  {/* Gender */}
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select 
                      className="form-control" 
                      required 
                      value={applyGender} 
                      onChange={e => setApplyGender(e.target.value)}
                    >
                      <option value="">-- Select Gender --</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Degree with specialization */}
                  <div className="form-group">
                    <label className="form-label">Degree with Specialization</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      value={applyDegree} 
                      onChange={e => setApplyDegree(e.target.value)} 
                      placeholder="e.g. B.Tech Computer Science"
                    />
                  </div>

                  {/* Branch */}
                  <div className="form-group">
                    <label className="form-label">Branch</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      value={applyBranch} 
                      onChange={e => setApplyBranch(e.target.value)} 
                      placeholder="e.g. CSE / IT / ECE"
                    />
                  </div>

                  {/* Passout Year */}
                  <div className="form-group">
                    <label className="form-label">Passout Year</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      required 
                      value={applyPassout} 
                      onChange={e => setApplyPassout(e.target.value)} 
                      placeholder="e.g. 2026"
                    />
                  </div>

                  {/* College Percentage */}
                  <div className="form-group">
                    <label className="form-label">College Percentage / CGPA</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="form-control" 
                      required 
                      value={applyPercentage} 
                      onChange={e => setApplyPercentage(e.target.value)} 
                      placeholder="e.g. 82.5"
                    />
                  </div>

                  {/* Any Arrears */}
                  <div className="form-group">
                    <label className="form-label">Any Arrears?</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      value={applyArrears} 
                      onChange={e => setApplyArrears(e.target.value)} 
                      placeholder="e.g. No, or Yes (1 History)"
                    />
                  </div>

                </div>

                <h3 style={{ marginTop: '24px', marginBottom: '16px', fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Documents Upload (PDF / Images)</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  
                  {/* 10th Marksheet */}
                  <div className="form-group">
                    <label className="form-label">10th Marksheet *</label>
                    <input 
                      type="file" 
                      className="form-control" 
                      required
                      onChange={e => setFile10th(e.target.files[0])}
                    />
                  </div>

                  {/* 12th Marksheet */}
                  <div className="form-group">
                    <label className="form-label">12th Marksheet *</label>
                    <input 
                      type="file" 
                      className="form-control" 
                      required
                      onChange={e => setFile12th(e.target.files[0])}
                    />
                  </div>

                  {/* Resume */}
                  <div className="form-group">
                    <label className="form-label">Resume / CV *</label>
                    <input 
                      type="file" 
                      className="form-control" 
                      required
                      onChange={e => setFileResume(e.target.files[0])}
                    />
                  </div>

                  {/* UG Marksheet */}
                  <div className="form-group">
                    <label className="form-label">UG Marksheet *</label>
                    <input 
                      type="file" 
                      className="form-control" 
                      required
                      onChange={e => setFileUg(e.target.files[0])}
                    />
                  </div>

                  {/* Provisional Certificate */}
                  <div className="form-group">
                    <label className="form-label">Provisional Certificate *</label>
                    <input 
                      type="file" 
                      className="form-control" 
                      required
                      onChange={e => setFileProvisional(e.target.files[0])}
                    />
                  </div>

                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
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
        
        const batchData = await api.batches.list(false, 'ongoing');
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

// ==========================================
// ACCESS CONTROL / ROLE PERMISSIONS PANEL
// ==========================================
function HeadPermissionsPanel() {
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState('trainer'); // trainer, associate, student
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const data = await api.auth.getPermissions();
      setPermissions(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch permissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleToggle = (role, key) => {
    setPermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [key]: !prev[role]?.[key]
      }
    }));
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const rolePerms = permissions[selectedRole] || {};
      await api.auth.updatePermissions(selectedRole, rolePerms);
      setSuccess(`Permissions updated successfully for ${selectedRole}!`);
    } catch (err) {
      setError(err.message || 'Failed to update permissions.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm(`Are you sure you want to reset permissions for ${selectedRole} to defaults?`)) return;
    
    const defaults = {
      trainer: {
        upload_attendance: true,
        view_attendance: true,
        manage_library: false,
        manage_leads: false,
        manage_events: true,
        manage_notes: true,
        manage_resumes: true,
        manage_tests: true,
        ai_placement_suite: true,
        digital_library: true,
        manage_applications: false,
      },
      associate: {
        upload_attendance: false,
        view_attendance: true,
        manage_library: true,
        manage_leads: true,
        manage_events: true,
        manage_notes: false,
        manage_resumes: false,
        manage_tests: false,
        ai_placement_suite: false,
        digital_library: false,
        manage_applications: true,
      },
      student: {
        upload_attendance: false,
        view_attendance: true,
        manage_library: true,
        manage_leads: true,
        manage_events: true,
        manage_notes: true,
        manage_resumes: true,
        manage_tests: true,
        ai_placement_suite: true,
        digital_library: true,
        manage_applications: false,
      }
    };

    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const defaultPerms = defaults[selectedRole];
      await api.auth.updatePermissions(selectedRole, defaultPerms);
      setPermissions(prev => ({
        ...prev,
        [selectedRole]: defaultPerms
      }));
      setSuccess(`Reset ${selectedRole} permissions to default values.`);
    } catch (err) {
      setError(err.message || 'Failed to reset permissions.');
    } finally {
      setSaving(false);
    }
  };

  const permissionLabels = {
    upload_attendance: { title: "Upload Attendance", desc: "Allow uploading XLSX spreadsheets and manually updating attendance sheets" },
    view_attendance: { title: "View Attendance", desc: "Allow viewing class attendance statistics, logs, summaries, or student specific attendance" },
    manage_library: { title: "Library Manager", desc: "Access to lending books, lending logs, library manager tab, or return copy panels" },
    manage_leads: { title: "Job Leads CRM", desc: "Access to the job placement boards, lead tracking dashboards, or pipeline CRM panels" },
    manage_applications: { title: "Applications Manager", desc: "Allow reviewing admission applications and status toggle options" },
    manage_events: { title: "Events & Calendar", desc: "Access to listing calendar details, guest lectures, or editing schedules" },
    manage_notes: { title: "Upload Study Notes", desc: "Access to posting notes files, PDFs, slides, or cleaning material logs" },
    manage_resumes: { title: "Student Resumes Review", desc: "Access to searching, reviewing, or downloading student CVs" },
    manage_tests: { title: "Tests & Test Builder", desc: "Access to weekly test panels, AI question generator, or student test lists" },
    ai_placement_suite: { title: "AI Placement Suite", desc: "Access to the Monaco code playground, ATS optimizer, and AI mock interviewer bots" },
    digital_library: { title: "Digital Library Access", desc: "Access to PDF textbook catalogs, note references, and full text search suites" }
  };

  const activePerms = permissions[selectedRole] || {};

  return (
    <div>
      <h2 style={{ marginBottom: '8px' }}>Access Control Manager</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Dynamic Permission Management: Control which features and panels each user role can access in real-time.
      </p>

      {error && <div className="alert-banner error" style={{ marginBottom: '20px' }}>{error}</div>}
      {success && <div className="alert-banner success" style={{ marginBottom: '20px' }}>{success}</div>}

      {/* Role Selection Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px', paddingBottom: '12px' }}>
        {['trainer', 'associate', 'student'].map(role => (
          <button 
            key={role}
            className={`btn ${selectedRole === role ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setSelectedRole(role); setError(''); setSuccess(''); }}
            style={{ padding: '8px 16px', borderRadius: '8px', textTransform: 'capitalize' }}
          >
            {role === 'trainer' ? 'Trainers' : role === 'associate' ? 'Center Associates' : 'Students'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading system permissions configuration...</div>
      ) : (
        <div className="glass-card" style={{ padding: '24px 32px' }}>
          <h3 style={{ marginBottom: '20px', textTransform: 'capitalize' }} className="title-gradient">
            Manage {selectedRole === 'trainer' ? 'Trainer' : selectedRole === 'associate' ? 'Associate' : 'Student'} Permissions
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
            {Object.keys(permissionLabels).map(key => {
              const info = permissionLabels[key];
              const isChecked = !!activePerms[key];
              return (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ paddingRight: '20px' }}>
                    <div style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '4px' }}>{info.title}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{info.desc}</div>
                  </div>
                  
                  {/* Premium toggle switch styling uses classes defined in index.css */}
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={() => handleToggle(selectedRole, key)}
                    />
                    <span className="slider" />
                  </label>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <button 
              className="btn btn-secondary" 
              onClick={handleReset}
              disabled={saving}
            >
              Reset to Defaults
            </button>
            <button 
              className="btn btn-primary" 
              style={{ minWidth: '150px' }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Permissions'}
            </button>
          </div>
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
  const [selectedApp, setSelectedApp] = useState(null);
  
  // Interview Form States
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewLink, setInterviewLink] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');

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
      const updatedApp = await api.batches.updateApplicationStatus(id, status);
      alert(`Application marked as ${status}.`);
      if (selectedApp && selectedApp.id === id) {
        setSelectedApp(updatedApp);
      }
      fetchApps();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;
    try {
      const updatedApp = await api.batches.scheduleInterview(selectedApp.id, {
        interview_date: interviewDate,
        interview_time: interviewTime,
        interview_link: interviewLink,
        interviewer_notes: interviewNotes
      });
      alert('Interview details saved successfully and invitation email sent.');
      setSelectedApp(updatedApp);
      fetchApps();
    } catch (err) {
      alert(err.message);
    }
  };

  // Pre-fill interview states if already set
  useEffect(() => {
    if (selectedApp && selectedApp.interview_details) {
      setInterviewDate(selectedApp.interview_details.interview_date || '');
      setInterviewTime(selectedApp.interview_details.interview_time || '');
      setInterviewLink(selectedApp.interview_details.interview_link || '');
      setInterviewNotes(selectedApp.interview_details.interviewer_notes || '');
    } else {
      setInterviewDate('');
      setInterviewTime('');
      setInterviewLink('');
      setInterviewNotes('');
    }
  }, [selectedApp]);

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
                <th>Passing Year</th>
                <th>CGPA / %</th>
                <th>Current Status</th>
                <th>Details & Actions</th>
              </tr>
            </thead>
            <tbody>
              {apps.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: '600' }}>{a.student_name}</td>
                  <td>{a.student_email}</td>
                  <td>{a.batch_id}</td>
                  <td>{a.passout_year || 'N/A'}</td>
                  <td>{a.college_percentage ? `${a.college_percentage}%` : 'N/A'}</td>
                  <td>
                    {a.status === 'pending' && <span className="badge" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--accent-amber)' }}>Pending</span>}
                    {a.status === 'approved' && <span className="badge badge-present">Approved</span>}
                    {a.status === 'rejected' && <span className="badge badge-absent">Rejected</span>}
                  </td>
                  <td>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      onClick={() => setSelectedApp(a)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {apps.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No student applications submitted yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Premium Detail Modal/Drawer */}
      {selectedApp && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="glass-card" style={{
            maxWidth: '750px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '30px',
            position: 'relative'
          }}>
            <button 
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: 'var(--text-secondary)'
              }}
              onClick={() => setSelectedApp(null)}
            >
              &times;
            </button>

            <h3 style={{ fontSize: '1.4rem', marginBottom: '4px' }}>Applicant Profile</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Submitted on {new Date(selectedApp.applied_at).toLocaleDateString()}</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Full Name</strong>
                <span style={{ fontSize: '1.05rem', fontWeight: '500' }}>{selectedApp.student_name}</span>
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email Address</strong>
                <span>{selectedApp.student_email}</span>
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Age / Gender</strong>
                <span>{selectedApp.age || 'N/A'} / {selectedApp.gender || 'N/A'}</span>
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Degree & Specialization</strong>
                <span>{selectedApp.degree || 'N/A'}</span>
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Branch</strong>
                <span>{selectedApp.branch || 'N/A'}</span>
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Passout Year</strong>
                <span>{selectedApp.passout_year || 'N/A'}</span>
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>College Percentage / CGPA</strong>
                <span>{selectedApp.college_percentage ? `${selectedApp.college_percentage}%` : 'N/A'}</span>
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Arrears Info</strong>
                <span>{selectedApp.any_arrears || 'N/A'}</span>
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Application Status</strong>
                <span className="badge" style={
                  selectedApp.status === 'approved' ? { background: 'rgba(16,185,129,0.15)', color: 'var(--accent-emerald)', textTransform: 'capitalize' } :
                  selectedApp.status === 'rejected' ? { background: 'rgba(239,68,68,0.15)', color: 'var(--accent-ruby)', textTransform: 'capitalize' } :
                  { background: 'rgba(245,158,11,0.15)', color: 'var(--accent-amber)', textTransform: 'capitalize' }
                }>
                  {selectedApp.status}
                </span>
              </div>
            </div>

            <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px' }}>Uploaded Documents</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
              
              {/* 10th Marksheet */}
              <div className="flex-between" style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.9rem' }}>10th Marksheet</span>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                  onClick={() => handleDownloadFile(`${BASE_URL}/batches/applications/${selectedApp.id}/download/marksheet_10th`, `${selectedApp.student_name.replace(/\s+/g, '_')}_10th_marksheet.pdf`)}
                >
                  Download
                </button>
              </div>

              {/* 12th Marksheet */}
              <div className="flex-between" style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.9rem' }}>12th Marksheet</span>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                  onClick={() => handleDownloadFile(`${BASE_URL}/batches/applications/${selectedApp.id}/download/marksheet_12th`, `${selectedApp.student_name.replace(/\s+/g, '_')}_12th_marksheet.pdf`)}
                >
                  Download
                </button>
              </div>

              {/* Resume */}
              <div className="flex-between" style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.9rem' }}>Resume / CV</span>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                  onClick={() => handleDownloadFile(`${BASE_URL}/batches/applications/${selectedApp.id}/download/resume`, `${selectedApp.student_name.replace(/\s+/g, '_')}_resume.pdf`)}
                >
                  Download
                </button>
              </div>

              {/* UG Marksheet */}
              <div className="flex-between" style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.9rem' }}>UG Marksheet</span>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                  onClick={() => handleDownloadFile(`${BASE_URL}/batches/applications/${selectedApp.id}/download/ug_marksheet`, `${selectedApp.student_name.replace(/\s+/g, '_')}_ug_marksheet.pdf`)}
                >
                  Download
                </button>
              </div>

              {/* Provisional Cert */}
              <div className="flex-between" style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.9rem' }}>Provisional Cert</span>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                  onClick={() => handleDownloadFile(`${BASE_URL}/batches/applications/${selectedApp.id}/download/provisional_certificate`, `${selectedApp.student_name.replace(/\s+/g, '_')}_provisional_certificate.pdf`)}
                >
                  Download
                </button>
              </div>

            </div>

            {selectedApp.status === 'pending' && (
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ background: 'var(--accent-emerald)', boxShadow: 'none' }}
                  onClick={() => handleUpdate(selectedApp.id, 'approved')}
                >
                  Approve Application
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={() => handleUpdate(selectedApp.id, 'rejected')}
                >
                  Reject Application
                </button>
              </div>
            )}

            {selectedApp.status === 'approved' && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '20px' }}>
                <h4 style={{ marginBottom: '16px' }}>Interview Scheduling</h4>
                <form onSubmit={handleScheduleInterview}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Interview Date</label>
                      <input 
                        type="date" 
                        className="form-control" 
                        required 
                        value={interviewDate} 
                        onChange={e => setInterviewDate(e.target.value)} 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Interview Time</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        required 
                        value={interviewTime} 
                        placeholder="e.g. 11:00 AM IST"
                        onChange={e => setInterviewTime(e.target.value)} 
                      />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Video Conference Meeting Link</label>
                      <input 
                        type="url" 
                        className="form-control" 
                        required 
                        value={interviewLink} 
                        placeholder="e.g. https://meet.google.com/abc-defg-hij"
                        onChange={e => setInterviewLink(e.target.value)} 
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Interviewer Notes (Optional)</label>
                    <textarea 
                      className="form-control" 
                      rows="2" 
                      value={interviewNotes} 
                      placeholder="Special instructions for candidate..."
                      onChange={e => setInterviewNotes(e.target.value)} 
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ display: 'block', marginLeft: 'auto', marginTop: '12px' }}>
                    Save & Send Interview Invitation Email
                  </button>
                </form>
              </div>
            )}
          </div>
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
        <div className="glass-card" style={{ cursor: 'pointer' }} onClick={() => setTab('associate_applications')}>
          <div style={{ color: 'var(--text-secondary)' }}>Pending Batch Applications</div>
          <div className="stat-number">{stats.applications}</div>
          <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>Review applications &rarr;</span>
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
          <li><strong>Admissions CRM:</strong> Review submitted student applications, download documents, and schedule interviews.</li>
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
      
      const batchList = await api.batches.list(false, 'ongoing');
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

function HeadEmailsPanel({ currentUser }) {
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

  // Mail settings state
  const [mailSettings, setMailSettings] = useState({
    subject_keywords: '',
    body_keywords: '',
    exclude_keywords: '',
    required_files: ''
  });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const isHeadAdmin = currentUser?.role === 'head';

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

  const fetchMailSettings = async () => {
    try {
      setSettingsLoading(true);
      const settings = await api.emails.getSettings();
      setMailSettings({
        subject_keywords: (settings.subject_keywords || []).join('\n'),
        body_keywords: (settings.body_keywords || []).join('\n'),
        exclude_keywords: (settings.exclude_keywords || []).join('\n'),
        required_files: (settings.required_files || []).join('\n')
      });
    } catch (err) {
      console.error(err);
      setSettingsError(err.message || 'Failed to load mail settings.');
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    if (isHeadAdmin) {
      fetchMailSettings();
    } else {
      setSettingsLoading(false);
    }
  }, [isHeadAdmin]);

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

  const handleSaveMailSettings = async () => {
    if (!isHeadAdmin) return;
    setSettingsError('');
    setSettingsMessage('');
    setSettingsSaving(true);

    try {
      const payload = {
        subject_keywords: mailSettings.subject_keywords
          .split(/\n|,/)
          .map(item => item.trim())
          .filter(Boolean),
        body_keywords: mailSettings.body_keywords
          .split(/\n|,/)
          .map(item => item.trim())
          .filter(Boolean),
        exclude_keywords: mailSettings.exclude_keywords
          .split(/\n|,/)
          .map(item => item.trim())
          .filter(Boolean),
        required_files: mailSettings.required_files
          .split(/\n|,/)
          .map(item => item.trim())
          .filter(Boolean),
      };
      const data = await api.emails.saveSettings(payload);
      setMailSettings({
        subject_keywords: (data.subject_keywords || []).join('\n'),
        body_keywords: (data.body_keywords || []).join('\n'),
        exclude_keywords: (data.exclude_keywords || []).join('\n'),
        required_files: (data.required_files || []).join('\n')
      });
      setSettingsMessage('Mail settings updated successfully.');
    } catch (err) {
      setSettingsError(err.message || 'Failed to save mail settings.');
    } finally {
      setSettingsSaving(false);
    }
  };

  return (
    <div>
      <h2>Email outbox & Follow-up Mail Box</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Log sent mail sorted by keyword filters. Look up recipients from recent logs history.
      </p>

      {isHeadAdmin && (
        <div className="glass-card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0 }}>Follow-up Mail Settings</h3>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Only area head/admin can change the mailbox keywords and the actual workflow files required for the follow-up process.
              </p>
            </div>
            <button type="button" className="btn btn-primary" onClick={handleSaveMailSettings} disabled={settingsSaving}>
              {settingsSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          {settingsMessage && <div className="alert-banner success" style={{ marginBottom: '16px' }}>{settingsMessage}</div>}
          {settingsError && <div className="alert-banner error" style={{ marginBottom: '16px' }}>{settingsError}</div>}

          {settingsLoading ? (
            <p>Loading mail settings...</p>
          ) : (
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Subject Keywords</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={mailSettings.subject_keywords}
                  onChange={e => setMailSettings(prev => ({ ...prev, subject_keywords: e.target.value }))}
                  placeholder="Enter keywords separated by commas or new lines"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Body Keywords</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={mailSettings.body_keywords}
                  onChange={e => setMailSettings(prev => ({ ...prev, body_keywords: e.target.value }))}
                  placeholder="Enter keywords separated by commas or new lines"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Exclude Keywords</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={mailSettings.exclude_keywords}
                  onChange={e => setMailSettings(prev => ({ ...prev, exclude_keywords: e.target.value }))}
                  placeholder="Enter exclusions separated by commas or new lines"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Required Process Files</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={mailSettings.required_files}
                  onChange={e => setMailSettings(prev => ({ ...prev, required_files: e.target.value }))}
                  placeholder="e.g. config.json, credentials.json, token.json, keyword_matcher.py"
                />
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                  Enter the actual files required for this mailbox workflow, one per line or comma-separated.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

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
  const [group, setGroup] = useState('ongoing');

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
        is_open: isOpen,
        group: group
      });
      alert('Batch opening created successfully!');
      setName('');
      setDesc('');
      setIsOpen(true);
      setGroup('ongoing');
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
              <label className="form-label">Batch Group / Type</label>
              <select className="form-control" value={group} onChange={e => setGroup(e.target.value)}>
                <option value="ongoing">Ongoing (Current Batch)</option>
                <option value="upcoming">Upcoming (Next Batch Applications)</option>
              </select>
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
          <div style={{ marginTop: '16px', maxHeight: '420px', overflowY: 'auto' }}>
            {loading ? (
              <p>Loading batches...</p>
            ) : batches.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No batches registered yet.</p>
            ) : (
              batches.map(b => (
                <div key={b.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <div className="flex-between">
                    <span style={{ fontWeight: '600' }}>{b.name}</span>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span className="badge" style={b.group === 'upcoming' ? { background: 'rgba(99,102,241,0.15)', color: 'var(--primary-color)', textTransform: 'capitalize' } : { background: 'rgba(107,114,128,0.15)', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                        {b.group || 'ongoing'}
                      </span>
                      {b.is_open ? (
                        <span className="badge badge-present">Open</span>
                      ) : (
                        <span className="badge badge-absent">Closed</span>
                      )}
                    </div>
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

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:9000/api').replace(/\/$/, '');

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

function AIPlacementSuitePanel({ user }) {
  const [activeSubTab, setActiveSubTab] = useState('kanban');

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <h2 id="ai-placement-title" style={{ marginBottom: '6px' }} className="title-gradient">AI Placement & Career Assistant</h2>
      <p id="ai-placement-desc" style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Unlock career opportunities using advanced agentic optimization, RAG learning resources, mock interviews, and tailored resumes.
      </p>

      {/* Sub-tab navigation bar */}
      <div id="ai-placement-tabs" className="glass-card" style={{ padding: '8px', marginBottom: '28px', display: 'flex', gap: '8px', flexWrap: 'wrap', borderRadius: '12px' }}>
        {[
          { id: 'kanban', label: 'Placement Kanban', icon: '💼' },
          { id: 'outreach', label: 'AI Outreach Gen', icon: '📧' },
          { id: 'ats', label: 'ATS Score Analyzer', icon: '⚡' },
          { id: 'builder', label: 'Resume Builder', icon: '📝' },
          { id: 'interview', label: 'Interview Simulator', icon: '🗣️' },
          { id: 'coach', label: 'AI Career Coach', icon: '🤖' },
          { id: 'settings', label: 'AI Settings', icon: '⚙️' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`btn ${activeSubTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              padding: '10px 18px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: activeSubTab === tab.id ? 'none' : '1px solid var(--border-color)',
              background: activeSubTab === tab.id ? 'linear-gradient(135deg, var(--accent-indigo) 0%, var(--accent-blue) 100%)' : 'rgba(255,255,255,0.02)'
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Renders Selected Feature Panel */}
      <div style={{ marginTop: '16px' }}>
        {activeSubTab === 'settings' && <AISettingsPanel />}
        {activeSubTab === 'ats' && <ATSAnalyzerPanel user={user} />}
        {activeSubTab === 'builder' && <ResumeBuilderPanel user={user} />}
        {activeSubTab === 'interview' && <InterviewPrepPanel />}
        {activeSubTab === 'coach' && <CoachChatPanel />}
        {activeSubTab === 'kanban' && <PlacementKanbanPanel user={user} />}
        {activeSubTab === 'outreach' && <OutreachGeneratorPanel user={user} />}
      </div>
    </div>
  );
}

function AISettingsPanel() {
  const [provider, setProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [elevenLabsKey, setElevenLabsKey] = useState('');
  const [savedConfig, setSavedConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await api.aiFeatures.getLLMConfig();
      setSavedConfig(data);
      if (data.active_provider) {
        setProvider(data.active_provider);
        setApiKey(data.saved_providers[data.active_provider] || '');
      }
      setElevenLabsKey(data.saved_providers['elevenlabs'] || '');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch LLM configurations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleProviderChange = (e) => {
    const prov = e.target.value;
    setProvider(prov);
    setApiKey(savedConfig?.saved_providers[prov] || '');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!apiKey.trim()) {
      setError('Please provide a Provider API Key.');
      return;
    }
    try {
      setSaving(true);
      // Save LLM Config
      await api.aiFeatures.saveLLMConfig({ provider, api_key: apiKey });
      
      // Save ElevenLabs API key if entered/updated
      if (elevenLabsKey.trim()) {
        await api.aiFeatures.saveLLMConfig({ provider: 'elevenlabs', api_key: elevenLabsKey });
      }
      
      setSuccess(`Successfully saved settings and set ${provider.toUpperCase()} as active provider.`);
      // Reload details
      const data = await api.aiFeatures.getLLMConfig();
      setSavedConfig(data);
      setElevenLabsKey(data.saved_providers['elevenlabs'] || '');
    } catch (err) {
      setError(err.message || 'Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p style={{ color: 'var(--text-secondary)' }}>Loading AI Settings...</p>;

  return (
    <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '32px' }}>
      <h3 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '1.4rem' }}>⚙️</span> LLM Provider Settings
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
        Each student and trainer provides their own LLM API key. All prompt matching and mock interview calculations are executed securely on the server using your personal keys.
      </p>

      {error && <div className="alert-banner error" style={{ marginBottom: '20px' }}>{error}</div>}
      {success && <div className="alert-banner success" style={{ marginBottom: '20px' }}>{success}</div>}

      <form onSubmit={handleSave}>
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label className="form-label" style={{ fontWeight: '600' }}>Active AI Model Provider</label>
          <select className="form-control" value={provider} onChange={handleProviderChange} required style={{ background: 'var(--bg-input)' }}>
            <option value="gemini">Google Gemini (Model: gemini-1.5-flash)</option>
            <option value="groq">Groq AI (Model: llama-3.3-70b-versatile)</option>
            <option value="mistral">Mistral AI (Model: mistral-small-latest)</option>
            <option value="openai">OpenAI (Model: gpt-4o-mini)</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label className="form-label" style={{ fontWeight: '600' }}>Provider API Key</label>
          <input
            type="password"
            className="form-control"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-... or AIzaSy..."
            required
            style={{ background: 'var(--bg-input)' }}
          />
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '6px' }}>
            Keys are masked (e.g. ****abcd) for security. Enter a new key to replace it.
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '24px' }}>
          <label className="form-label" style={{ fontWeight: '600' }}>ElevenLabs API Key (For voice mode feedback)</label>
          <input
            type="password"
            className="form-control"
            value={elevenLabsKey}
            onChange={(e) => setElevenLabsKey(e.target.value)}
            placeholder="ElevenLabs API Key..."
            style={{ background: 'var(--bg-input)' }}
          />
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '6px' }}>
            Optional. Required only if you want to use the voice playback mode in the Mock Interview simulator.
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={saving}>
          {saving ? 'Validating & Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}

function ATSAnalyzerPanel({ user }) {
  const [jobDescription, setJobDescription] = useState('');
  const [customFile, setCustomFile] = useState(null);
  const [studentEmail, setStudentEmail] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCustomFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setError('');
    setResults(null);
    if (!jobDescription.trim()) {
      setError('Please provide a Job Description.');
      return;
    }

    try {
      setAnalyzing(true);
      const data = await api.aiFeatures.analyzeATS(
        jobDescription,
        customFile,
        user.role !== 'student' && studentEmail.trim() ? studentEmail.trim() : null
      );
      setResults(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Analysis failed. Make sure your API key is correct and active.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '28px' }}>
      {/* Analyzer inputs form */}
      <div className="glass-card" style={{ height: 'fit-content' }}>
        <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Job Description & Resume Selection</h3>
        <form onSubmit={handleAnalyze}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Job Description Target</label>
            <textarea
              className="form-control"
              rows="8"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the target job description here..."
              required
              style={{ background: 'var(--bg-input)', resize: 'vertical' }}
            />
          </div>

          {user.role !== 'student' && (
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Analyze Target Student Email (Optional)</label>
              <input
                type="email"
                className="form-control"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                placeholder="student@example.com"
                style={{ background: 'var(--bg-input)' }}
              />
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '4px' }}>
                Leave empty to analyze via custom file upload, or specify to pull their active profile resume.
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Upload New PDF Resume (Optional)</label>
            <input
              type="file"
              className="form-control"
              onChange={handleFileChange}
              accept=".pdf"
              style={{ background: 'var(--bg-input)' }}
            />
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '6px' }}>
              If not uploaded, the analyzer will automatically parse your saved Master Resume or active PDF resume.
            </div>
          </div>

          {error && <div className="alert-banner error" style={{ marginBottom: '20px' }}>{error}</div>}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={analyzing}>
            {analyzing ? 'Executing Agent Analysis...' : 'Start ATS Audit'}
          </button>
        </form>
      </div>

      {/* Results visualizer */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Audit Report Insights</h3>
        {analyzing ? (
          <div style={{ margin: 'auto', textAlign: 'center', padding: '40px 0' }}>
            <div className="spinner" style={{ border: '4px solid rgba(255,255,255,0.05)', borderTop: '4px solid var(--accent-indigo)', borderRadius: '50%', width: '48px', height: '48px', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ fontWeight: '500' }}>Running multi-agent optimization workflow...</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '6px' }}>Extracting details, running RAG database searches, and compiling audit reports...</p>
          </div>
        ) : results ? (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            {/* Score gauge and Explainable AI breakdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
              <div style={{
                position: 'relative',
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                background: `conic-gradient(${results.score >= 70 ? 'var(--accent-emerald)' : results.score >= 40 ? 'var(--accent-amber)' : 'var(--accent-rose)'} ${results.score * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--glow-shadow)'
              }}>
                <div style={{
                  width: '74px',
                  height: '74px',
                  borderRadius: '50%',
                  background: 'var(--bg-app)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '1.4rem'
                }}>
                  {results.score}%
                </div>
              </div>
              <div style={{ flexGrow: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                  ATS Match Score
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
                  Weighted match: Skills (40%), Experience (30%), formatting (30%).
                </div>
              </div>
            </div>

            {/* Explainable AI report */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
              <div style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '6px' }}>
                💡 Explainable AI Analysis
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {results.explanation}
              </p>
            </div>

            {/* Keyword matching splits */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ border: '1px solid rgba(16, 185, 129, 0.2)', background: 'rgba(16, 185, 129, 0.02)', padding: '14px', borderRadius: '8px' }}>
                <div style={{ color: 'var(--accent-emerald)', fontWeight: '600', fontSize: '0.85rem', marginBottom: '8px' }}>Matching Keywords ({results.matching_keywords.length})</div>
                {results.matching_keywords.length === 0 ? (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None found</span>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {results.matching_keywords.map((kw, i) => (
                      <span key={i} style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-emerald)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '500' }}>{kw}</span>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ border: '1px solid rgba(244, 63, 94, 0.2)', background: 'rgba(244, 63, 94, 0.02)', padding: '14px', borderRadius: '8px' }}>
                <div style={{ color: 'var(--accent-rose)', fontWeight: '600', fontSize: '0.85rem', marginBottom: '8px' }}>Missing Keywords ({results.missing_keywords.length})</div>
                {results.missing_keywords.length === 0 ? (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None found</span>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {results.missing_keywords.map((kw, i) => (
                      <span key={i} style={{ background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent-rose)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '500' }}>{kw}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* In-House RAG Course & Notes Recommendations */}
            <div style={{ marginBottom: '24px', border: '1px solid rgba(99, 102, 241, 0.2)', background: 'rgba(99, 102, 241, 0.02)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--accent-indigo)', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📖 Local RAG Learning Recommendations
              </div>
              {results.rag_recommendations.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No direct class batches or study notes matching your missing skills were found in the database. Contact support for help.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {results.rag_recommendations.map((rec, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            padding: '1px 6px',
                            borderRadius: '3px',
                            fontSize: '0.65rem',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            background: rec.type === 'batch' ? 'rgba(99, 102, 241, 0.15)' : rec.type === 'note' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: rec.type === 'batch' ? 'var(--accent-indigo)' : rec.type === 'note' ? 'var(--accent-cyan)' : 'var(--accent-amber)'
                          }}>{rec.type}</span>
                          <span>{rec.title}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{rec.description}</div>
                      </div>
                      {rec.type === 'note' && (
                        <button
                          onClick={() => handleDownloadFile(`${BASE_URL}${rec.link_or_details}`, rec.title + '.pdf')}
                          className="btn btn-secondary"
                          style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                        >
                          Get notes PDF
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Strengths & Action points */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '8px' }}>Key Strengths</div>
              <ul>
                {results.strengths.map((str, i) => (
                  <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{str}</li>
                ))}
              </ul>
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '8px' }}>Actionable Suggestions</div>
              <ul>
                {results.suggestions.map((sug, i) => (
                  <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{sug}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div style={{ margin: 'auto', textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '16px' }}>📋</span>
            <p>Start a job target analysis. Enter a target job description and run the optimizer.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ResumeBuilderPanel({ user }) {
  const DEFAULT_CUSTOM_LATEX = `\\documentclass[10pt,letterpaper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=0.75in]{geometry}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage[colorlinks=true,urlcolor=blue]{hyperref}

\\pagestyle{empty}

\\titleformat{\\section}{\\large\\bfseries}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{10pt}{5pt}

\\begin{document}

\\begin{center}
    {\\Huge \\bfseries {{NAME}}} \\\\
    \\vspace{2pt}
    {{TITLE}} \\\\
    \\vspace{4pt}
    Email: \\href{mailto:{{EMAIL}}}{{{EMAIL}}} | Phone: {{PHONE}} | Location: {{LOCATION}} \\\\
    \\href{{{WEBSITE}}}{{{WEBSITE}}}
\\end{center}
\\vspace{-10pt}

\\section{Professional Summary}
{{SUMMARY}}

\\section{Work Experience}
{{EXPERIENCE}}

\\section{Education}
{{EDUCATION}}

\\section{Skills}
{{SKILLS}}

\\section{Projects}
{{PROJECTS}}

\\section{Certifications}
{{CERTIFICATIONS}}

\\end{document}`;

  const [resumeData, setResumeData] = useState({
    personal_info: { name: '', email: '', phone: '', location: '', website: '', title: '' },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    template: 'modern',
    custom_latex_template: DEFAULT_CUSTOM_LATEX
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tailoring, setTailoring] = useState(false);
  const [tailoringJd, setTailoringJd] = useState('');
  const [showTailorModal, setShowTailorModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Builder wizard sub section
  const [formSection, setFormSection] = useState('personal');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.aiFeatures.getResumeData();
      if (data) {
        setResumeData(prev => ({
          ...prev,
          ...data,
          custom_latex_template: data.custom_latex_template || DEFAULT_CUSTOM_LATEX
        }));
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load resume details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePersonalInfoChange = (field, value) => {
    setResumeData(prev => ({
      ...prev,
      personal_info: { ...prev.personal_info, [field]: value }
    }));
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    try {
      setSaving(true);
      await api.aiFeatures.saveResumeData(resumeData);
      setSuccess('Master resume profile saved successfully in database!');
    } catch (err) {
      setError(err.message || 'Failed to save resume details.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadLaTeX = async () => {
    try {
      const code = await api.aiFeatures.exportLaTeX(resumeData);
      const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resumeData.personal_info.name.replace(/\s+/g, '_')}_resume.tex`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('LaTeX export failed: ' + err.message);
    }
  };

  const handleDownloadDocx = async () => {
    try {
      const blob = await api.aiFeatures.exportDocx(resumeData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resumeData.personal_info.name.replace(/\s+/g, '_')}_resume.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Word document export failed: ' + err.message);
    }
  };

  const handleTriggerTailor = async (e) => {
    e.preventDefault();
    if (!tailoringJd.trim()) return;
    setError('');
    setSuccess('');
    try {
      setTailoring(true);
      const result = await api.aiFeatures.tailorResume(tailoringJd);
      setResumeData(result.tailored_resume_data);
      setSuccess('Successfully ran Agentic Optimizer! Check revised details and preview.');
      setShowTailorModal(false);
      setTailoringJd('');
    } catch (err) {
      setError(err.message || 'Tailoring failed. Verify LLM configuration.');
    } finally {
      setTailoring(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper arrays update functions
  const addArrayItem = (key, defaultObj) => {
    setResumeData(prev => ({
      ...prev,
      [key]: [...prev[key], defaultObj]
    }));
  };

  const updateArrayItem = (key, idx, field, val) => {
    setResumeData(prev => {
      const arr = [...prev[key]];
      arr[idx] = { ...arr[idx], [field]: val };
      return { ...prev, [key]: arr };
    });
  };

  const removeArrayItem = (key, idx) => {
    setResumeData(prev => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== idx)
    }));
  };

  const getTemplateColors = (t) => {
    switch (t) {
      case 'modern':
        return { primary: '#1e3a8a', accent: '#2563eb', border: '#dbeafe', body: '#334155' };
      case 'professional':
        return { primary: '#334155', accent: '#475569', border: '#e2e8f0', body: '#334155' };
      case 'creative':
        return { primary: '#0f766e', accent: '#0d9488', border: '#ccfbf1', body: '#334155' };
      case 'executive':
        return { primary: '#991b1b', accent: '#7f1d1d', border: '#fee2e2', body: '#1e293b' };
      case 'academic':
      default:
        return { primary: '#000000', accent: '#000000', border: '#cbd5e1', body: '#000000' };
    }
  };
  const colors = getTemplateColors(resumeData.template || 'modern');

  if (loading) return <p>Loading Master Resume Details...</p>;

  return (
    <div id="resume-builder-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '28px' }}>
      {/* Wizard inputs */}
      <div id="resume-editor-column" className="glass-card" style={{ height: 'fit-content', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Master Profile Editor</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={() => setShowTailorModal(true)} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
              🎯 AI JD-Tailor
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
              {saving ? 'Saving...' : '💾 Save Master'}
            </button>
          </div>
        </div>

        {error && <div className="alert-banner error" style={{ marginBottom: '20px' }}>{error}</div>}
        {success && <div className="alert-banner success" style={{ marginBottom: '20px' }}>{success}</div>}

        {/* Wizard sections navigation */}
        <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {[
            { id: 'personal', label: 'Contact' },
            { id: 'summary', label: 'Summary' },
            { id: 'experience', label: 'Experience' },
            { id: 'education', label: 'Education' },
            { id: 'skills', label: 'Skills' },
            { id: 'projects', label: 'Projects' },
            { id: 'certifications', label: 'Certs' },
            { id: 'layout', label: 'Layout Style' }
          ].map((sec) => (
            <button
              key={sec.id}
              onClick={() => setFormSection(sec.id)}
              style={{
                background: formSection === sec.id ? 'rgba(99,102,241,0.1)' : 'none',
                border: 'none',
                color: formSection === sec.id ? 'var(--accent-indigo)' : 'var(--text-secondary)',
                padding: '6px 12px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: '600',
                borderRadius: '4px'
              }}
            >
              {sec.label}
            </button>
          ))}
        </div>

        {/* Dynamic section fields */}
        {formSection === 'personal' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', animation: 'fadeIn 0.2s' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-control" value={resumeData.personal_info.name || ''} onChange={e => handlePersonalInfoChange('name', e.target.value)} style={{ background: 'var(--bg-input)' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Target Title</label>
              <input type="text" className="form-control" value={resumeData.personal_info.title || ''} onChange={e => handlePersonalInfoChange('title', e.target.value)} placeholder="e.g. Full Stack Engineer" style={{ background: 'var(--bg-input)' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-control" value={resumeData.personal_info.email || ''} onChange={e => handlePersonalInfoChange('email', e.target.value)} style={{ background: 'var(--bg-input)' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input type="text" className="form-control" value={resumeData.personal_info.phone || ''} onChange={e => handlePersonalInfoChange('phone', e.target.value)} style={{ background: 'var(--bg-input)' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input type="text" className="form-control" value={resumeData.personal_info.location || ''} onChange={e => handlePersonalInfoChange('location', e.target.value)} placeholder="e.g. Bangalore, India" style={{ background: 'var(--bg-input)' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Website / LinkedIn / GitHub</label>
              <input type="text" className="form-control" value={resumeData.personal_info.website || ''} onChange={e => handlePersonalInfoChange('website', e.target.value)} placeholder="e.g. linkedin.com/in/username" style={{ background: 'var(--bg-input)' }} />
            </div>
          </div>
        )}

        {formSection === 'summary' && (
          <div style={{ animation: 'fadeIn 0.2s' }}>
            <div className="form-group">
              <label className="form-label">Professional Summary</label>
              <textarea
                className="form-control"
                rows="6"
                value={resumeData.summary || ''}
                onChange={e => setResumeData(prev => ({ ...prev, summary: e.target.value }))}
                placeholder="Briefly state your core expertise, career goals, and value proposition..."
                style={{ background: 'var(--bg-input)', resize: 'vertical' }}
              />
            </div>
          </div>
        )}

        {formSection === 'experience' && (
          <div style={{ animation: 'fadeIn 0.2s' }}>
            <button className="btn btn-secondary" onClick={() => addArrayItem('experience', { company: '', role: '', startDate: '', endDate: '', location: '', description: '' })} style={{ marginBottom: '16px', fontSize: '0.8rem', padding: '4px 10px' }}>
              + Add Experience
            </button>
            {resumeData.experience.map((exp, idx) => (
              <div key={idx} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', marginBottom: '16px', position: 'relative' }}>
                <button onClick={() => removeArrayItem('experience', idx)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontSize: '1.1rem' }}>&times;</button>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <input type="text" className="form-control" value={exp.company} onChange={e => updateArrayItem('experience', idx, 'company', e.target.value)} placeholder="Company Name" style={{ background: 'var(--bg-input)' }} />
                  <input type="text" className="form-control" value={exp.role} onChange={e => updateArrayItem('experience', idx, 'role', e.target.value)} placeholder="Job Role / Title" style={{ background: 'var(--bg-input)' }} />
                  <input type="text" className="form-control" value={exp.startDate} onChange={e => updateArrayItem('experience', idx, 'startDate', e.target.value)} placeholder="Start Date (e.g. June 2024)" style={{ background: 'var(--bg-input)' }} />
                  <input type="text" className="form-control" value={exp.endDate} onChange={e => updateArrayItem('experience', idx, 'endDate', e.target.value)} placeholder="End Date (e.g. Present)" style={{ background: 'var(--bg-input)' }} />
                  <input type="text" className="form-control" value={exp.location} onChange={e => updateArrayItem('experience', idx, 'location', e.target.value)} placeholder="Location" style={{ background: 'var(--bg-input)', gridColumn: 'span 2' }} />
                </div>
                <textarea
                  className="form-control"
                  rows="4"
                  value={exp.description}
                  onChange={e => updateArrayItem('experience', idx, 'description', e.target.value)}
                  placeholder="Describe your achievements (bullet points separated by new lines)..."
                  style={{ background: 'var(--bg-input)', resize: 'vertical' }}
                />
              </div>
            ))}
          </div>
        )}

        {formSection === 'education' && (
          <div style={{ animation: 'fadeIn 0.2s' }}>
            <button className="btn btn-secondary" onClick={() => addArrayItem('education', { institution: '', degree: '', major: '', startDate: '', endDate: '', gpa: '' })} style={{ marginBottom: '16px', fontSize: '0.8rem', padding: '4px 10px' }}>
              + Add Education
            </button>
            {resumeData.education.map((edu, idx) => (
              <div key={idx} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', marginBottom: '16px', position: 'relative' }}>
                <button onClick={() => removeArrayItem('education', idx)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontSize: '1.1rem' }}>&times;</button>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <input type="text" className="form-control" value={edu.institution} onChange={e => updateArrayItem('education', idx, 'institution', e.target.value)} placeholder="Institution / College" style={{ background: 'var(--bg-input)' }} />
                  <input type="text" className="form-control" value={edu.degree} onChange={e => updateArrayItem('education', idx, 'degree', e.target.value)} placeholder="Degree (e.g. B.Tech)" style={{ background: 'var(--bg-input)' }} />
                  <input type="text" className="form-control" value={edu.major} onChange={e => updateArrayItem('education', idx, 'major', e.target.value)} placeholder="Major / Specialization" style={{ background: 'var(--bg-input)' }} />
                  <input type="text" className="form-control" value={edu.gpa} onChange={e => updateArrayItem('education', idx, 'gpa', e.target.value)} placeholder="GPA / Grades (e.g. 8.5 CGPA)" style={{ background: 'var(--bg-input)' }} />
                  <input type="text" className="form-control" value={edu.startDate} onChange={e => updateArrayItem('education', idx, 'startDate', e.target.value)} placeholder="Start Year" style={{ background: 'var(--bg-input)' }} />
                  <input type="text" className="form-control" value={edu.endDate} onChange={e => updateArrayItem('education', idx, 'endDate', e.target.value)} placeholder="End Year / Grad date" style={{ background: 'var(--bg-input)' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {formSection === 'skills' && (
          <div style={{ animation: 'fadeIn 0.2s' }}>
            <button className="btn btn-secondary" onClick={() => addArrayItem('skills', { category: '', list: '' })} style={{ marginBottom: '16px', fontSize: '0.8rem', padding: '4px 10px' }}>
              + Add Skill Category
            </button>
            {resumeData.skills.map((sk, idx) => (
              <div key={idx} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', marginBottom: '16px', position: 'relative' }}>
                <button onClick={() => removeArrayItem('skills', idx)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontSize: '1.1rem' }}>&times;</button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input type="text" className="form-control" value={sk.category} onChange={e => updateArrayItem('skills', idx, 'category', e.target.value)} placeholder="Category Title (e.g. Languages, Frontend)" style={{ background: 'var(--bg-input)' }} />
                  <input type="text" className="form-control" value={sk.list} onChange={e => updateArrayItem('skills', idx, 'list', e.target.value)} placeholder="Skills (comma-separated, e.g. React, Redux, HTML5)" style={{ background: 'var(--bg-input)' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {formSection === 'projects' && (
          <div style={{ animation: 'fadeIn 0.2s' }}>
            <button className="btn btn-secondary" onClick={() => addArrayItem('projects', { title: '', role: '', link: '', description: '' })} style={{ marginBottom: '16px', fontSize: '0.8rem', padding: '4px 10px' }}>
              + Add Project
            </button>
            {resumeData.projects.map((proj, idx) => (
              <div key={idx} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', marginBottom: '16px', position: 'relative' }}>
                <button onClick={() => removeArrayItem('projects', idx)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontSize: '1.1rem' }}>&times;</button>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <input type="text" className="form-control" value={proj.title} onChange={e => updateArrayItem('projects', idx, 'title', e.target.value)} placeholder="Project Title" style={{ background: 'var(--bg-input)' }} />
                  <input type="text" className="form-control" value={proj.role} onChange={e => updateArrayItem('projects', idx, 'role', e.target.value)} placeholder="Your role / stack used" style={{ background: 'var(--bg-input)' }} />
                  <input type="text" className="form-control" value={proj.link} onChange={e => updateArrayItem('projects', idx, 'link', e.target.value)} placeholder="Project URL Link" style={{ background: 'var(--bg-input)', gridColumn: 'span 2' }} />
                </div>
                <textarea
                  className="form-control"
                  rows="4"
                  value={proj.description}
                  onChange={e => updateArrayItem('projects', idx, 'description', e.target.value)}
                  placeholder="Detailed project summary, accomplishments, and impacts..."
                  style={{ background: 'var(--bg-input)', resize: 'vertical' }}
                />
              </div>
            ))}
          </div>
        )}

        {formSection === 'certifications' && (
          <div style={{ animation: 'fadeIn 0.2s' }}>
            <button className="btn btn-secondary" onClick={() => addArrayItem('certifications', { name: '', issuer: '', date: '' })} style={{ marginBottom: '16px', fontSize: '0.8rem', padding: '4px 10px' }}>
              + Add Certification
            </button>
            {resumeData.certifications.map((cert, idx) => (
              <div key={idx} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', marginBottom: '16px', position: 'relative' }}>
                <button onClick={() => removeArrayItem('certifications', idx)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontSize: '1.1rem' }}>&times;</button>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <input type="text" className="form-control" value={cert.name} onChange={e => updateArrayItem('certifications', idx, 'name', e.target.value)} placeholder="Cert Name" style={{ background: 'var(--bg-input)' }} />
                  <input type="text" className="form-control" value={cert.issuer} onChange={e => updateArrayItem('certifications', idx, 'issuer', e.target.value)} placeholder="Issuer (e.g. AWS)" style={{ background: 'var(--bg-input)' }} />
                  <input type="text" className="form-control" value={cert.date} onChange={e => updateArrayItem('certifications', idx, 'date', e.target.value)} placeholder="Issue Date" style={{ background: 'var(--bg-input)' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {formSection === 'layout' && (
          <div style={{ animation: 'fadeIn 0.2s' }}>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Active Template Layout</label>
              <select
                className="form-control"
                value={resumeData.template || 'modern'}
                onChange={e => setResumeData(prev => ({ ...prev, template: e.target.value }))}
                style={{ background: 'var(--bg-input)' }}
              >
                <option value="modern">Modern Centered Style</option>
                <option value="professional">Professional Left-Aligned Style</option>
                <option value="academic">Academic Classic Style</option>
                <option value="creative">Creative Teal Sidebar Style</option>
                <option value="executive">Executive Burgundy Classic Style</option>
                <option value="custom">Custom LaTeX Style</option>
              </select>
            </div>
            {resumeData.template === 'custom' && (
              <div className="form-group" style={{ animation: 'fadeIn 0.2s' }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Custom LaTeX Source Template</span>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setResumeData(prev => ({ ...prev, custom_latex_template: DEFAULT_CUSTOM_LATEX }))}
                    style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                    type="button"
                  >
                    Reset Template
                  </button>
                </label>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '8px', lineHeight: '1.4' }}>
                  Provide your own custom LaTeX document tags. Use these placeholders to map details dynamically:
                  <br />
                  <code>{"{{NAME}}, {{TITLE}}, {{EMAIL}}, {{PHONE}}, {{LOCATION}}, {{WEBSITE}}, {{SUMMARY}}, {{EXPERIENCE}}, {{EDUCATION}}, {{SKILLS}}, {{PROJECTS}}, {{CERTIFICATIONS}}"}</code>
                </div>
                <textarea
                  className="form-control"
                  rows="14"
                  value={resumeData.custom_latex_template || ''}
                  onChange={e => setResumeData(prev => ({ ...prev, custom_latex_template: e.target.value }))}
                  placeholder="Type or paste your compilable LaTeX markup here..."
                  style={{ background: 'var(--bg-input)', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.8rem' }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview and templates exports */}
      <div id="resume-preview-column" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div id="resume-export-options-card" className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>Export & Print Options</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
            <button className="btn btn-secondary" onClick={handleDownloadLaTeX} style={{ padding: '8px', fontSize: '0.8rem' }}>
              📥 Get LaTeX (.tex)
            </button>
            <button className="btn btn-secondary" onClick={handleDownloadDocx} style={{ padding: '8px', fontSize: '0.8rem' }}>
              📥 Get Word (.docx)
            </button>
            <button className="btn btn-primary" onClick={handlePrint} style={{ padding: '8px', fontSize: '0.8rem' }}>
              🖨️ Print PDF
            </button>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Select Layout Template</label>
            <select
              className="form-control"
              value={resumeData.template || 'modern'}
              onChange={e => setResumeData(prev => ({ ...prev, template: e.target.value }))}
              style={{ background: 'var(--bg-input)', padding: '6px 12px', fontSize: '0.85rem' }}
            >
              <option value="modern">Modern Minimalist (Blue Accent)</option>
              <option value="professional">Professional Executive (Classic Gray)</option>
              <option value="academic">Academic & Technical CV (Clean Standard)</option>
              <option value="creative">Creative Teal Sidebar Style</option>
              <option value="executive">Executive Burgundy Classic Style</option>
              <option value="custom">Custom LaTeX Style</option>
            </select>
          </div>
        </div>

        {/* Live Resume Sheet Preview */}
        <div id="resume-preview-card" className="glass-card" style={{ flexGrow: 1, padding: '0px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          <div id="resume-preview-header" style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>LIVE PREVIEW SHEET</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
            </div>
          </div>

          <div id="resume-print-area" className={`resume-preview-sheet template-${resumeData.template || 'modern'}`} style={{
            background: '#ffffff',
            color: colors.body,
            padding: '40px',
            fontSize: '11px',
            lineHeight: '1.4',
            fontFamily: (resumeData.template === 'academic' || resumeData.template === 'executive') ? 'Georgia, Times New Roman, serif' : 'system-ui, -apple-system, sans-serif',
            minHeight: '620px',
            maxHeight: '620px',
            overflowY: 'auto'
          }}>
            {/* Header section */}
            <div style={{ textAlign: resumeData.template === 'creative' ? 'left' : 'center', marginBottom: '20px' }}>
              <h1 style={{
                margin: 0,
                fontSize: '22px',
                fontWeight: '700',
                color: colors.primary,
                letterSpacing: '-0.02em',
                fontFamily: (resumeData.template === 'academic' || resumeData.template === 'executive') ? 'Georgia, Times New Roman, serif' : 'system-ui, -apple-system, sans-serif'
              }}>
                {resumeData.personal_info.name || 'Your Full Name'}
              </h1>
              {resumeData.personal_info.title && (
                <div style={{ fontWeight: '500', color: '#64748b', fontSize: '13px', marginTop: '2px' }}>{resumeData.personal_info.title}</div>
              )}
              <div style={{ color: '#64748b', fontSize: '10px', marginTop: '6px', display: 'flex', flexWrap: 'wrap', justifyContent: resumeData.template === 'creative' ? 'flex-start' : 'center', gap: '8px' }}>
                {resumeData.personal_info.email && <span>{resumeData.personal_info.email}</span>}
                {resumeData.personal_info.phone && <span>• {resumeData.personal_info.phone}</span>}
                {resumeData.personal_info.location && <span>• {resumeData.personal_info.location}</span>}
                {resumeData.personal_info.website && <span>• {resumeData.personal_info.website}</span>}
              </div>
            </div>

            {/* Resume Summary */}
            {resumeData.summary && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  fontWeight: 'bold',
                  fontSize: '12px',
                  color: colors.accent,
                  borderBottom: `1px solid ${colors.border}`,
                  paddingBottom: '3px',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>{resumeData.template === 'executive' ? 'Executive Summary' : 'Professional Summary'}</div>
                <p style={{ margin: 0, color: '#334155', textAlign: 'justify' }}>{resumeData.summary}</p>
              </div>
            )}

            {/* Experience section */}
            {resumeData.experience && resumeData.experience.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  fontWeight: 'bold',
                  fontSize: '12px',
                  color: colors.accent,
                  borderBottom: `1px solid ${colors.border}`,
                  paddingBottom: '3px',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>{resumeData.template === 'executive' ? 'Chronology of Experience' : 'Work Experience'}</div>
                {resumeData.experience.map((exp, i) => (
                  <div key={i} style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                      <span>{exp.role || 'Job Role'}</span>
                      <span style={{ color: '#64748b' }}>{exp.startDate || 'Start'} – {exp.endDate || 'End'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', italic: true, color: '#475569', fontSize: '10.5px' }}>
                      <span>{exp.company || 'Company'}</span>
                      <span>{exp.location}</span>
                    </div>
                    {exp.description && (
                      <ul style={{ margin: '4px 0 0 16px', padding: 0, color: '#334155' }}>
                        {exp.description.split('\n').map((b, idx) => {
                          const cleaned = b.replace(/^[-*•]\s*/, '').trim();
                          return cleaned ? <li key={idx} style={{ marginBottom: '2px' }}>{cleaned}</li> : null;
                        })}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Education section */}
            {resumeData.education && resumeData.education.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  fontWeight: 'bold',
                  fontSize: '12px',
                  color: colors.accent,
                  borderBottom: `1px solid ${colors.border}`,
                  paddingBottom: '3px',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>{resumeData.template === 'executive' ? 'Academic Foundations' : 'Education'}</div>
                {resumeData.education.map((edu, i) => (
                  <div key={i} style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                      <span>{edu.institution || 'College'}</span>
                      <span style={{ color: '#64748b' }}>{edu.startDate} – {edu.endDate}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                      <span>{edu.degree || 'Degree'} {edu.major && `in ${edu.major}`}</span>
                      {edu.gpa && <span>GPA: {edu.gpa}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Skills section */}
            {resumeData.skills && resumeData.skills.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  fontWeight: 'bold',
                  fontSize: '12px',
                  color: colors.accent,
                  borderBottom: `1px solid ${colors.border}`,
                  paddingBottom: '3px',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>{resumeData.template === 'executive' ? 'Technical Core Skills' : 'Skills'}</div>
                {resumeData.skills.map((sk, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '3px' }}>
                    <span style={{ fontWeight: 'bold', width: '120px', display: 'inline-block' }}>{sk.category || 'Category'}:</span>
                    <span style={{ color: '#334155' }}>{sk.list}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Projects section */}
            {resumeData.projects && resumeData.projects.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  fontWeight: 'bold',
                  fontSize: '12px',
                  color: colors.accent,
                  borderBottom: `1px solid ${colors.border}`,
                  paddingBottom: '3px',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>{resumeData.template === 'executive' ? 'Selected Lecture Projects' : 'Projects'}</div>
                {resumeData.projects.map((proj, i) => (
                  <div key={i} style={{ marginBottom: '8px' }}>
                    <div style={{ fontWeight: 'bold' }}>
                      {proj.title || 'Project Title'} {proj.role && <span style={{ fontWeight: 'normal', color: '#64748b', fontStyle: 'italic' }}>({proj.role})</span>}
                    </div>
                    {proj.link && <div style={{ fontSize: '9.5px', color: '#3b82f6', textDecoration: 'underline', marginBottom: '2px' }}>{proj.link}</div>}
                    <p style={{ margin: 0, color: '#334155' }}>{proj.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Certifications section */}
            {resumeData.certifications && resumeData.certifications.length > 0 && (
              <div>
                <div style={{
                  fontWeight: 'bold',
                  fontSize: '12px',
                  color: colors.accent,
                  borderBottom: `1px solid ${colors.border}`,
                  paddingBottom: '3px',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>Certifications</div>
                <ul style={{ margin: '4px 0 0 16px', padding: 0, color: '#334155' }}>
                  {resumeData.certifications.map((cert, i) => (
                     <li key={i} style={{ marginBottom: '2px' }}>
                       {cert.name} {cert.issuer && `– ${cert.issuer}`} {cert.date && `(${cert.date})`}
                     </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dynamically Tailoring Modal */}
      {showTailorModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="glass-card" style={{ maxWidth: '560px', width: '90%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ color: 'var(--text-primary)' }}>🎯 Dynamic JD-Tailored Resume</h3>
              <button onClick={() => setShowTailorModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.4rem' }}>&times;</button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Our Agentic Optimizer reads your saved Master Profile and aligns bullet points, projects, and summaries directly to your target job description. This creates a highly optimized customized resume.
            </p>
            <form onSubmit={handleTriggerTailor}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Target Job Description</label>
                <textarea
                  className="form-control"
                  rows="6"
                  required
                  value={tailoringJd}
                  onChange={(e) => setTailoringJd(e.target.value)}
                  placeholder="Paste the target job description here..."
                  style={{ background: 'var(--bg-input)', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ flexGrow: 1, padding: '10px' }} disabled={tailoring}>
                  {tailoring ? 'Orchestrating Tailoring Agent...' : 'Optimize Resume'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTailorModal(false)} style={{ padding: '10px' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function InterviewPrepPanel() {
  const [targetRole, setTargetRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  
  const [activeSession, setActiveSession] = useState(false);
  const [report, setReport] = useState(null);

  // Voice mode state
  const [voiceMode, setVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const chatContainerRef = useRef(null);

  const fetchHistory = async () => {
    try {
      const data = await api.aiFeatures.getInterviewHistory();
      setHistory(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Cleanup recording timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  const playAudioFromBase64 = (base64Audio) => {
    try {
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      setIsPlayingAudio(true);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => setIsPlayingAudio(false);
      audio.play().catch(() => setIsPlayingAudio(false));
    } catch (err) {
      console.error('Audio playback error:', err);
      setIsPlayingAudio(false);
    }
  };

  const handleStart = async (e) => {
    e.preventDefault();
    if (!targetRole.trim()) return;
    setError('');
    setReport(null);
    try {
      setLoading(true);
      const data = await api.aiFeatures.startInterview(targetRole, jobDescription, numQuestions, voiceMode);
      setSessionId(data.session_id);
      setMessages([
        { role: 'interviewer', content: data.first_question }
      ]);
      setActiveSession(true);

      // Play the first question audio if voice mode and audio is returned
      if (voiceMode && data.audio_content) {
        playAudioFromBase64(data.audio_content);
      }
    } catch (err) {
      setError(err.message || 'Failed to start interview. Check API settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || loading) return;
    setError('');
    const input = userInput.trim();
    setUserInput('');
    
    // Optimistic local add
    setMessages(prev => [...prev, { role: 'candidate', content: input }]);
    
    try {
      setLoading(true);
      const result = await api.aiFeatures.respondInterview(sessionId, input, voiceMode);
      if (result.is_complete) {
        setReport(result.feedback);
        setActiveSession(false);
        setSessionId(null);
        fetchHistory();
      } else {
        setMessages(prev => [...prev, { role: 'interviewer', content: result.next_question }]);
        // Play audio if voice mode
        if (voiceMode && result.audio_content) {
          playAudioFromBase64(result.audio_content);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to submit response.');
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];

        if (audioBlob.size < 100) {
          setError('Recording was too short. Please try again.');
          return;
        }

        // Add a placeholder message while processing
        setMessages(prev => [...prev, { role: 'candidate', content: '🎙️ Processing voice response...' }]);
        setError('');

        try {
          setLoading(true);
          const result = await api.aiFeatures.respondInterviewAudio(sessionId, audioBlob, voiceMode);

          // Replace the placeholder with the actual transcribed text
          setMessages(prev => {
            const updated = [...prev];
            const lastCandidateIdx = updated.length - 1;
            if (updated[lastCandidateIdx]?.role === 'candidate') {
              updated[lastCandidateIdx] = { role: 'candidate', content: result.user_response || '(transcribed audio)' };
            }
            return updated;
          });

          if (result.is_complete) {
            setReport(result.feedback);
            setActiveSession(false);
            setSessionId(null);
            fetchHistory();
          } else {
            setMessages(prev => [...prev, { role: 'interviewer', content: result.next_question }]);
            // Play the interviewer's response audio
            if (result.audio_content) {
              playAudioFromBase64(result.audio_content);
            }
          }
        } catch (err) {
          // Remove the placeholder on error
          setMessages(prev => prev.filter(m => m.content !== '🎙️ Processing voice response...'));
          setError(err.message || 'Failed to process audio response.');
        } finally {
          setLoading(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access error:', err);
      setError('Could not access your microphone. Please check browser permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      // Remove the ondataavailable / onstop handlers before stopping
      mediaRecorderRef.current.onstop = () => {
        // Just release the mic
        mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.stop();
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setRecordingDuration(0);
  };

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getRoundNumber = () => {
    return messages.filter(m => m.role === 'interviewer').length;
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '28px' }}>
      
      {/* Session config or Chat box */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '560px' }}>
        {!activeSession ? (
          <div style={{ margin: 'auto 0', padding: '20px 0' }}>
            <h3 style={{ marginBottom: '16px' }}>Start Mock Interview Practice</h3>
            <form onSubmit={handleStart}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Target Job Role</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Python Backend Developer"
                  style={{ background: 'var(--bg-input)' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Target Job Description (Optional)</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste details to customize interview questions..."
                  style={{ background: 'var(--bg-input)', resize: 'vertical' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label" style={{ display: 'flex', justifyContext: 'space-between' }}>
                  <span>Number of Interview Questions</span>
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>{numQuestions} Rounds</span>
                </label>
                <input
                  type="range"
                  min="3"
                  max="10"
                  step="1"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-indigo)' }}
                />
              </div>

              {/* Voice Mode Toggle */}
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    padding: '12px 16px',
                    background: voiceMode ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${voiceMode ? 'var(--accent-indigo)' : 'var(--border-color)'}`,
                    borderRadius: '10px',
                    transition: 'var(--transition-smooth)',
                    userSelect: 'none'
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '24px',
                      borderRadius: '12px',
                      background: voiceMode ? 'var(--accent-indigo)' : 'rgba(255,255,255,0.1)',
                      position: 'relative',
                      transition: 'background 0.25s ease',
                      flexShrink: 0
                    }}
                    onClick={(e) => { e.preventDefault(); setVoiceMode(!voiceMode); }}
                  >
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: '#fff',
                        position: 'absolute',
                        top: '3px',
                        left: voiceMode ? '23px' : '3px',
                        transition: 'left 0.25s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                      }}
                    />
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                      🎙️ Voice Mode {voiceMode ? 'ON' : 'OFF'}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                      {voiceMode
                        ? 'Speak your answers into the mic. AI interviewer will speak back.'
                        : 'Enable to use microphone for voice responses with AI speech playback.'}
                    </div>
                  </div>
                </label>
              </div>

              {error && <div className="alert-banner error" style={{ marginBottom: '20px' }}>{error}</div>}

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
                {loading ? 'Starting Recruiter Agent...' : 'Launch Simulation'}
              </button>
            </form>
          </div>
        ) : (
          /* Interview chat window */
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {targetRole} Interview
                  {voiceMode && (
                    <span style={{
                      background: 'var(--accent-indigo)',
                      color: '#fff',
                      fontSize: '0.6rem',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontWeight: '600',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase'
                    }}>🎙️ Voice</span>
                  )}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                  Question Round: {getRoundNumber()} / {numQuestions}
                </div>
              </div>
              <button className="btn btn-secondary" onClick={() => { setActiveSession(false); setSessionId(null); cancelRecording(); }} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                Abort Session
              </button>
            </div>

            {/* Chat message bubbles */}
            <div ref={chatContainerRef} style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '6px', marginBottom: '16px' }}>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: msg.role === 'interviewer' ? 'flex-start' : 'flex-end',
                    maxWidth: '85%',
                    background: msg.role === 'interviewer' ? 'rgba(255,255,255,0.03)' : 'rgba(99,102,241,0.1)',
                    border: '1px solid var(--border-color)',
                    padding: '12px 16px',
                    borderRadius: msg.role === 'interviewer' ? '12px 12px 12px 2px' : '12px 12px 2px 12px',
                    fontSize: '0.9rem',
                    lineHeight: '1.4'
                  }}
                >
                  <div style={{ fontWeight: 'bold', fontSize: '0.7rem', color: msg.role === 'interviewer' ? 'var(--accent-indigo)' : 'var(--accent-cyan)', marginBottom: '4px', textTransform: 'uppercase' }}>
                    {msg.role === 'interviewer' ? 'AI Interviewer' : 'You (Candidate)'}
                  </div>
                  <div style={{ whiteSpace: 'pre-line' }}>{msg.content}</div>
                </div>
              ))}
              {isPlayingAudio && (
                <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-indigo)', fontSize: '0.8rem', paddingLeft: '4px' }}>
                  <span style={{ display: 'inline-block', animation: 'pulse 1.2s infinite' }}>🔊</span>
                  AI Interviewer is speaking...
                </div>
              )}
              {loading && (
                <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: '0.8rem', paddingLeft: '4px', fontStyle: 'italic' }}>
                  Interviewer is listening / thinking...
                </div>
              )}
              {error && <div className="alert-banner error">{error}</div>}
            </div>

            {/* Input area — text or voice */}
            {voiceMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Voice recording controls */}
                {!isRecording ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={startRecording}
                      disabled={loading || isPlayingAudio}
                      style={{
                        flexGrow: 1,
                        padding: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        fontSize: '0.95rem'
                      }}
                    >
                      <span style={{ fontSize: '1.3rem' }}>🎤</span>
                      {loading ? 'Processing...' : isPlayingAudio ? 'Listening to AI...' : 'Hold to Record Response'}
                    </button>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '12px'
                  }}>
                    {/* Pulsing red dot */}
                    <div style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      background: '#ef4444',
                      animation: 'pulse 1s infinite',
                      flexShrink: 0
                    }} />
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '0.85rem', color: '#ef4444' }}>
                        Recording... {formatDuration(recordingDuration)}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '2px' }}>
                        Click Stop when finished speaking
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={stopRecording}
                      style={{ padding: '8px 20px', background: '#ef4444', borderColor: '#ef4444' }}
                    >
                      ⏹️ Stop
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={cancelRecording}
                      style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
                {/* Still allow text fallback even in voice mode */}
                <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-control"
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    placeholder="Or type your response here..."
                    disabled={loading || isRecording}
                    style={{ background: 'var(--bg-input)', flexGrow: 1, fontSize: '0.85rem' }}
                  />
                  <button type="submit" className="btn btn-secondary" style={{ padding: '0 16px', fontSize: '0.8rem' }} disabled={loading || isRecording}>
                    Send
                  </button>
                </form>
              </div>
            ) : (
              /* Text-only input */
              <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-control"
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  placeholder="Type your response..."
                  disabled={loading}
                  style={{ background: 'var(--bg-input)', flexGrow: 1 }}
                  required
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0 20px' }} disabled={loading}>
                  Send
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Reports and previous logs */}
      <div className="glass-card" style={{ height: '560px', overflowY: 'auto' }}>
        {report ? (
          /* Grading results report card */
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Session Placement Grade</h3>
            
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <div style={{ flexGrow: 1, background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recommendation</div>
                <div style={{
                  fontSize: '1.6rem',
                  fontWeight: 'bold',
                  marginTop: '4px',
                  color: report.rating.includes('Strong') || report.rating === 'Hire' ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                }}>{report.rating}</div>
              </div>
              <div style={{ width: '100px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Score</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 'bold', marginTop: '4px', color: 'var(--accent-cyan)' }}>{report.score}/100</div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>Overall Performance</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{report.overall_summary}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <div style={{ color: 'var(--accent-emerald)', fontWeight: '600', fontSize: '0.85rem', marginBottom: '6px' }}>Strengths</div>
                <ul>
                  {report.strengths.map((st, idx) => <li key={idx} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{st}</li>)}
                </ul>
              </div>
              <div>
                <div style={{ color: 'var(--accent-rose)', fontWeight: '600', fontSize: '0.85rem', marginBottom: '6px' }}>Areas to Improve</div>
                <ul>
                  {report.weaknesses.map((wk, idx) => <li key={idx} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{wk}</li>)}
                </ul>
              </div>
            </div>

            {/* Answer critique breakdown */}
            {report.question_breakdowns && report.question_breakdowns.length > 0 && (
              <div>
                <h4 style={{ marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>Detailed Question Breakdown</h4>
                {report.question_breakdowns.map((q, idx) => (
                  <div key={idx} style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Q: {q.question}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px', fontStyle: 'italic' }}>Your Answer: "{q.answer}"</div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '8px', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent-indigo)' }}>
                      <span>Score: {q.score}/100</span>
                      <span>•</span>
                      <span>Critique:</span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>{q.critique}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Logs history view */
          <div>
            <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Previous Mock Logs</h3>
            {history.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No completed practice sessions logged yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {history.map((sess) => (
                  <div
                    key={sess.session_id}
                    onClick={() => setReport(sess.feedback)}
                    style={{
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '14px',
                      cursor: 'pointer',
                      transition: 'var(--transition-smooth)'
                    }}
                    className="history-log-item"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.9rem' }}>
                      <span>{sess.target_role}</span>
                      <span style={{ color: sess.feedback?.score >= 70 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                        {sess.feedback?.score}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      <span>Status: {sess.is_complete ? 'Completed' : 'Interrupted'}</span>
                      <span>{new Date(sess.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}

function CoachChatPanel() {
  const [messages, setMessages] = useState([
    { role: 'coach', content: "Hello! I am your AI Career Coach. Ask me anything about selecting batch courses, studying course notes, borrowing library books, or drafting resumes!" }
  ]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || loading) return;
    setError('');
    const input = userInput.trim();
    setUserInput('');

    // Update history locally
    const updatedMsgs = [...messages, { role: 'user', content: input }];
    setMessages(updatedMsgs);

    try {
      setLoading(true);
      // Format chat history for backend (user/assistant role mapping)
      const apiHistory = updatedMsgs.slice(1, -1).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }));

      const data = await api.aiFeatures.chatWithCoach(input, apiHistory);
      
      setMessages(prev => [
        ...prev,
        {
          role: 'coach',
          content: data.response,
          rag: data.rag_context
        }
      ]);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Chatbot encountered an error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', height: '580px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
        <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>🤖</span>
          <span>AI Career Coach & RAG Assistant</span>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
          Connects you directly to Academy course packages, study guides, and books.
        </div>
      </div>

      {/* Messages layout */}
      <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '8px', marginBottom: '16px' }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === 'coach' ? 'flex-start' : 'flex-end',
              maxWidth: '80%',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div
              style={{
                background: msg.role === 'coach' ? 'rgba(255,255,255,0.03)' : 'rgba(99,102,241,0.1)',
                border: '1px solid var(--border-color)',
                padding: '12px 16px',
                borderRadius: msg.role === 'coach' ? '12px 12px 12px 2px' : '12px 12px 2px 12px',
                fontSize: '0.9rem',
                lineHeight: '1.4'
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '0.75rem', color: msg.role === 'coach' ? 'var(--accent-indigo)' : 'var(--accent-cyan)', marginBottom: '4px', textTransform: 'uppercase' }}>
                {msg.role === 'coach' ? 'Career Coach' : 'You'}
              </div>
              <div style={{ whiteSpace: 'pre-line' }}>{msg.content}</div>
            </div>

            {/* Matched RAG references attached to assistant replies */}
            {msg.rag && msg.rag.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
                {msg.rag.map((rec, rIdx) => (
                  <div
                    key={rIdx}
                    style={{
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid var(--border-color)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span style={{
                      fontWeight: 'bold',
                      fontSize: '0.55rem',
                      textTransform: 'uppercase',
                      padding: '1px 4px',
                      borderRadius: '2px',
                      background: rec.type === 'batch' ? 'rgba(99, 102, 241, 0.15)' : rec.type === 'note' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: rec.type === 'batch' ? 'var(--accent-indigo)' : rec.type === 'note' ? 'var(--accent-cyan)' : 'var(--accent-amber)'
                    }}>{rec.type}</span>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>{rec.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
            Coach is compiling resources...
          </div>
        )}
        {error && <div className="alert-banner error">{error}</div>}
      </div>

      {/* Footer input form */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          className="form-control"
          value={userInput}
          onChange={e => setUserInput(e.target.value)}
          placeholder="Ask advice (e.g. 'suggest react courses or library books')..."
          disabled={loading}
          style={{ background: 'var(--bg-input)', flexGrow: 1 }}
          required
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '0 24px' }} disabled={loading}>
          Send
        </button>
      </form>
    </div>
  );
}

function StudentTestsPanel() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTest, setActiveTest] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [gradedResult, setGradedResult] = useState(null);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const data = await api.aiFeatures.listTests();
      setTests(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch weekly tests list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleStartTest = (test) => {
    setActiveTest(test);
    setSelectedAnswers({});
    setGradedResult(null);
    setError('');
  };

  const handleOptionSelect = (qIdx, optIdx) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [qIdx]: optIdx
    }));
  };

  const handleSubmitTest = async () => {
    const totalQ = activeTest.questions.length;
    const answeredCount = Object.keys(selectedAnswers).length;
    if (answeredCount < totalQ) {
      setError(`Please answer all ${totalQ} questions before submitting.`);
      return;
    }

    setError('');
    try {
      setSubmitting(true);
      const result = await api.aiFeatures.submitTestAnswers(activeTest.id, selectedAnswers);
      setGradedResult(result);
    } catch (err) {
      setError(err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p style={{ color: 'var(--text-secondary)' }}>Loading Weekly Tests...</p>;
  }

  if (activeTest) {
    if (gradedResult) {
      return (
        <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 className="title-gradient">{activeTest.title} - Graded Score Card</h3>
            <button className="btn btn-secondary" onClick={() => { setActiveTest(null); setGradedResult(null); fetchTests(); }}>
              Back to Tests
            </button>
          </div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '32px' }}>
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              background: `conic-gradient(${gradedResult.score >= (gradedResult.max_score * 0.7) ? 'var(--accent-emerald)' : 'var(--accent-rose)'} ${ (gradedResult.score / gradedResult.max_score) * 360 }deg, rgba(255,255,255,0.05) 0deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--glow-shadow)',
              fontWeight: 'bold',
              fontSize: '1.4rem'
            }}>
              {gradedResult.score} / {gradedResult.max_score}
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Weekly Test Result</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                You got {gradedResult.correct_count} correct and {gradedResult.wrong_count} incorrect answers.
              </div>
            </div>
          </div>

          <h4 style={{ marginBottom: '16px' }}>Question Breakdowns & AI Explanations</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {gradedResult.results.map((q, idx) => {
              return (
                <div key={idx} style={{
                  border: `1px solid ${q.is_correct ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'}`,
                  background: q.is_correct ? 'rgba(16, 185, 129, 0.02)' : 'rgba(244, 63, 94, 0.02)',
                  borderRadius: '12px',
                  padding: '20px'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '12px', fontSize: '0.95rem' }}>
                    Q{idx+1}: {q.question_text}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {q.options.map((opt, optIdx) => {
                      const isSelected = q.chosen_option === optIdx;
                      const isCorrect = q.correct_option === optIdx;
                      
                      let border = '1px solid var(--border-color)';
                      let bg = 'rgba(255,255,255,0.01)';
                      let color = 'var(--text-secondary)';

                      if (isCorrect) {
                        border = '1px solid var(--accent-emerald)';
                        bg = 'rgba(16, 185, 129, 0.1)';
                        color = 'var(--accent-emerald)';
                      } else if (isSelected) {
                        border = '1px solid var(--accent-rose)';
                        bg = 'rgba(244, 63, 94, 0.1)';
                        color = 'var(--accent-rose)';
                      }

                      return (
                        <div key={optIdx} style={{
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border,
                          background: bg,
                          color,
                          fontSize: '0.85rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span>{opt}</span>
                          {isCorrect && <span style={{ fontWeight: 'bold' }}>✓ Correct Option</span>}
                          {isSelected && !isCorrect && <span style={{ fontWeight: 'bold' }}>✗ Your Choice</span>}
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    <span style={{ fontWeight: '600', color: 'var(--accent-indigo)', display: 'block', marginBottom: '4px' }}>💡 Answer Explanation</span>
                    {q.explanation}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 className="title-gradient">{activeTest.title}</h3>
          <button className="btn btn-secondary" onClick={() => setActiveTest(null)}>
            Quit Test
          </button>
        </div>

        <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', fontSize: '0.9rem' }}>
          Topic: <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{activeTest.topic}</span> • Marks per question: <span style={{ color: 'var(--accent-cyan)' }}>{activeTest.marks_per_question}</span>
        </p>

        {error && <div className="alert-banner error" style={{ marginBottom: '20px' }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {activeTest.questions.map((q, qIdx) => {
            const selectedOpt = selectedAnswers[q.question_index];
            return (
              <div key={q.question_index} className="glass-card" style={{ padding: '20px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '14px' }}>
                  {qIdx + 1}. {q.question_text}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {q.options.map((opt, optIdx) => (
                    <button
                      key={optIdx}
                      onClick={() => handleOptionSelect(q.question_index, optIdx)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: selectedOpt === optIdx ? '1px solid var(--accent-indigo)' : '1px solid var(--border-color)',
                        background: selectedOpt === optIdx ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.01)',
                        color: selectedOpt === optIdx ? 'var(--accent-indigo)' : 'var(--text-secondary)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        transition: 'var(--transition-smooth)',
                        fontWeight: selectedOpt === optIdx ? '600' : '400'
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <button
          className="btn btn-primary"
          style={{ width: '100%', padding: '14px', marginTop: '32px' }}
          onClick={handleSubmitTest}
          disabled={submitting}
        >
          {submitting ? 'Submitting Answers & Grading...' : 'Submit Answers'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s' }}>
      <h2 style={{ marginBottom: '8px' }} className="title-gradient">Weekly Academy Tests</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Assess your placement readiness. Take interactive weekly exams generated automatically on top of study materials.
      </p>

      {tests.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <span style={{ fontSize: '2rem' }}>📝</span>
          <p style={{ marginTop: '10px' }}>No weekly tests have been published for your class yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {tests.map((test) => (
            <div key={test.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '180px' }}>
              <div>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '6px' }}>{test.title}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', height: '3.2em', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {test.topic}
                </p>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '6px' }}>
                  Questions: {test.num_questions} • Marks per Q: {test.marks_per_question}
                </div>
              </div>
              <button className="btn btn-primary" onClick={() => handleStartTest(test)} style={{ width: '100%', fontSize: '0.8rem', padding: '8px' }}>
                Start Test
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TrainerTestPanel({ user }) {
  const [activeSubTab, setActiveSubTab] = useState('create');
  const [tests, setTests] = useState([]);
  const [selectedTestId, setSelectedTestId] = useState('');
  const [resultsLedger, setResultsLedger] = useState(null);
  
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [marksPerQuestion, setMarksPerQuestion] = useState(2);
  const [studyFile, setStudyFile] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchTests = async () => {
    try {
      const data = await api.aiFeatures.listTests();
      setTests(data);
      if (data.length > 0 && !selectedTestId) {
        setSelectedTestId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setStudyFile(e.target.files[0]);
    }
  };

  const handleCreateTest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.aiFeatures.createTest(title, topic, numQuestions, marksPerQuestion, studyFile);
      setSuccess(`Weekly test '${title}' successfully compiled and published!`);
      setTitle('');
      setTopic('');
      setNumQuestions(5);
      setMarksPerQuestion(2);
      setStudyFile(null);
      fetchTests();
    } catch (err) {
      setError(err.message || 'Generation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchLedger = async (testId) => {
    setSelectedTestId(testId);
    setLedgerLoading(true);
    try {
      const ledger = await api.aiFeatures.getTestResults(testId);
      setResultsLedger(ledger);
    } catch (err) {
      console.error(err);
    } finally {
      setLedgerLoading(false);
    }
  };

  const getStats = () => {
    if (!resultsLedger || resultsLedger.submissions.length === 0) return { avg: 0, max: 0, count: 0 };
    const subs = resultsLedger.submissions;
    const scores = subs.map(s => s.score);
    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = sum / subs.length;
    const max = Math.max(...scores);
    return {
      avg: avg.toFixed(1),
      max,
      count: subs.length
    };
  };

  const stats = getStats();

  return (
    <div style={{ animation: 'fadeIn 0.4s' }}>
      <h2 style={{ marginBottom: '6px' }} className="title-gradient">Class Test Dashboard</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Generate interactive exams based on files or topics, and check student scores and performance metrics.
      </p>

      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '28px' }}>
        <button
          onClick={() => setActiveSubTab('create')}
          className={`btn ${activeSubTab === 'create' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.85rem' }}
        >
          ➕ Create Weekly Test
        </button>
        <button
          onClick={() => {
            setActiveSubTab('results');
            if (selectedTestId) handleFetchLedger(selectedTestId);
          }}
          className={`btn ${activeSubTab === 'results' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.85rem' }}
        >
          📊 Student Results Ledger
        </button>
      </div>

      {activeSubTab === 'create' && (
        <div className="glass-card" style={{ maxWidth: '640px', margin: '0 auto', padding: '32px' }}>
          <h3 style={{ marginBottom: '16px' }}>Publish Test Questions</h3>
          
          {error && <div className="alert-banner error" style={{ marginBottom: '20px' }}>{error}</div>}
          {success && <div className="alert-banner success" style={{ marginBottom: '20px' }}>{success}</div>}

          <form onSubmit={handleCreateTest}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Test Title</label>
              <input
                type="text"
                className="form-control"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Weekly Test 4: Docker Container Basics"
                style={{ background: 'var(--bg-input)' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Test Subject Topic</label>
              <textarea
                className="form-control"
                rows="3"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Type topics to focus on, e.g. Dockerfiles, multi-stage builds, port mappings..."
                style={{ background: 'var(--bg-input)', resize: 'vertical' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Upload Study Material Guide PDF (Optional RAG Context)</label>
              <input
                type="file"
                className="form-control"
                accept=".pdf"
                onChange={handleFileChange}
                style={{ background: 'var(--bg-input)' }}
              />
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>
                If uploaded, the AI agent compiles questions directly from content in the document.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div className="form-group">
                <label className="form-label">No. of Questions</label>
                <input
                  type="number"
                  min="2"
                  max="20"
                  className="form-control"
                  required
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                  style={{ background: 'var(--bg-input)' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Marks Per Question</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  required
                  value={marksPerQuestion}
                  onChange={(e) => setMarksPerQuestion(parseInt(e.target.value))}
                  style={{ background: 'var(--bg-input)' }}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
              {loading ? 'Synthesizing MCQ Questions (RAG)...' : 'Publish Weekly Test'}
            </button>
          </form>
        </div>
      )}

      {activeSubTab === 'results' && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '28px' }}>
          <div className="glass-card" style={{ height: 'fit-content' }}>
            <h4 style={{ marginBottom: '16px' }}>Select Test</h4>
            {tests.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No published tests.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {tests.map((test) => (
                  <button
                    key={test.id}
                    onClick={() => handleFetchLedger(test.id)}
                    className={`btn ${selectedTestId === test.id ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      fontSize: '0.8rem',
                      padding: '10px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'block'
                    }}
                  >
                    {test.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card">
            {ledgerLoading ? (
              <p style={{ color: 'var(--text-secondary)' }}>Loading student score reports...</p>
            ) : resultsLedger ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3>Ledger: {resultsLedger.title}</h3>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.8rem', textAlign: 'center' }}>
                      <div style={{ color: 'var(--text-muted)' }}>Average Score</div>
                      <div style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--accent-cyan)' }}>{stats.avg}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.8rem', textAlign: 'center' }}>
                      <div style={{ color: 'var(--text-muted)' }}>Highest Score</div>
                      <div style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--accent-emerald)' }}>{stats.max}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.8rem', textAlign: 'center' }}>
                      <div style={{ color: 'var(--text-muted)' }}>Submissions</div>
                      <div style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--text-primary)' }}>{stats.count}</div>
                    </div>
                  </div>
                </div>

                {resultsLedger.submissions.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>No student has submitted answers for this test yet.</p>
                ) : (
                  <div className="table-wrapper">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Student Name</th>
                          <th>Student Email</th>
                          <th>Submitted Time</th>
                          <th style={{ textAlign: 'right' }}>Score Obtained</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultsLedger.submissions.map((sub) => (
                          <tr key={sub.id}>
                            <td style={{ fontWeight: '600' }}>{sub.student_name}</td>
                            <td>{sub.student_email}</td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(sub.graded_at).toLocaleString()}</td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>
                              {sub.score} / {sub.max_score}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '60px' }}>Select a weekly test from the sidebar to inspect grading ledger reports.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================================================
// Digital Library Panel Component
// ==========================================================================
function DigitalLibraryPanel({ user }) {
  const [books, setBooks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  
  // Navigation & Filtering
  const [activeSubTab, setActiveSubTab] = React.useState('books'); // 'books' | 'audiobooks'
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  
  // Modal / Upload state
  const [showUploadModal, setShowUploadModal] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadForm, setUploadForm] = React.useState({
    title: '',
    author: '',
    category: 'Programming',
    description: ''
  });
  const [uploadFile, setUploadFile] = React.useState(null);

  // Reader / Play state
  const [selectedBook, setSelectedBook] = React.useState(null); // Detailed book metadata + extracted_text
  const [readerTheme, setReaderTheme] = React.useState('dark'); // 'light' | 'dark' | 'sepia'
  const [readerFontSize, setReaderFontSize] = React.useState(16); // px

  // Speech (Audiobook) engine state
  const [voices, setVoices] = React.useState([]);
  const [selectedVoice, setSelectedVoice] = React.useState('');
  const [rate, setRate] = React.useState(1.0);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentParagraphIndex, setCurrentParagraphIndex] = React.useState(0);
  const [paragraphs, setParagraphs] = React.useState([]);
  const [skipFrontMatter, setSkipFrontMatter] = React.useState(true);
  const [autoAdvance, setAutoAdvance] = React.useState(true);
  const [playbackMessage, setPlaybackMessage] = React.useState('Ready to begin narration');

  // Helper to categorize text and filter out PDF artifacts (running headers, page numbers, copyright/TOC)
  const processBookParagraphs = (extractedText, title, author) => {
    if (!extractedText) return [];
    
    const rawParas = extractedText
      .split('\n\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);
      
    const processed = [];
    const normTitle = title ? title.toLowerCase() : '';
    const normAuthor = author ? author.toLowerCase() : '';
    
    rawParas.forEach((p, idx) => {
      let isMetadata = false;
      let metadataType = null;
      const lowerP = p.toLowerCase();
      
      // Heuristic 1: Copyright & publisher boilerplate
      if (
        lowerP.includes('copyright') ||
        lowerP.includes('©') ||
        lowerP.includes('all rights reserved') ||
        lowerP.includes('isbn') ||
        lowerP.includes('first published') ||
        lowerP.includes('printed in') ||
        lowerP.includes('published by') ||
        lowerP.includes('cataloging-in-publication')
      ) {
        isMetadata = true;
        metadataType = 'Copyright & Publisher Info';
      }
      // Heuristic 2: Table of Contents / Index boilerplate (with trailing page numbers or series of dots)
      else if (
        /(\.\s*){4,}/.test(p) ||
        /^(chapter|chap\.|section)\s+\d+/i.test(p) && (lowerP.includes('page') || /\d+$/.test(lowerP)) ||
        (lowerP.length < 150 && (lowerP.includes('table of contents') || lowerP.includes('contents') || lowerP.includes('index') || lowerP.includes('bibliography')))
      ) {
        isMetadata = true;
        metadataType = 'Table of Contents & Index';
      }
      // Heuristic 3: Running headers/footers & isolated page numbers
      else if (
        /^\d+$/.test(p) ||
        /^(page|pg\.?)\s*\d+$/i.test(p) ||
        /^\d+\s*\|\s*/.test(p) ||
        (normTitle && lowerP === normTitle) ||
        (normAuthor && lowerP === normAuthor)
      ) {
        isMetadata = true;
        metadataType = 'Page Header / Number';
      }
      // Heuristic 4: Repeating title cover details in the first few paragraphs
      else if (idx < 5 && (
        lowerP.includes(normTitle) || 
        lowerP.includes(normAuthor) ||
        lowerP.length < 60
      )) {
        isMetadata = true;
        metadataType = 'Title & Cover Details';
      }
      
      processed.push({
        text: p,
        isMetadata,
        metadataType,
        isIntro: false
      });
    });
    
    return processed;
  };
  
  // Fetch book list
  const fetchBooks = async () => {
    try {
      setLoading(true);
      const data = await api.digitalLibrary.listBooks();
      setBooks(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch digital books.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchBooks();
    
    // Load speech synthesis voices
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        // Default to first English voice or first voice
        const defaultVoice = availableVoices.find(v => v.lang.toLowerCase().includes('en') || v.lang.startsWith('en')) || availableVoices[0];
        if (defaultVoice) {
          setSelectedVoice(defaultVoice.name);
        }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    // Cleanup synthesis when component unmounts
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // When a book is selected for reading/listening, fetch its full details (including extracted text)
  const handleSelectBook = async (bookId, mode) => {
    try {
      setError('');
      // Cancel any ongoing speech when switching books
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
      }
      
      const detailedBook = await api.digitalLibrary.getBook(bookId);
      setSelectedBook(detailedBook);
      
      if (detailedBook.extracted_text) {
        const processed = processBookParagraphs(detailedBook.extracted_text, detailedBook.title, detailedBook.author);
        
        // Add premium virtual audiobook intro
        const introPara = {
          text: `This is the audiobook edition of "${detailedBook.title}" by ${detailedBook.author}. Let's begin the narration.`,
          isIntro: true,
          isMetadata: false,
          metadataType: null
        };
        
        setParagraphs([introPara, ...processed]);
      } else {
        setParagraphs([{
          text: '(No readable text found or extracted from this PDF book)',
          isIntro: false,
          isMetadata: false,
          metadataType: null
        }]);
      }
      
      setCurrentParagraphIndex(0);
      setPlaybackMessage(`Prepared ${detailedBook.title} for narration`);
      
      if (mode === 'listen') {
        setActiveSubTab('audiobooks');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch book content.');
    }
  };

  // Text-To-Speech Narration Logic
  const speakParagraph = (index) => {
    if (!('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();
    
    if (index < 0 || index >= paragraphs.length) {
      setIsPlaying(false);
      return;
    }
    
    setCurrentParagraphIndex(index);
    
    const paragraph = paragraphs[index];
    const textToSpeak = paragraph.text || paragraph;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    if (paragraph?.isIntro) {
      setPlaybackMessage('Opening narration with a warm introduction');
    } else if (paragraph?.isMetadata) {
      setPlaybackMessage('Skipping front matter and moving to the main chapter');
    } else {
      setPlaybackMessage(`Now reading section ${index + 1} of ${paragraphs.length}`);
    }
    
    // Set voice
    const voiceObj = voices.find(v => v.name === selectedVoice);
    if (voiceObj) utterance.voice = voiceObj;
    
    // Set rate
    utterance.rate = rate;
    
    utterance.onend = () => {
      // Auto advance to next paragraph, skipping metadata if enabled
      let nextIndex = index + 1;
      if (skipFrontMatter) {
        while (nextIndex < paragraphs.length && paragraphs[nextIndex].isMetadata) {
          nextIndex++;
        }
      }
      
      if (nextIndex < paragraphs.length) {
        if (autoAdvance) {
          speakParagraph(nextIndex);
        } else {
          setIsPlaying(false);
          setPlaybackMessage('Paused on the current paragraph');
        }
      } else {
        setIsPlaying(false);
        setPlaybackMessage('Narration complete — ready for another chapter');
      }
    };
    
    utterance.onerror = (e) => {
      if (e.error !== 'interrupted') {
        setIsPlaying(false);
        setPlaybackMessage('Narration paused because the browser could not continue');
        console.error('SpeechSynthesis error:', e);
      }
    };
    
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
    
    // Auto-scroll the active paragraph card into view
    setTimeout(() => {
      const el = document.getElementById(`para-${index}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  };

  const handlePlayPause = () => {
    if (!('speechSynthesis' in window)) return;
    
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setPlaybackMessage('Paused on the current paragraph');
    } else {
      speakParagraph(currentParagraphIndex);
    }
  };

  const handleStop = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentParagraphIndex(0);
    setPlaybackMessage('Playback stopped — ready when you are');
  };

  const handlePrevParagraph = () => {
    let prevIndex = currentParagraphIndex - 1;
    if (skipFrontMatter) {
      while (prevIndex >= 0 && paragraphs[prevIndex].isMetadata) {
        prevIndex--;
      }
    }
    if (prevIndex >= 0) {
      setPlaybackMessage('Jumping to the previous section');
      speakParagraph(prevIndex);
    }
  };

  const handleNextParagraph = () => {
    let nextIndex = currentParagraphIndex + 1;
    if (skipFrontMatter) {
      while (nextIndex < paragraphs.length && paragraphs[nextIndex].isMetadata) {
        nextIndex++;
      }
    }
    if (nextIndex < paragraphs.length) {
      setPlaybackMessage('Moving to the next section');
      speakParagraph(nextIndex);
    }
  };

  // Adjust rate and restart speech if playing
  const handleRateChange = (newRate) => {
    setRate(newRate);
    if (isPlaying) {
      // Re-trigger speech with the new rate immediately
      setTimeout(() => {
        speakParagraph(currentParagraphIndex);
      }, 50);
    }
  };

  // Delete Book
  const handleDeleteBook = async (e, bookId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this digital book from the library?')) return;
    
    try {
      setError('');
      setSuccess('');
      await api.digitalLibrary.deleteBook(bookId);
      setSuccess('Book deleted successfully.');
      if (selectedBook && selectedBook.id === bookId) {
        setSelectedBook(null);
        handleStop();
      }
      fetchBooks();
    } catch (err) {
      setError(err.message || 'Failed to delete book.');
    }
  };

  // Handle Book Upload
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setError('Please select a PDF file to upload.');
      return;
    }
    
    setError('');
    setSuccess('');
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('title', uploadForm.title);
      formData.append('author', uploadForm.author);
      formData.append('category', uploadForm.category);
      formData.append('description', uploadForm.description);
      formData.append('file', uploadFile);
      
      await api.digitalLibrary.uploadBook(formData);
      setSuccess('Book uploaded and text extracted successfully!');
      setShowUploadModal(false);
      setUploadForm({ title: '', author: '', category: 'Programming', description: '' });
      setUploadFile(null);
      fetchBooks();
    } catch (err) {
      setError(err.message || 'Failed to upload book.');
    } finally {
      setIsUploading(false);
    }
  };

  // Filter & Search logic
  const filteredBooks = books.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.author.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || b.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Helper for Category Background Gradient
  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Programming': return 'linear-gradient(135deg, #1e40af, #3b82f6)';
      case 'Soft Skills': return 'linear-gradient(135deg, #065f46, #10b981)';
      case 'Finance': return 'linear-gradient(135deg, #92400e, #f59e0b)';
      case 'Career Prep': return 'linear-gradient(135deg, #9d174d, #ec4899)';
      default: return 'linear-gradient(135deg, #5b21b6, #8b5cf6)';
    }
  };

  const categoriesList = ['All', 'Programming', 'Soft Skills', 'Finance', 'Career Prep', 'Other'];

  const canUpload = user.role === 'head' || user.role === 'trainer';
  const playbackPercent = paragraphs.length > 0 ? ((currentParagraphIndex + 1) / paragraphs.length) * 100 : 0;
  const activeParagraph = paragraphs[currentParagraphIndex] || null;

  return (
    <div className="digital-lib-container">
      {/* Alert Notifications */}
      {error && (
        <div className="alert-banner error" style={{ margin: 0 }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>&times;</button>
        </div>
      )}
      {success && (
        <div className="alert-banner success" style={{ margin: 0 }}>
          <span>{success}</span>
          <button onClick={() => setSuccess('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>&times;</button>
        </div>
      )}

      {/* Main Header */}
      <div className="digital-lib-header">
        <div>
          <h1 className="title-gradient" style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
              <path d="M6 6h10M6 10h10"/>
            </svg>
            Digital Resource Center
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Access academic digital books & convert text pages directly into audio narration
          </p>
        </div>

        {canUpload && (
          <button className="btn btn-primary" onClick={() => setShowUploadModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
            Upload Digital Book
          </button>
        )}
      </div>

      {/* Selector and Search Bar */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div className="digital-lib-tabs">
          <button className={`digital-lib-tab-btn ${activeSubTab === 'books' ? 'active' : ''}`} onClick={() => setActiveSubTab('books')}>
            📚 Digital Library
          </button>
          <button className={`digital-lib-tab-btn ${activeSubTab === 'audiobooks' ? 'active' : ''}`} onClick={() => setActiveSubTab('audiobooks')}>
            🎧 Audiobook Narrator
          </button>
        </div>

        <div className="search-filters-bar">
          <input
            type="text"
            className="input-field"
            placeholder="Search title, author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '240px', padding: '8px 12px', margin: 0 }}
          />
        </div>
      </div>

      {/* Category Tags */}
      {activeSubTab === 'books' && (
        <div className="category-tags">
          {categoriesList.map(cat => (
            <button
              key={cat}
              className={`category-tag ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* SUB-TAB 1: DIGITAL LIBRARY (LIST & VIEW) */}
      {activeSubTab === 'books' && (
        <>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div className="loading-spinner" style={{ margin: '0 auto 16px auto', borderTopColor: 'var(--accent-indigo)' }}></div>
              <p style={{ color: 'var(--text-secondary)' }}>Loading catalog resources...</p>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '16px' }}>
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4M12 16h.01"/>
              </svg>
              <h3>No Books Found</h3>
              <p style={{ marginTop: '8px' }}>No digital resources match your filters. Try checking back later.</p>
            </div>
          ) : (
            <div className="books-grid">
              {filteredBooks.map(book => (
                <div key={book.id} className="glass-card book-card" onClick={() => handleSelectBook(book.id, 'read')}>
                  
                  {/* Uploader Delete Controls Overlay */}
                  {canUpload && (
                    <div className="book-actions-overlay">
                      <button className="book-action-btn" title="Delete Resource" onClick={(e) => handleDeleteBook(e, book.id)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Book Cover */}
                  <div className="book-cover-wrapper">
                    {book.cover_url ? (
                      <img src={book.cover_url} className="book-cover-img" alt={book.title} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                    ) : null}
                    
                    {/* Styled Fallback Cover */}
                    <div className="book-cover-custom" style={{ background: getCategoryColor(book.category), display: book.cover_url ? 'none' : 'flex' }}>
                      <div className="cover-header">{book.category}</div>
                      <div className="cover-title">{book.title}</div>
                      <div className="cover-author">By {book.author}</div>
                    </div>
                  </div>

                  {/* Book Meta */}
                  <div className="book-info">
                    <div className="book-title" title={book.title}>{book.title}</div>
                    <div className="book-author">{book.author}</div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                      <span className="book-category-badge">{book.category}</span>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '2px 8px', fontSize: '0.75rem', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={(e) => { e.stopPropagation(); handleSelectBook(book.id, 'listen'); }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                        </svg>
                        Listen
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Inline eBook Reader View */}
          {selectedBook && (
            <div className="glass-card" style={{ marginTop: '30px', padding: '0', overflow: 'hidden' }}>
              <div className="reader-header">
                <div>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="title-gradient">{selectedBook.title}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>by {selectedBook.author}</span>
                  </h3>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {/* Theme Switchers */}
                  <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '6px' }}>
                    <button className={`btn ${readerTheme === 'light' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '4px 8px', fontSize: '0.75rem', margin: 0 }} onClick={() => setReaderTheme('light')}>Light</button>
                    <button className={`btn ${readerTheme === 'dark' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '4px 8px', fontSize: '0.75rem', margin: 0 }} onClick={() => setReaderTheme('dark')}>Dark</button>
                    <button className={`btn ${readerTheme === 'sepia' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '4px 8px', fontSize: '0.75rem', margin: 0 }} onClick={() => setReaderTheme('sepia')}>Sepia</button>
                  </div>
                  
                  {/* Font Size Adjusters */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn btn-secondary" style={{ padding: '4px 10px', margin: 0 }} onClick={() => setReaderFontSize(Math.max(12, readerFontSize - 2))}>A-</button>
                    <button className="btn btn-secondary" style={{ padding: '4px 10px', margin: 0 }} onClick={() => setReaderFontSize(Math.min(24, readerFontSize + 2))}>A+</button>
                  </div>

                  <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', margin: 0 }} onClick={() => handleSelectBook(selectedBook.id, 'listen')}>🎧 Audiobook</button>
                  <button className="btn btn-secondary" style={{ padding: '4px 12px', margin: 0 }} onClick={() => setSelectedBook(null)}>&times; Close</button>
                </div>
              </div>

              <div className="reader-container">
                {/* PDF Original Embed Document */}
                <div className="reader-pdf-view">
                  <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.3)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>PDF Preview Catalog Document</div>
                  <embed 
                    src={selectedBook.file_url} 
                    type="application/pdf" 
                    width="100%" 
                    height="100%" 
                    style={{ border: 'none' }}
                  />
                </div>

                {/* Extracted Text Pane (Categorized & Readable) */}
                <div className={`reader-text-view theme-${readerTheme}`}>
                  <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.1)', fontSize: '0.8rem', opacity: 0.7 }}>Extracted Readable Text</div>
                  <div className="reader-content" style={{ fontSize: `${readerFontSize}px` }}>
                    {paragraphs.filter(p => !p.isIntro).map((p, idx) => (
                      <p key={idx} style={{ marginBottom: '1.2em' }}>{p.text || p}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* SUB-TAB 2: AUDIOBOOKS (SPEECH SYNTHESIS ENGINE) */}
      {activeSubTab === 'audiobooks' && (
        <div className="glass-card">
          {selectedBook ? (
            <div className="audiobook-dashboard">
              {/* Media Control Dashboard */}
              <div className="audiobook-console">
                <div className="book-cover-wrapper console-cover">
                  <div className="book-cover-custom" style={{ background: getCategoryColor(selectedBook.category), height: '240px' }}>
                    <div className="cover-header">{selectedBook.category}</div>
                    <div className="cover-title">{selectedBook.title}</div>
                    <div className="cover-author">By {selectedBook.author}</div>
                  </div>
                </div>

                <div className="audiobook-now-playing">
                  <div className="audio-status-badge">
                    <span className={`audio-status-dot ${isPlaying ? 'active' : ''}`} />
                    {isPlaying ? 'Narrating live' : 'Ready to play'}
                  </div>
                  <h3 className="title-gradient" style={{ marginTop: '8px' }}>{selectedBook.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>by {selectedBook.author}</p>

                  <div className="audio-progress-card">
                    <div className="audio-progress-track">
                      <div className="audio-progress-fill" style={{ width: `${playbackPercent}%` }} />
                    </div>
                    <div className="audio-progress-meta">
                      <span>{`${Math.min(currentParagraphIndex + 1, paragraphs.length)} / ${paragraphs.length} paragraphs`}</span>
                      <span>{`${Math.round(playbackPercent)}%`}</span>
                    </div>
                  </div>

                  <div className="audio-now-reading">
                    <span className="audio-help-pill">{playbackMessage}</span>
                    <div className="audio-now-reading-text">
                      {activeParagraph?.text ? `${activeParagraph.text.slice(0, 140)}${activeParagraph.text.length > 140 ? '…' : ''}` : 'Select a book to begin listening'}
                    </div>
                  </div>

                  <div className="audio-helper-row">
                    <label className="audio-toggle">
                      <input type="checkbox" checked={autoAdvance} onChange={() => setAutoAdvance(!autoAdvance)} />
                      <span>Auto-advance</span>
                    </label>
                  </div>
                </div>

                {/* Media Audio Controllers */}
                <div className="audio-controls-row">
                  <button className="audio-btn-round" title="Previous Paragraph" onClick={handlePrevParagraph}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="19 20 9 12 19 4 19 20"/>
                      <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="3"/>
                    </svg>
                  </button>

                  <button className="audio-btn-round play-pause" title={isPlaying ? "Pause" : "Play Narration"} onClick={handlePlayPause}>
                    {isPlaying ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16"/>
                        <rect x="14" y="4" width="4" height="16"/>
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '4px' }}>
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                    )}
                  </button>

                  <button className="audio-btn-round" title="Stop & Reset" onClick={handleStop}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="4" y="4" width="16" height="16"/>
                    </svg>
                  </button>

                  <button className="audio-btn-round" title="Next Paragraph" onClick={handleNextParagraph}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 4 15 12 5 20 5 4"/>
                      <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="3"/>
                    </svg>
                  </button>
                </div>

                {/* Reading Speed Rates */}
                <div className="slider-container" style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Narration Speed</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--accent-cyan)' }}>{rate.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    className="slider-input"
                    value={rate}
                    onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                  />
                </div>

                {/* Voice Selection Options */}
                <div className="slider-container" style={{ marginTop: '8px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Select Narrator Voice</label>
                  <select
                    className="input-field"
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    style={{ margin: 0, width: '100%', padding: '6px 10px', fontSize: '0.85rem' }}
                  >
                    {voices.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Premium Audiobook Toggle */}
                <div className="slider-container" style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(99, 102, 241, 0.05)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
                  <input
                    type="checkbox"
                    id="skipFrontMatterToggle"
                    checked={skipFrontMatter}
                    onChange={(e) => setSkipFrontMatter(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-indigo)' }}
                  />
                  <label htmlFor="skipFrontMatterToggle" style={{ fontSize: '0.8rem', fontWeight: '500', color: 'white', cursor: 'pointer', userSelect: 'none' }}>
                    ✨ Premium Narrator Flow
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 'normal', marginTop: '2px' }}>
                      Skips cover details, copyright pages, & TOC
                    </span>
                  </label>
                </div>

                <div style={{ marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Paragraph: {currentParagraphIndex + 1} / {paragraphs.length}
                </div>
              </div>

              {/* Karaoke Highlighting Transcripts Panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h4 style={{ color: 'var(--text-primary)' }}>Synchronized Narration Text</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Click on any paragraph card below to jump narration directly to that sentence.</p>
                
                <div className="audiobook-transcript">
                  {paragraphs.map((p, idx) => {
                    let cardClass = "transcript-paragraph";
                    if (currentParagraphIndex === idx) {
                      cardClass += " active-speech";
                    }
                    
                    if (p.isIntro) {
                      cardClass += " audiobook-intro";
                    } else if (p.isMetadata && skipFrontMatter) {
                      cardClass += " metadata-skipped";
                    }
                    
                    return (
                      <div
                        key={idx}
                        id={`para-${idx}`}
                        className={cardClass}
                        onClick={() => speakParagraph(idx)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.75rem', opacity: 0.5, fontWeight: 'bold' }}>
                            {p.isIntro ? "🎙️ NARRATION START" : `Section ${idx}`}
                          </span>
                          
                          {p.isIntro && (
                            <span className="paragraph-badge badge-intro">Audiobook Intro</span>
                          )}
                          
                          {p.isMetadata && (
                            <span className="paragraph-badge badge-metadata">
                              {p.metadataType || "Metadata"}
                            </span>
                          )}
                          
                          {p.isMetadata && skipFrontMatter && (
                            <span className="badge-skipped-status">Skipped in Autoplay</span>
                          )}
                        </div>
                        {p.text || p}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '16px', color: 'var(--accent-indigo)' }}>
                <path d="M12 1a11 11 0 0 0-11 11v8a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H3a9 9 0 0 1 18 0h-2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-8a11 11 0 0 0-11-11z"/>
              </svg>
              <h3>No Audiobook Selected</h3>
              <p style={{ marginTop: '8px' }}>Navigate to the Digital Library tab and click "Listen" on any book card to load narration controls here.</p>
              <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => setActiveSubTab('books')}>Browse Books Catalog</button>
            </div>
          )}
        </div>
      )}

      {/* UPLOAD DIGITAL BOOK MODAL */}
      {showUploadModal && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', zIndex: 1000 }}>
          <div className="glass-card modal-content" style={{ width: '100%', maxWidth: '500px', padding: '30px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 className="title-gradient">Upload Academic Resource</h2>
              <button style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'white' }} onClick={() => setShowUploadModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Resource Title</label>
                <input
                  type="text"
                  className="input-field"
                  required
                  placeholder="e.g. Introduction to React & Redux"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Author / Publisher</label>
                <input
                  type="text"
                  className="input-field"
                  required
                  placeholder="e.g. Dr. Jane Doe"
                  value={uploadForm.author}
                  onChange={(e) => setUploadForm({ ...uploadForm, author: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Subject / Category</label>
                <select
                  className="input-field"
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                >
                  <option value="Programming">Programming</option>
                  <option value="Soft Skills">Soft Skills</option>
                  <option value="Finance">Finance</option>
                  <option value="Career Prep">Career Prep</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Short Description</label>
                <textarea
                  className="input-field"
                  rows="3"
                  required
                  placeholder="Provide a summary of the topics covered in this eBook..."
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  style={{ resize: 'none' }}
                />
              </div>

              <div className="form-group">
                <label>Select PDF File (Max 10MB)</label>
                <input
                  type="file"
                  accept="application/pdf"
                  required
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  style={{ display: 'block', marginTop: '6px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)} disabled={isUploading}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isUploading}>
                  {isUploading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="loading-spinner" style={{ width: '12px', height: '12px', borderWidth: '2px', borderTopColor: 'white' }}></span>
                      Processing PDF & Uploading...
                    </span>
                  ) : 'Upload Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function PersonalSpacePanel({ user }) {
  const [activeSubTab, setActiveSubTab] = useState('todo'); // todo, pages, settings

  // --- Todo Tasks State ---
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [taskSearch, setTaskSearch] = useState('');
  const [taskFilter, setTaskFilter] = useState('all'); // all, pending, completed

  // --- Documents/Pages State ---
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [isSavingDoc, setIsSavingDoc] = useState(false);

  // --- Settings State ---
  const [cloudinaryUrl, setCloudinaryUrl] = useState(user?.personal_cloudinary_url || '');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState({ type: '', text: '' });

  // --- Load Data ---
  useEffect(() => {
    if (activeSubTab === 'todo') {
      fetchTasks();
    } else if (activeSubTab === 'pages') {
      fetchDocs();
    }
  }, [activeSubTab]);

  const fetchTasks = async () => {
    try {
      setTasksLoading(true);
      const data = await api.personal.tasks.list();
      setTasks(data);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setTasksLoading(false);
    }
  };

  const fetchDocs = async () => {
    try {
      setDocsLoading(true);
      const data = await api.personal.documents.list();
      setDocs(data);
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    } finally {
      setDocsLoading(false);
    }
  };

  // --- Tasks Handlers ---
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      const task = await api.personal.tasks.create({ title: newTaskTitle.trim() });
      setTasks(prev => [...prev, task]);
      setNewTaskTitle('');
    } catch (err) {
      console.error("Failed to create task:", err);
    }
  };

  const handleToggleTask = async (taskId) => {
    try {
      const updatedTask = await api.personal.tasks.toggle(taskId);
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    } catch (err) {
      console.error("Failed to toggle task:", err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.personal.tasks.delete(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  // --- Documents Handlers ---
  const handleAddNewDoc = () => {
    setSelectedDoc({ id: 'new', title: 'Untitled Page', content: '', filename: null, file_url: null });
    setDocTitle('Untitled Page');
    setDocContent('');
    setDocFile(null);
    setEditMode(true);
    setPreviewMode(false);
  };

  const handleSelectDoc = (doc) => {
    setSelectedDoc(doc);
    setDocTitle(doc.title);
    setDocContent(doc.content || '');
    setDocFile(null);
    setEditMode(false);
    setPreviewMode(false);
  };

  const handleSaveDoc = async (e) => {
    e.preventDefault();
    if (!docTitle.trim()) return;
    try {
      setIsSavingDoc(true);
      const formData = new FormData();
      formData.append('title', docTitle);
      formData.append('content', docContent);
      if (docFile) {
        formData.append('file', docFile);
      }

      let savedDoc;
      if (selectedDoc.id === 'new') {
        savedDoc = await api.personal.documents.create(formData);
        setDocs(prev => [savedDoc, ...prev]);
      } else {
        savedDoc = await api.personal.documents.update(selectedDoc.id, formData);
        setDocs(prev => prev.map(d => d.id === selectedDoc.id ? savedDoc : d));
      }
      setSelectedDoc(savedDoc);
      setDocFile(null);
      setEditMode(false);
      // Refresh list to pull updated timestamps/urls
      const updatedList = await api.personal.documents.list();
      setDocs(updatedList);
    } catch (err) {
      console.error("Failed to save document:", err);
      alert(err.detail || "Failed to save document");
    } finally {
      setIsSavingDoc(false);
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this page/plan? This cannot be undone.")) return;
    try {
      await api.personal.documents.delete(docId);
      setDocs(prev => prev.filter(d => d.id !== docId));
      if (selectedDoc?.id === docId) {
        setSelectedDoc(null);
      }
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
  };

  // --- Settings Handlers ---
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setIsSavingSettings(true);
      setSettingsMessage({ type: '', text: '' });
      await api.personal.settings.save({ personal_cloudinary_url: cloudinaryUrl.trim() || null });
      
      // Update context and localStorage
      const updatedUser = { ...user, personal_cloudinary_url: cloudinaryUrl.trim() || null };
      localStorage.setItem('academy_user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('auth_change'));
      
      setSettingsMessage({ type: 'success', text: 'Cloudinary storage settings updated successfully!' });
    } catch (err) {
      setSettingsMessage({ type: 'error', text: err.detail || 'Failed to update settings.' });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleTestCloudinary = async () => {
    if (!cloudinaryUrl.trim()) {
      setSettingsMessage({ type: 'error', text: 'Please enter a Cloudinary connection string first.' });
      return;
    }
    try {
      setIsTesting(true);
      setSettingsMessage({ type: '', text: '' });
      const res = await api.personal.settings.testCloudinary({ personal_cloudinary_url: cloudinaryUrl.trim() });
      setSettingsMessage({ type: 'success', text: res.message || 'Connection check successful!' });
    } catch (err) {
      setSettingsMessage({ type: 'error', text: err.detail || 'Connection failed. Check your API credentials.' });
    } finally {
      setIsTesting(false);
    }
  };

  // --- Simple Markdown Parser ---
  const renderMarkdown = (text) => {
    if (!text) return '<p style="color: var(--text-muted); font-style: italic;">No content written yet.</p>';
    
    // Escape HTML to prevent XSS
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
      
    // Replace Markdown syntax
    html = html.replace(/^### (.*$)/gim, '<h3 style="margin: 16px 0 8px 0; border-bottom: 1px solid var(--border-color); padding-bottom: 4px;">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 style="margin: 20px 0 10px 0; border-bottom: 1px solid var(--border-color); padding-bottom: 6px; color: var(--accent-cyan);">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 style="margin: 24px 0 12px 0; font-size: 2rem; color: var(--accent-indigo);">$1</h1>');
    
    html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/\*(.*)\*/gim, '<em>$1</em>');
    
    html = html.replace(/^- \[ \] (.*$)/gim, '<div style="display: flex; gap: 8px; margin: 4px 0;"><input type="checkbox" disabled /> <span>$1</span></div>');
    html = html.replace(/^- \[x\] (.*$)/gim, '<div style="display: flex; gap: 8px; margin: 4px 0;"><input type="checkbox" checked disabled /> <span style="text-decoration: line-through; color: var(--text-muted);">$1</span></div>');
    
    html = html.replace(/^\* (.*$)/gim, '<li style="margin-left: 20px;">$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li style="margin-left: 20px;">$1</li>');
    
    html = html.replace(/^> (.*$)/gim, '<blockquote style="border-left: 4px solid var(--accent-cyan); padding-left: 12px; margin: 12px 0; color: var(--text-secondary); font-style: italic;">$1</blockquote>');
    html = html.replace(/`([^`]+)`/g, '<code style="background: var(--bg-input); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em; border: 1px solid var(--border-color);">$1</code>');

    // Split paragraphs
    html = html.split('\n\n').map(p => {
      const trimmed = p.trim();
      if (trimmed.startsWith('<h') || trimmed.startsWith('<li') || trimmed.startsWith('<block') || trimmed.startsWith('<div')) {
        return p;
      }
      return `<p style="margin-bottom: 12px; line-height: 1.7;">${p.replace(/\n/g, '<br/>')}</p>`;
    }).join('\n');

    return html;
  };

  // --- Filtering & Stats ---
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(taskSearch.toLowerCase());
    if (taskFilter === 'completed') return matchesSearch && t.completed;
    if (taskFilter === 'pending') return matchesSearch && !t.completed;
    return matchesSearch;
  });

  const completedCount = tasks.filter(t => t.completed).length;
  const taskProgress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="personal-space-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px', minHeight: '80vh' }}>
      
      {/* Tab Header */}
      <div className="glass-card" style={{ padding: '20px 24px' }}>
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 className="title-gradient" style={{ fontSize: '1.8rem' }}>Personal Workspace</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Your private Notion-style workspace for notes, plans, checklist tasks, and custom Cloudinary backups.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-input)', padding: '4px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
            <button 
              className="btn" 
              onClick={() => setActiveSubTab('todo')}
              style={{ 
                padding: '8px 16px', 
                fontSize: '0.85rem', 
                background: activeSubTab === 'todo' ? 'var(--bg-card)' : 'transparent',
                borderColor: activeSubTab === 'todo' ? 'var(--border-color-hover)' : 'transparent',
                color: activeSubTab === 'todo' ? 'var(--accent-cyan)' : 'var(--text-secondary)'
              }}
            >
              ✅ Daily Checklist
            </button>
            <button 
              className="btn" 
              onClick={() => setActiveSubTab('pages')}
              style={{ 
                padding: '8px 16px', 
                fontSize: '0.85rem', 
                background: activeSubTab === 'pages' ? 'var(--bg-card)' : 'transparent',
                borderColor: activeSubTab === 'pages' ? 'var(--border-color-hover)' : 'transparent',
                color: activeSubTab === 'pages' ? 'var(--accent-cyan)' : 'var(--text-secondary)'
              }}
            >
              📝 Plans & Notion Space
            </button>
            <button 
              className="btn" 
              onClick={() => setActiveSubTab('settings')}
              style={{ 
                padding: '8px 16px', 
                fontSize: '0.85rem', 
                background: activeSubTab === 'settings' ? 'var(--bg-card)' : 'transparent',
                borderColor: activeSubTab === 'settings' ? 'var(--border-color-hover)' : 'transparent',
                color: activeSubTab === 'settings' ? 'var(--accent-cyan)' : 'var(--text-secondary)'
              }}
            >
              ⚙️ Cloud Settings
            </button>
          </div>
        </div>
      </div>

      {/* --- Checklist Sub-tab --- */}
      {activeSubTab === 'todo' && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Progress and Add Form */}
          <div className="flex-between" style={{ gap: '20px', flexWrap: 'wrap', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
            <div style={{ flex: '1', minWidth: '240px' }}>
              <div className="flex-between" style={{ marginBottom: '8px', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Task Completion Progress</span>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: '700' }}>{taskProgress}% ({completedCount}/{tasks.length})</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <div style={{ height: '100%', width: `${taskProgress}%`, background: 'linear-gradient(90deg, var(--accent-indigo) 0%, var(--accent-cyan) 100%)', transition: 'width 0.4s ease' }} />
              </div>
            </div>

            <form onSubmit={handleCreateTask} style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '480px' }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="What is your next checklist item? (Press Enter)" 
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                style={{ margin: 0 }}
                required
              />
              <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>Add Item</button>
            </form>
          </div>

          {/* Filters & Search */}
          <div className="flex-between" style={{ gap: '12px', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search checklist..." 
              value={taskSearch}
              onChange={e => setTaskSearch(e.target.value)}
              style={{ maxWidth: '300px', margin: 0 }}
            />
            <div style={{ display: 'flex', gap: '6px' }}>
              {['all', 'pending', 'completed'].map(f => (
                <button 
                  key={f}
                  className="btn" 
                  onClick={() => setTaskFilter(f)}
                  style={{ 
                    padding: '4px 12px', 
                    fontSize: '0.75rem', 
                    textTransform: 'capitalize',
                    background: taskFilter === f ? 'var(--bg-card-hover)' : 'var(--bg-input)',
                    borderColor: taskFilter === f ? 'var(--accent-cyan)' : 'var(--border-color)',
                    color: taskFilter === f ? 'var(--text-primary)' : 'var(--text-secondary)'
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Checklist Items */}
          {tasksLoading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading checklist...</p>
          ) : filteredTasks.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0', border: '1px dashed var(--border-color)', borderRadius: 'var(--border-radius-md)' }}>
              No tasks found in checklist matching filters.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredTasks.map(t => (
                <div 
                  key={t.id} 
                  className="flex-between" 
                  style={{ 
                    background: 'var(--bg-input)', 
                    padding: '12px 16px', 
                    borderRadius: 'var(--border-radius-md)', 
                    border: '1px solid var(--border-color)', 
                    transition: 'border-color 0.2s',
                    opacity: t.completed ? 0.75 : 1
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-color-hover)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <input 
                      type="checkbox" 
                      checked={t.completed} 
                      onChange={() => handleToggleTask(t.id)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-cyan)' }}
                    />
                    <span style={{ 
                      fontSize: '0.95rem', 
                      textDecoration: t.completed ? 'line-through' : 'none',
                      color: t.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                      lineHeight: '1.4'
                    }}>
                      {t.title}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {new Date(t.created_at).toLocaleDateString()}
                    </span>
                    <button 
                      onClick={() => handleDeleteTask(t.id)} 
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        color: 'var(--accent-rose)', 
                        cursor: 'pointer', 
                        fontSize: '1.1rem',
                        padding: '4px'
                      }}
                      title="Delete checklist item"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- Notion Space / Plans Sub-tab --- */}
      {activeSubTab === 'pages' && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px', alignItems: 'start' }}>
          
          {/* Pages Sidebar list */}
          <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '500px' }}>
            <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>My Pages</span>
              <button 
                className="btn" 
                onClick={handleAddNewDoc}
                style={{ padding: '2px 8px', fontSize: '0.75rem', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}
              >
                + New
              </button>
            </div>
            
            {docsLoading ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>Loading...</p>
            ) : docs.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', margin: '20px 0' }}>No pages created yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '420px', overflowY: 'auto' }}>
                {docs.map(d => (
                  <div 
                    key={d.id}
                    onClick={() => handleSelectDoc(d)}
                    style={{ 
                      padding: '8px 12px', 
                      borderRadius: 'var(--border-radius-md)', 
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      background: selectedDoc?.id === d.id ? 'var(--bg-card-hover)' : 'transparent',
                      color: selectedDoc?.id === d.id ? 'var(--accent-cyan)' : 'var(--text-primary)',
                      border: '1px solid',
                      borderColor: selectedDoc?.id === d.id ? 'var(--border-color-hover)' : 'transparent',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      📄 {d.title}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDoc(d.id);
                      }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1rem', cursor: 'pointer', padding: '0 4px' }}
                      title="Delete page"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Workspace / Page View */}
          <div className="glass-card" style={{ minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
            {!selectedDoc ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)', gap: '12px' }}>
                <span style={{ fontSize: '3rem' }}>📓</span>
                <p style={{ fontSize: '1rem' }}>Select a page from the sidebar or create a new plan to begin editing.</p>
                <button className="btn btn-primary" onClick={handleAddNewDoc}>Create a Page</button>
              </div>
            ) : (
              <form onSubmit={handleSaveDoc} style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                
                {/* Header Actions */}
                <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {editMode ? (
                      <>
                        <button type="submit" className="btn btn-primary" disabled={isSavingDoc}>
                          {isSavingDoc ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={() => {
                          if (selectedDoc.id === 'new') setSelectedDoc(null);
                          setEditMode(false);
                        }}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button type="button" className="btn btn-primary" onClick={() => setEditMode(true)}>
                        ✏️ Edit Page
                      </button>
                    )}
                  </div>
                  
                  {!editMode && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Last updated: {new Date(selectedDoc.updated_at).toLocaleString()}
                    </span>
                  )}
                  
                  {editMode && (
                    <button 
                      type="button" 
                      className="btn" 
                      onClick={() => setPreviewMode(!previewMode)}
                      style={{ fontSize: '0.8rem', background: 'var(--bg-input)', borderColor: 'var(--border-color)' }}
                    >
                      {previewMode ? '✍️ Edit View' : '👁️ Preview Markdown'}
                    </button>
                  )}
                </div>

                {/* Document Workspace */}
                {editMode ? (
                  /* Edit Mode */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                    <div className="form-group">
                      <label className="form-label">Page Title</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={docTitle} 
                        onChange={e => setDocTitle(e.target.value)}
                        placeholder="Page Title (e.g. Weekly Batch Plan)"
                        required
                        disabled={previewMode}
                      />
                    </div>
                    
                    {previewMode ? (
                      /* Markdown Live Preview */
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Markdown Live Preview</label>
                        <div 
                          className="form-control"
                          style={{ 
                            minHeight: '220px', 
                            background: 'var(--bg-input)', 
                            border: '1px solid var(--border-color)', 
                            borderRadius: 'var(--border-radius-md)', 
                            padding: '16px', 
                            overflowY: 'auto' 
                          }}
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(docContent) }}
                        />
                      </div>
                    ) : (
                      /* Text Editor */
                      <div className="form-group" style={{ flex: 1 }}>
                        <div className="flex-between">
                          <label className="form-label">Notes & Description (Supports Markdown)</label>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Use #, ##, **, -, [ ], or ` for formatting</span>
                        </div>
                        <textarea 
                          className="form-control" 
                          rows="10"
                          value={docContent} 
                          onChange={e => setDocContent(e.target.value)}
                          placeholder="Write your plan details, summaries, or Markdown notes here..."
                          style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.9rem' }}
                        />
                      </div>
                    )}
                    
                    {/* File Attachment Upload */}
                    <div className="form-group" style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '16px' }}>
                      <label className="form-label">Attach File / Document (PDF, Images, Zip)</label>
                      {selectedDoc.filename && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                          Current Attachment: <span style={{ color: 'var(--accent-cyan)', fontWeight: '600' }}>{selectedDoc.filename}</span>
                        </div>
                      )}
                      <input 
                        type="file" 
                        onChange={e => setDocFile(e.target.files[0])}
                        style={{ display: 'block', marginTop: '6px' }}
                      />
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Uploading files will store them in your configured Cloudinary backup cloud (if credentials are set).
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Read/View Mode */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                    <div>
                      <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>{selectedDoc.title}</h1>
                    </div>
                    
                    {/* Rendered Content */}
                    <div 
                      style={{ 
                        background: 'rgba(255,255,255,0.02)', 
                        padding: '20px', 
                        borderRadius: 'var(--border-radius-md)', 
                        border: '1px solid var(--border-color)', 
                        minHeight: '200px'
                      }}
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedDoc.content) }}
                    />
                    
                    {/* File Attachment Download Link */}
                    {selectedDoc.file_url && (
                      <div 
                        style={{ 
                          borderTop: '1px solid var(--border-color)', 
                          paddingTop: '16px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          background: 'var(--bg-input)',
                          padding: '12px 16px',
                          borderRadius: 'var(--border-radius-md)',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.2rem' }}>📎</span>
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{selectedDoc.filename || 'Attached Document'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Stored in cloud repository</div>
                          </div>
                        </div>
                        <a 
                          href={selectedDoc.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn"
                          style={{ padding: '6px 14px', fontSize: '0.8rem', color: 'var(--accent-cyan)', borderColor: 'var(--accent-cyan)' }}
                        >
                          Download / View File
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      )}

      {/* --- Cloud settings Sub-tab --- */}
      {activeSubTab === 'settings' && (
        <div className="glass-card" style={{ maxWidth: '680px', margin: '0 auto', width: '100%' }}>
          <h3 style={{ marginBottom: '12px' }}>Cloudinary Storage Settings</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '20px' }}>
            Academy allows you to configure your own personal **Cloudinary storage account**. 
            If you provide a valid API connection string, any documents or files you upload in your personal space 
            will go directly to your personal Cloudinary cloud. If blank, uploads default to the server's local fallback.
          </p>

          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Cloudinary Connection URL (CLOUDINARY_URL)</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="cloudinary://622257769199411:2BeXQ_atOxgALKuUjiibJnp7YnM@n83dphoi" 
                value={cloudinaryUrl}
                onChange={e => setCloudinaryUrl(e.target.value)}
                required={false}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Format example: `cloudinary://622257769199411:2BeXQ_atOxgALKuUjiibJnp7YnM@n83dphoi` (Do not include brackets `[]`)
              </span>
            </div>

            {/* Connection Test Results */}
            {settingsMessage.text && (
              <div 
                className="alert" 
                style={{ 
                  padding: '12px 16px', 
                  borderRadius: 'var(--border-radius-md)', 
                  fontSize: '0.85rem',
                  background: settingsMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid',
                  borderColor: settingsMessage.type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                  color: settingsMessage.type === 'success' ? '#34d399' : '#f87171',
                  marginBottom: '8px'
                }}
              >
                {settingsMessage.type === 'success' ? '🟢 ' : '🔴 '} {settingsMessage.text}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={isSavingSettings}
              >
                {isSavingSettings ? 'Saving...' : 'Save Settings'}
              </button>
              
              <button 
                type="button" 
                className="btn" 
                onClick={handleTestCloudinary}
                disabled={isTesting}
                style={{ 
                  background: 'var(--bg-input)', 
                  borderColor: 'var(--accent-cyan)', 
                  color: 'var(--accent-cyan)' 
                }}
              >
                {isTesting ? 'Testing Link...' : '🔌 Test Connection'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

function PlacementKanbanPanel({ user }) {
  const isStudent = user.role === 'student';
  const [activeTab, setActiveTab] = useState(isStudent ? 'board' : 'dashboard'); // board, dashboard
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states for adding/editing leads
  const [showAddForm, setShowAddForm] = useState(false);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [stage, setStage] = useState('applied');
  const [salary, setSalary] = useState('');
  const [notes, setNotes] = useState('');
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [students, setStudents] = useState([]);
  const [targetStudentEmail, setTargetStudentEmail] = useState('');

  useEffect(() => {
    fetchData();
  }, [selectedBatch]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (isStudent) {
        const studentLeads = await api.placements.listLeads();
        setLeads(studentLeads);
      } else {
        // Area Head lists leads & stats
        const allLeads = await api.placements.listLeads(selectedBatch || null);
        setLeads(allLeads);
        
        const placementStats = await api.placements.getStats();
        setStats(placementStats);

        const listBatches = await api.batches.list();
        setBatches(listBatches);

        const allUsers = await api.auth.listUsers();
        const onlyStudents = allUsers.filter(u => u.role === 'student');
        setStudents(onlyStudents);
        if (onlyStudents.length > 0) {
          setTargetStudentEmail(onlyStudents[0].email);
        }
      }
    } catch (err) {
      console.error("Failed to fetch placement leads:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;

    try {
      const payload = {
        company: company.trim(),
        role: role.trim(),
        stage,
        salary: salary.trim() || null,
        notes: notes.trim() || null
      };
      if (!isStudent) {
        payload.student_email = targetStudentEmail;
      }
      const newLead = await api.placements.createLead(payload);
      setLeads(prev => [newLead, ...prev]);
      
      // Reset form
      setCompany('');
      setRole('');
      setStage('applied');
      setSalary('');
      setNotes('');
      setShowAddForm(false);
      
      if (!isStudent) {
        // Refresh stats
        const updatedStats = await api.placements.getStats();
        setStats(updatedStats);
      }
    } catch (err) {
      alert(err.message || "Failed to create lead");
    }
  };

  const handleStageChange = async (leadId, newStage) => {
    try {
      const updated = await api.placements.updateLead(leadId, { stage: newStage });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage: newStage } : l));
      
      if (!isStudent) {
        // Refresh stats
        const updatedStats = await api.placements.getStats();
        setStats(updatedStats);
      }
    } catch (err) {
      alert(err.message || "Failed to update stage");
    }
  };

  const handleUpdateNotes = async (leadId, updatedNotes) => {
    try {
      await api.placements.updateLead(leadId, { notes: updatedNotes });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, notes: updatedNotes } : l));
      setEditingLeadId(null);
    } catch (err) {
      alert(err.message || "Failed to update notes");
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (!window.confirm("Are you sure you want to delete this job lead?")) return;
    try {
      await api.placements.deleteLead(leadId);
      setLeads(prev => prev.filter(l => l.id !== leadId));
      
      if (!isStudent) {
        const updatedStats = await api.placements.getStats();
        setStats(updatedStats);
      }
    } catch (err) {
      alert(err.message || "Failed to delete lead");
    }
  };

  // Group leads by stage
  const columns = {
    applied: leads.filter(l => l.stage === 'applied'),
    interviewing: leads.filter(l => l.stage === 'interviewing'),
    offer: leads.filter(l => l.stage === 'offer'),
    hired: leads.filter(l => l.stage === 'hired')
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* CRM Mode Header & Navigation */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--accent-cyan)' }}>💼 Placement Pipeline CRM</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
              {isStudent 
                ? "Track your applications, interview invites, offers, and placement status."
                : "Centralized monitoring of placement metrics and lead funnels across all batches."}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {!isStudent && (
              <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-input)', padding: '4px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
                <button 
                  className="btn" 
                  onClick={() => setActiveTab('dashboard')}
                  style={{ 
                    padding: '6px 14px', 
                    fontSize: '0.8rem', 
                    background: activeTab === 'dashboard' ? 'var(--bg-card)' : 'transparent',
                    borderColor: activeTab === 'dashboard' ? 'var(--border-color-hover)' : 'transparent',
                    color: activeTab === 'dashboard' ? 'var(--accent-cyan)' : 'var(--text-secondary)'
                  }}
                >
                  📊 Central Dashboard
                </button>
                <button 
                  className="btn" 
                  onClick={() => setActiveTab('board')}
                  style={{ 
                    padding: '6px 14px', 
                    fontSize: '0.8rem', 
                    background: activeTab === 'board' ? 'var(--bg-card)' : 'transparent',
                    borderColor: activeTab === 'board' ? 'var(--border-color-hover)' : 'transparent',
                    color: activeTab === 'board' ? 'var(--accent-cyan)' : 'var(--text-secondary)'
                  }}
                >
                  📋 Master Kanban Board
                </button>
              </div>
            )}
            
            <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
              {isStudent ? '+ Track New Lead' : '👤 + Log Student Placement'}
            </button>
          </div>
        </div>
      </div>

      {/* --- Dashboard tab (Area Head Only) --- */}
      {activeTab === 'dashboard' && stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* KPI widgets */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Active Leads</span>
              <span style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>{stats.total_leads}</span>
            </div>
            <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Students Hired</span>
              <span style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent-emerald)' }}>{stats.hired_count}</span>
            </div>
            <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Under Interviewing</span>
              <span style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent-amber)' }}>{stats.interviewing_count}</span>
            </div>
            <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Batch Conversion Rate</span>
              <span style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent-cyan)' }}>{stats.conversion_rate}%</span>
            </div>
          </div>

          {/* Filters & Batch Statistics */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div className="flex-between" style={{ flexWrap: 'wrap', gap: '16px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
              <h4 style={{ color: 'var(--text-primary)' }}>Batch Analytics Summary</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Filter Master Data:</span>
                <select 
                  className="form-control" 
                  value={selectedBatch} 
                  onChange={e => setSelectedBatch(e.target.value)}
                  style={{ width: '220px', margin: 0, padding: '8px' }}
                >
                  <option value="">All Batches</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Batch funnels breakdown */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '12px' }}>Batch Name</th>
                    <th style={{ padding: '12px' }}>Applied</th>
                    <th style={{ padding: '12px' }}>Interviewing</th>
                    <th style={{ padding: '12px' }}>Offers Recd</th>
                    <th style={{ padding: '12px' }}>Total Hired</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.batch_stats).map(([bname, counts]) => (
                    <tr key={bname} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '12px', fontWeight: '600' }}>{bname}</td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{counts.applied}</td>
                      <td style={{ padding: '12px', color: 'var(--accent-amber)' }}>{counts.interviewing}</td>
                      <td style={{ padding: '12px', color: 'var(--accent-indigo)' }}>{counts.offer}</td>
                      <td style={{ padding: '12px', color: 'var(--accent-emerald)', fontWeight: 'bold' }}>{counts.hired}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Master Leads list */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h4 style={{ marginBottom: '16px' }}>Master Students Placement Leads ({leads.length})</h4>
            {leads.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>No leads tracked matching active filters.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '12px' }}>Student</th>
                      <th style={{ padding: '12px' }}>Batch</th>
                      <th style={{ padding: '12px' }}>Company</th>
                      <th style={{ padding: '12px' }}>Job Role</th>
                      <th style={{ padding: '12px' }}>Pipeline Stage</th>
                      <th style={{ padding: '12px' }}>CTC / Salary</th>
                      <th style={{ padding: '12px' }}>Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map(l => (
                      <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: '600' }}>{l.student_name || 'Student'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l.student_email}</div>
                        </td>
                        <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{l.batch_name || 'N/A'}</td>
                        <td style={{ padding: '12px', fontWeight: '600' }}>{l.company}</td>
                        <td style={{ padding: '12px' }}>{l.role}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ 
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            background: l.stage === 'hired' ? 'rgba(16, 185, 129, 0.15)' : 
                                        l.stage === 'offer' ? 'rgba(168, 85, 247, 0.15)' :
                                        l.stage === 'interviewing' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                            color: l.stage === 'hired' ? 'var(--accent-emerald)' : 
                                   l.stage === 'offer' ? '#c084fc' :
                                   l.stage === 'interviewing' ? 'var(--accent-amber)' : 'var(--accent-cyan)'
                          }}>
                            {l.stage}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{l.salary || 'N/A'}</td>
                        <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          {new Date(l.updated_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* --- Kanban Board View (Both Students and Area Heads) --- */}
      {activeTab === 'board' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Inline creation form */}
          {showAddForm && (
            <div className="glass-card" style={{ maxWidth: '600px', width: '100%', margin: '0 auto' }}>
              <h4 style={{ marginBottom: '16px' }}>{isStudent ? 'Track New Placement Lead' : 'Student Placement Record'}</h4>
              <form onSubmit={handleCreateLead} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {!isStudent && (
                  <div className="form-group">
                    <label className="form-label">Student</label>
                    <select 
                      className="form-control" 
                      value={targetStudentEmail} 
                      onChange={e => setTargetStudentEmail(e.target.value)}
                      required
                    >
                      {students.map(s => (
                        <option key={s.id} value={s.email}>
                          {s.name} ({s.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input type="text" className="form-control" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Google" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Job Role / Title</label>
                  <input type="text" className="form-control" value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Backend Developer" required />
                </div>
                <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Current Pipeline Stage</label>
                    <select className="form-control" value={stage} onChange={e => setStage(e.target.value)}>
                      <option value="applied">Applied</option>
                      <option value="interviewing">Interviewing</option>
                      <option value="offer">Offer Received</option>
                      <option value="hired">Hired</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">CTC / Salary Package (Optional)</label>
                    <input type="text" className="form-control" value={salary} onChange={e => setSalary(e.target.value)} placeholder="e.g. 8 LPA" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Follow-up Notes / Tasks</label>
                  <textarea className="form-control" rows="3" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Resume submitted. Tech interview scheduled on Friday." />
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Track Job Lead</button>
                </div>
              </form>
            </div>
          )}

          {/* Kanban Columns */}
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading pipeline boards...</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', alignItems: 'start' }}>
              
              {/* Columns Render loop */}
              {Object.entries(columns).map(([colId, colLeads]) => {
                const headerColors = {
                  applied: 'var(--accent-blue)',
                  interviewing: 'var(--accent-amber)',
                  offer: 'var(--accent-indigo)',
                  hired: 'var(--accent-emerald)'
                };
                
                return (
                  <div key={colId} className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(18, 26, 47, 0.4)', minHeight: '500px' }}>
                    
                    {/* Column Header */}
                    <div style={{ borderBottom: `2px solid ${headerColors[colId]}`, paddingBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.9rem', textTransform: 'uppercase', color: headerColors[colId] }}>
                        {colId.replace('_', ' ')}
                      </span>
                      <span style={{ fontSize: '0.75rem', background: 'var(--bg-input)', padding: '2px 8px', borderRadius: '10px', color: 'var(--text-secondary)' }}>
                        {colLeads.length}
                      </span>
                    </div>

                    {/* Column Cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '480px' }}>
                      {colLeads.map(lead => (
                        <div 
                          key={lead.id} 
                          className="glass-card" 
                          style={{ 
                            padding: '12px', 
                            background: 'var(--bg-input)', 
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            transition: 'border-color 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = headerColors[colId]}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                        >
                          <div className="flex-between" style={{ alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{lead.company}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{lead.role}</div>
                            </div>
                            <button 
                              onClick={() => handleDeleteLead(lead.id)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontSize: '1rem', padding: '0 4px' }}
                              title="Delete lead"
                            >
                              &times;
                            </button>
                          </div>

                          {lead.salary && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: '600' }}>
                              💰 {lead.salary}
                            </div>
                          )}

                          {lead.student_name && !isStudent && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              👤 {lead.student_name} ({lead.batch_name || 'No batch'})
                            </div>
                          )}

                          {/* Inline Notes description */}
                          {editingLeadId === lead.id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <textarea 
                                className="form-control" 
                                rows="2" 
                                defaultValue={lead.notes || ''} 
                                id={`notes-edit-${lead.id}`}
                                style={{ fontSize: '0.8rem', padding: '6px' }}
                              />
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                <button className="btn" style={{ padding: '2px 8px', fontSize: '0.7rem' }} onClick={() => setEditingLeadId(null)}>Cancel</button>
                                <button className="btn btn-primary" style={{ padding: '2px 8px', fontSize: '0.7rem' }} onClick={() => {
                                  const text = document.getElementById(`notes-edit-${lead.id}`).value;
                                  handleUpdateNotes(lead.id, text);
                                }}>Save</button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              onClick={() => isStudent && setEditingLeadId(lead.id)}
                              style={{ 
                                fontSize: '0.8rem', 
                                color: lead.notes ? 'var(--text-secondary)' : 'var(--text-muted)', 
                                fontStyle: lead.notes ? 'normal' : 'italic',
                                background: 'rgba(255,255,255,0.01)',
                                padding: '6px',
                                borderRadius: '4px',
                                cursor: isStudent ? 'pointer' : 'default',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                              title={isStudent ? "Click to edit notes" : lead.notes || "No notes written"}
                            >
                              {lead.notes || "+ Click to add pipeline notes"}
                            </div>
                          )}

                          {/* Quick Stage Mover Selector */}
                          <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Move stage:</span>
                            <select 
                              value={lead.stage} 
                              onChange={(e) => handleStageChange(lead.id, e.target.value)} 
                              className="form-control"
                              style={{ 
                                margin: 0, 
                                padding: '2px 6px', 
                                fontSize: '0.75rem', 
                                width: '130px', 
                                background: 'var(--bg-input)',
                                borderColor: 'var(--border-color)' 
                              }}
                            >
                              <option value="applied">Applied</option>
                              <option value="interviewing">Interviewing</option>
                              <option value="offer">Offer Received</option>
                              <option value="hired">Hired</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

            </div>
          )}
        </div>
      )}

    </div>
  );
}

function OutreachGeneratorPanel({ user }) {
  const [roleTitle, setRoleTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [outreachType, setOutreachType] = useState('linkedin'); // linkedin, email, follow_up
  const [draftText, setDraftText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!roleTitle.trim() || !companyName.trim()) {
      setError("Job Title and Company Name are required.");
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setDraftText('');
      
      const res = await api.placements.generateOutreach({
        role_title: roleTitle.trim(),
        company_name: companyName.trim(),
        job_description: jobDescription.trim() || null,
        resume_text: resumeText.trim() || null,
        outreach_type: outreachType
      });
      setDraftText(res.generated_text);
      setSuccess("AI Outreach draft generated successfully!");
    } catch (err) {
      setError(err.message || "Failed to generate outreach. Make sure you set your API keys in the AI Settings sub-tab.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!draftText) return;
    navigator.clipboard.writeText(draftText);
    alert("Draft text copied to clipboard!");
  };

  return (
    <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
      
      {/* Parameters Form Panel */}
      <div>
        <h3 style={{ marginBottom: '8px' }}>🤖 Outreach Draft Assistant</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
          Craft tailored cover letters, follow-ups, or LinkedIn outreach texts using candidate profiles and target roles.
        </p>

        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">Target Job Title</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. Frontend Developer" 
                value={roleTitle} 
                onChange={e => setRoleTitle(e.target.value)} 
                required 
              />
            </div>
            <div>
              <label className="form-label">Company Name</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. Microsoft" 
                value={companyName} 
                onChange={e => setCompanyName(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Outreach Medium</label>
            <select 
              className="form-control" 
              value={outreachType} 
              onChange={e => setOutreachType(e.target.value)}
            >
              <option value="linkedin">LinkedIn Introduction Message (Concise)</option>
              <option value="email">Cold Outreach Cover Email (Detailed)</option>
              <option value="follow_up">Job Application Follow-up Draft</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Target Job Description (Optional)</label>
            <textarea 
              className="form-control" 
              rows="3" 
              placeholder="Paste skills, stack, or job posting requirements to align draft content..." 
              value={jobDescription} 
              onChange={e => setJobDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">My Skills & Achievements (Pasted Resume)</label>
            <textarea 
              className="form-control" 
              rows="4" 
              placeholder="Paste your resume points, degrees, or key projects to highlight..." 
              value={resumeText} 
              onChange={e => setResumeText(e.target.value)}
            />
          </div>

          {error && (
            <div style={{ color: 'var(--accent-rose)', fontSize: '0.85rem', padding: '10px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid var(--accent-rose)', borderRadius: '6px' }}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
            {loading ? 'Consulting Placement Coach LLM...' : '✨ Generate Outreach Draft'}
          </button>
        </form>
      </div>

      {/* Generated Response Workspace */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '380px' }}>
        <div className="flex-between">
          <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Generated Pitch Draft</span>
          {draftText && (
            <button 
              className="btn" 
              onClick={handleCopyToClipboard}
              style={{ padding: '4px 12px', fontSize: '0.75rem', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}
            >
              📋 Copy Draft
            </button>
          )}
        </div>

        <div 
          className="form-control"
          style={{ 
            flex: 1, 
            background: 'var(--bg-input)', 
            border: '1px solid var(--border-color)', 
            borderRadius: 'var(--border-radius-lg)', 
            padding: '20px', 
            overflowY: 'auto',
            fontFamily: outreachType === 'linkedin' ? 'inherit' : 'monospace',
            fontSize: '0.9rem',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap',
            minHeight: '260px'
          }}
        >
          {draftText ? (
            draftText
          ) : (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', marginTop: '80px' }}>
              Your generated LinkedIn messages, follow-up letters, or cover drafts will display here. Click generate above.
            </p>
          )}
        </div>
      </div>

    </div>
  );
}

function PortfolioBuilderPanel({ user }) {
  const [portfolio, setPortfolio] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [deploying, setDeploying] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [activeSubTab, setActiveSubTab] = React.useState('template'); // 'template' | 'colors' | 'pages' | 'content' | 'launch'

  const [newSkill, setNewSkill] = React.useState('');
  const [newProject, setNewProject] = React.useState({ title: '', description: '', link: '' });
  const [newExperience, setNewExperience] = React.useState({ role: '', company: '', duration: '', description: '' });

  React.useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const userPortfolio = await api.portfolios.get();
      setPortfolio(userPortfolio);
    } catch (err) {
      setError(err.message || 'Failed to load portfolio configurations.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const updated = await api.portfolios.save(portfolio);
      setPortfolio(updated);
      setSuccess('Portfolio draft saved successfully!');
    } catch (err) {
      setError(err.message || 'Failed to save portfolio configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDeploy = async () => {
    if (!portfolio) return;
    try {
      setDeploying(true);
      setError('');
      setSuccess('');
      const nextState = !portfolio.is_deployed;
      await api.portfolios.deploy(nextState);
      setPortfolio(prev => ({
        ...prev,
        is_deployed: nextState,
        deployed_at: nextState ? new Date().toISOString() : null
      }));
      setSuccess(nextState ? 'Your portfolio is now deployed live!' : 'Your portfolio is taken offline.');
    } catch (err) {
      setError(err.message || 'Failed to update deployment state.');
    } finally {
      setDeploying(false);
    }
  };

  const handleDownloadZip = async () => {
    try {
      setExporting(true);
      setError('');
      setSuccess('');
      await api.portfolios.save(portfolio);
      const blob = await api.portfolios.export();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `portfolio_${portfolio.username}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSuccess('Static ZIP portfolio downloaded successfully!');
    } catch (err) {
      setError(err.message || 'Failed to download static ZIP file.');
    } finally {
      setExporting(false);
    }
  };

  const updateField = (section, field, value) => {
    setPortfolio(prev => ({
      ...prev,
      page_content: {
        ...prev.page_content,
        [section]: {
          ...prev.page_content[section],
          [field]: value
        }
      }
    }));
  };

  const togglePage = (pageName) => {
    setPortfolio(prev => {
      const enabled = [...prev.enabled_pages];
      const idx = enabled.indexOf(pageName);
      if (idx > -1) {
        enabled.splice(idx, 1);
      } else {
        enabled.push(pageName);
      }
      return { ...prev, enabled_pages: enabled };
    });
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    const currentSkills = portfolio.page_content.about?.skills || [];
    if (!currentSkills.includes(newSkill.trim())) {
      updateField('about', 'skills', [...currentSkills, newSkill.trim()]);
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (skill) => {
    const currentSkills = portfolio.page_content.about?.skills || [];
    updateField('about', 'skills', currentSkills.filter(s => s !== skill));
  };

  const handleAddProject = () => {
    if (!newProject.title.trim()) return;
    const currentProjs = portfolio.page_content.projects || [];
    setPortfolio(prev => ({
      ...prev,
      page_content: {
        ...prev.page_content,
        projects: [...currentProjs, { ...newProject }]
      }
    }));
    setNewProject({ title: '', description: '', link: '' });
  };

  const handleRemoveProject = (index) => {
    const currentProjs = portfolio.page_content.projects || [];
    const updated = currentProjs.filter((_, i) => i !== index);
    setPortfolio(prev => ({
      ...prev,
      page_content: {
        ...prev.page_content,
        projects: updated
      }
    }));
  };

  const handleAddExperience = () => {
    if (!newExperience.role.trim() || !newExperience.company.trim()) return;
    const currentExps = portfolio.page_content.experience || [];
    setPortfolio(prev => ({
      ...prev,
      page_content: {
        ...prev.page_content,
        experience: [...currentExps, { ...newExperience }]
      }
    }));
    setNewExperience({ role: '', company: '', duration: '', description: '' });
  };

  const handleRemoveExperience = (index) => {
    const currentExps = portfolio.page_content.experience || [];
    const updated = currentExps.filter((_, i) => i !== index);
    setPortfolio(prev => ({
      ...prev,
      page_content: {
        ...prev.page_content,
        experience: updated
      }
    }));
  };

  const presets = [
    { name: "Ocean Breeze", primary: "#3b82f6", secondary: "#1e3a8a", background: "#f8fafc", text: "#0f172a" },
    { name: "Emerald Sunset", primary: "#10b981", secondary: "#065f46", background: "#f0fdf4", text: "#064e3b" },
    { name: "Vibrant Creative", primary: "#f43f5e", secondary: "#be185d", background: "#0f172a", text: "#f8fafc" },
    { name: "Minimal Charcoal", primary: "#111827", secondary: "#4b5563", background: "#fcfbf9", text: "#1f2937" }
  ];

  if (loading) return <div style={{ color: 'var(--text-secondary)', padding: '20px' }}>Loading Portfolio Builder Settings...</div>;
  if (!portfolio) return <div style={{ color: 'var(--accent-rose)', padding: '20px' }}>Error compiling portfolio schema configurations.</div>;

  const backendRoot = api.BASE_URL.replace(/\/api$/, '');
  const publicUrl = `${backendRoot}/portfolios/${portfolio.username}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '20px 0' }}>
      <div className="flex-between">
        <div>
          <h2 className="title-gradient" style={{ fontSize: '1.8rem', fontWeight: '800' }}>Portfolio Builder</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Design your professional portfolio website, host it live, or download it as a self-contained static ZIP.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn" onClick={handleSave} disabled={saving} style={{ padding: '8px 16px', background: 'transparent', borderColor: 'var(--border-color-hover)' }}>
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button className="btn" onClick={handleDownloadZip} disabled={exporting} style={{ padding: '8px 16px', background: 'transparent', color: 'var(--accent-indigo)', borderColor: 'var(--accent-indigo)' }}>
            {exporting ? 'Exporting...' : 'Download ZIP'}
          </button>
          <button 
            className="btn" 
            onClick={handleToggleDeploy} 
            disabled={deploying}
            style={{ 
              padding: '8px 16px', 
              background: portfolio.is_deployed ? 'var(--accent-rose)' : 'var(--accent-emerald)', 
              borderColor: 'transparent',
              color: '#ffffff'
            }}
          >
            {deploying ? 'Updating...' : portfolio.is_deployed ? 'Take Offline' : 'Publish Live'}
          </button>
        </div>
      </div>

      {error && <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid var(--accent-rose)', color: 'var(--accent-rose)', padding: '12px 16px', borderRadius: 'var(--border-radius-md)' }}>{error}</div>}
      {success && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid var(--accent-emerald)', color: 'var(--accent-emerald)', padding: '12px 16px', borderRadius: 'var(--border-radius-md)' }}>{success}</div>}

      {portfolio.is_deployed && (
        <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderColor: 'var(--accent-emerald)', background: 'rgba(16,185,129,0.02)' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Your Portfolio is Live</span>
            <div style={{ marginTop: '4px' }}>
              <a href={publicUrl} target="_blank" style={{ fontWeight: '600', color: 'var(--accent-cyan)', textDecoration: 'underline' }}>{publicUrl}</a>
            </div>
          </div>
          <button 
            className="btn" 
            style={{ padding: '4px 12px', fontSize: '0.8rem', background: 'transparent', borderColor: 'var(--accent-cyan)' }}
            onClick={() => {
              navigator.clipboard.writeText(publicUrl);
              setSuccess('Public portfolio link copied to clipboard!');
            }}
          >
            Copy Link
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        {[
          { id: 'template', label: '1. Select Template' },
          { id: 'colors', label: '2. Palette' },
          { id: 'pages', label: '3. Choose Sections' },
          { id: 'content', label: '4. Edit Details' },
          { id: 'launch', label: '5. Launch settings' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveSubTab(t.id)}
            style={{
              padding: '8px 16px',
              background: activeSubTab === t.id ? 'var(--bg-card)' : 'transparent',
              border: '1px solid',
              borderColor: activeSubTab === t.id ? 'var(--border-color-hover)' : 'transparent',
              borderRadius: 'var(--border-radius-md)',
              color: activeSubTab === t.id ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: activeSubTab === 'launch' ? '1fr' : '1.4fr 1fr', gap: '30px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {activeSubTab === 'template' && (
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Templates</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Select a visual theme structure for your site.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '10px' }}>
                {[
                  { id: 'modern', name: 'Modern', desc: 'Clean card system, fluid rounded glass variables.' },
                  { id: 'minimal', name: 'Minimalist', desc: 'Serif fonts, typography focus, light outlines.' },
                  { id: 'creative', name: 'Creative', desc: 'Space Grotesk typography, gradient titles, custom dashed border indicators.' }
                ].map(theme => (
                  <div
                    key={theme.id}
                    onClick={() => setPortfolio(prev => ({ ...prev, template_id: theme.id }))}
                    style={{
                      border: '1px solid',
                      borderColor: portfolio.template_id === theme.id ? 'var(--accent-cyan)' : 'var(--border-color)',
                      borderRadius: 'var(--border-radius-md)',
                      padding: '16px',
                      cursor: 'pointer',
                      background: portfolio.template_id === theme.id ? 'rgba(6, 182, 212, 0.05)' : 'var(--bg-input)',
                      transition: 'border-color 0.2s'
                    }}
                  >
                    <div style={{ fontWeight: '700', fontSize: '1rem', color: portfolio.template_id === theme.id ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>{theme.name}</div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.4' }}>{theme.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSubTab === 'colors' && (
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Color Branding</h3>
              
              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>Quick Palette Presets</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {presets.map(p => (
                    <button
                      key={p.name}
                      onClick={() => setPortfolio(prev => ({ ...prev, color_palette: { ...p } }))}
                      className="btn"
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.8rem',
                        background: 'var(--bg-input)',
                        borderColor: 'var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: p.primary }}></span>
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '10px' }}>
                {[
                  { field: 'primary', label: 'Primary Accent Color' },
                  { field: 'secondary', label: 'Secondary Dark Accent' },
                  { field: 'background', label: 'Website Background Color' },
                  { field: 'text', label: 'Primary Text Color' }
                ].map(c => (
                  <div key={c.field} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{c.label}</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={portfolio.color_palette[c.field] || '#ffffff'}
                        onChange={(e) => setPortfolio(prev => ({
                          ...prev,
                          color_palette: {
                            ...prev.color_palette,
                            [c.field]: e.target.value
                          }
                        }))}
                        style={{ border: 'none', background: 'transparent', width: '40px', height: '40px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        value={portfolio.color_palette[c.field] || ''}
                        onChange={(e) => setPortfolio(prev => ({
                          ...prev,
                          color_palette: {
                            ...prev.color_palette,
                            [c.field]: e.target.value
                          }
                        }))}
                        style={{
                          background: 'var(--bg-input)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--border-radius-md)',
                          padding: '8px 12px',
                          fontSize: '0.9rem',
                          flex: 1
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSubTab === 'pages' && (
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Choose Sections</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Select which pages are active in your portfolio site.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                {[
                  { id: 'home', label: 'Home Banner' },
                  { id: 'about', label: 'About & Skills' },
                  { id: 'projects', label: 'Projects List' },
                  { id: 'experience', label: 'Experience Chronology' },
                  { id: 'contact', label: 'Contact Links' }
                ].map(p => (
                  <label
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--border-radius-md)',
                      background: 'var(--bg-input)',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={portfolio.enabled_pages.includes(p.id)}
                      onChange={() => togglePage(p.id)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{p.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {activeSubTab === 'content' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {portfolio.enabled_pages.includes('home') && (
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-cyan)' }}>Home Section</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Welcome Title</label>
                    <input
                      type="text"
                      value={portfolio.page_content.home?.title || ''}
                      onChange={(e) => updateField('home', 'title', e.target.value)}
                      placeholder="Welcome to my site"
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Subtitle Description</label>
                    <input
                      type="text"
                      value={portfolio.page_content.home?.subtitle || ''}
                      onChange={(e) => updateField('home', 'subtitle', e.target.value)}
                      placeholder="Full-Stack Developer"
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px' }}
                    />
                  </div>
                </div>
              )}

              {portfolio.enabled_pages.includes('about') && (
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-cyan)' }}>About Section</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Bio Description</label>
                    <textarea
                      value={portfolio.page_content.about?.bio || ''}
                      onChange={(e) => updateField('about', 'bio', e.target.value)}
                      rows={5}
                      placeholder="Tell us about yourself..."
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '10px 12px', resize: 'vertical' }}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Skills List</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="FastAPI"
                        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px', flex: 1 }}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                      />
                      <button className="btn" onClick={handleAddSkill} style={{ padding: '8px 16px', background: 'var(--accent-blue)', color: '#fff', borderColor: 'transparent' }}>Add</button>
                    </div>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                      {(portfolio.page_content.about?.skills || []).map(skill => (
                        <span 
                          key={skill} 
                          style={{ 
                            background: 'var(--bg-input)', 
                            border: '1px solid var(--border-color)', 
                            borderRadius: '20px', 
                            padding: '4px 12px', 
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          {skill}
                          <button onClick={() => handleRemoveSkill(skill)} style={{ border: 'none', background: 'transparent', color: 'var(--accent-rose)', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {portfolio.enabled_pages.includes('projects') && (
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-cyan)' }}>Projects List</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(portfolio.page_content.projects || []).map((p, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', background: 'rgba(255,255,255,0.02)' }}>
                        <div>
                          <div style={{ fontWeight: '600' }}>{p.title}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.link || 'No URL'}</div>
                        </div>
                        <button className="btn" onClick={() => handleRemoveProject(idx)} style={{ padding: '2px 8px', fontSize: '0.8rem', color: 'var(--accent-rose)', borderColor: 'var(--accent-rose)', background: 'transparent' }}>
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Add Project</h4>
                    <input
                      type="text"
                      placeholder="Project Name"
                      value={newProject.title}
                      onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px' }}
                    />
                    <input
                      type="text"
                      placeholder="Project Link"
                      value={newProject.link}
                      onChange={(e) => setNewProject(prev => ({ ...prev, link: e.target.value }))}
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px' }}
                    />
                    <textarea
                      placeholder="Write short description..."
                      value={newProject.description}
                      onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px', resize: 'vertical' }}
                    />
                    <button className="btn" onClick={handleAddProject} style={{ background: 'var(--accent-blue)', color: '#fff', borderColor: 'transparent', alignSelf: 'flex-start', padding: '6px 16px' }}>
                      Add Project
                    </button>
                  </div>
                </div>
              )}

              {portfolio.enabled_pages.includes('experience') && (
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-cyan)' }}>Experience Timeline</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(portfolio.page_content.experience || []).map((e, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', background: 'rgba(255,255,255,0.02)' }}>
                        <div>
                          <div style={{ fontWeight: '600' }}>{e.role} at {e.company}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{e.duration}</div>
                        </div>
                        <button className="btn" onClick={() => handleRemoveExperience(idx)} style={{ padding: '2px 8px', fontSize: '0.8rem', color: 'var(--accent-rose)', borderColor: 'var(--accent-rose)', background: 'transparent' }}>
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Add Career milestone</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <input
                        type="text"
                        placeholder="Role"
                        value={newExperience.role}
                        onChange={(e) => setNewExperience(prev => ({ ...prev, role: e.target.value }))}
                        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px' }}
                      />
                      <input
                        type="text"
                        placeholder="Company"
                        value={newExperience.company}
                        onChange={(e) => setNewExperience(prev => ({ ...prev, company: e.target.value }))}
                        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px' }}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Duration (e.g. 2026 - Present)"
                      value={newExperience.duration}
                      onChange={(e) => setNewExperience(prev => ({ ...prev, duration: e.target.value }))}
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px' }}
                    />
                    <textarea
                      placeholder="Job description..."
                      value={newExperience.description}
                      onChange={(e) => setNewExperience(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px', resize: 'vertical' }}
                    />
                    <button className="btn" onClick={handleAddExperience} style={{ background: 'var(--accent-blue)', color: '#fff', borderColor: 'transparent', alignSelf: 'flex-start', padding: '6px 16px' }}>
                      Add Milestone
                    </button>
                  </div>
                </div>
              )}

              {portfolio.enabled_pages.includes('contact') && (
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-cyan)' }}>Contact Links</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Email</label>
                    <input
                      type="email"
                      value={portfolio.page_content.contact?.email || ''}
                      onChange={(e) => updateField('contact', 'email', e.target.value)}
                      placeholder="email@example.com"
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>LinkedIn Profile</label>
                    <input
                      type="text"
                      value={portfolio.page_content.contact?.linkedin || ''}
                      onChange={(e) => updateField('contact', 'linkedin', e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>GitHub Profile</label>
                    <input
                      type="text"
                      value={portfolio.page_content.contact?.github || ''}
                      onChange={(e) => updateField('contact', 'github', e.target.value)}
                      placeholder="https://github.com/username"
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px' }}
                    />
                  </div>
                </div>
              )}

            </div>
          )}

          {activeSubTab === 'launch' && (
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Public URL Settings</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Unique URL Slug</label>
                <input
                  type="text"
                  value={portfolio.username}
                  onChange={(e) => setPortfolio(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="johndoe"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px', fontWeight: 'bold' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>This sets the link slug: {publicUrl}</span>
              </div>
            </div>
          )}

        </div>

        {activeSubTab !== 'launch' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Real-time Live Preview</span>
            <div 
              style={{ 
                border: '1px solid var(--border-color)', 
                borderRadius: 'var(--border-radius-lg)', 
                overflow: 'hidden', 
                background: '#ffffff', 
                height: '520px', 
                boxShadow: 'var(--glow-shadow)' 
              }}
            >
              <iframe
                title="Portfolio live preview"
                srcDoc={generatePreviewHtml(portfolio)}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
            <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Full Desktop Preview</span>
            <div 
              style={{ 
                border: '1px solid var(--border-color)', 
                borderRadius: 'var(--border-radius-lg)', 
                overflow: 'hidden', 
                background: '#ffffff', 
                height: '600px', 
                boxShadow: 'var(--glow-shadow)',
                width: '100%'
              }}
            >
              <iframe
                title="Portfolio live preview full"
                srcDoc={generatePreviewHtml(portfolio)}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const generatePreviewHtml = (p) => {
  const primary = p.color_palette?.primary || '#3b82f6';
  const secondary = p.color_palette?.secondary || '#1e3a8a';
  const background = p.color_palette?.background || '#f8fafc';
  const text = p.color_palette?.text || '#0f172a';
  const templateId = p.template_id || 'modern';
  
  const enabled = p.enabled_pages || [];
  const home = p.page_content?.home || {};
  const about = p.page_content?.about || {};
  const projects = p.page_content?.projects || [];
  const experience = p.page_content?.experience || [];
  const contact = p.page_content?.contact || {};
  const username = p.username || 'user';

  let fontStyles = '';
  let bodyStyles = '';
  let customCss = '';

  if (templateId === 'minimal') {
    fontStyles = `<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Plus+Jakarta+Sans:wght@400;600&display=swap" rel="stylesheet">`;
    bodyStyles = `font-family: 'Plus Jakarta Sans', sans-serif; background-color: ${background}; color: ${text}; line-height: 1.7; padding: 0 20px;`;
    customCss = `
      header { max-width: 650px; margin: 0 auto; padding: 30px 0; border-bottom: 1px solid rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center; }
      .logo { font-family: 'Playfair Display', serif; font-weight: 700; font-size: 1.4rem; color: ${primary}; }
      nav ul { display: flex; list-style: none; gap: 15px; }
      nav ul a { color: ${text}; font-weight: 600; font-size: 0.95rem; text-decoration: none; }
      section { max-width: 650px; margin: 0 auto; padding: 40px 0; border-bottom: 1px solid rgba(0,0,0,0.1); }
      .hero-title { font-family: 'Playfair Display', serif; font-size: 2.2rem; font-weight: 700; color: ${primary}; margin-bottom: 15px; }
      .section-title { font-family: 'Playfair Display', serif; font-size: 1.5rem; color: ${primary}; margin-bottom: 20px; }
      .skill-list { list-style: square; padding-left: 20px; margin-top: 10px; }
      .project-item { margin-bottom: 25px; }
      .project-header { display: flex; justify-content: space-between; font-family: 'Playfair Display', serif; font-weight: 700; }
      .experience-item { margin-bottom: 25px; }
      .experience-header { display: flex; justify-content: space-between; font-weight: 700; }
    `;
  } else if (templateId === 'creative') {
    fontStyles = `<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet">`;
    bodyStyles = `font-family: 'Space Grotesk', sans-serif; background-color: ${background}; color: ${text}; line-height: 1.6;`;
    customCss = `
      header { padding: 20px; display: flex; justify-content: space-between; align-items: center; max-width: 800px; margin: 0 auto; border-bottom: 2px dashed rgba(255,255,255,0.1); }
      .logo { font-weight: 700; font-size: 1.3rem; background: linear-gradient(135deg, ${primary}, ${secondary}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      nav ul { display: flex; list-style: none; gap: 15px; }
      nav ul a { color: ${text}; text-decoration: none; font-weight: 600; font-size: 0.85rem; }
      section { max-width: 800px; margin: 0 auto; padding: 50px 20px; }
      .hero-title { font-size: 2.8rem; font-weight: 700; background: linear-gradient(135deg, ${primary}, ${secondary}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 15px; }
      .section-title { font-size: 1.8rem; font-weight: 700; margin-bottom: 30px; display: flex; align-items: center; gap: 10px; }
      .section-title::after { content: ''; flex: 1; height: 2px; background: linear-gradient(90deg, ${primary}, transparent); }
      .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 20px; }
      .skill-chip { display: inline-block; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 4px 10px; border-radius: 4px; margin: 4px; font-size: 0.85rem; }
      .project-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 15px; }
      .project-card { border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 15px; background: rgba(255,255,255,0.03); }
      .experience-card { border-left: 3px solid ${primary}; padding-left: 15px; margin-bottom: 20px; }
    `;
  } else { // modern (default)
    fontStyles = `<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">`;
    bodyStyles = `font-family: 'Outfit', sans-serif; background-color: ${background}; color: ${text}; line-height: 1.6; padding-bottom: 40px;`;
    customCss = `
      header { position: sticky; top: 0; background: rgba(255,255,255,0.9); backdrop-filter: blur(8px); border-bottom: 1px solid rgba(0,0,0,0.08); }
      .nav-container { max-width: 800px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; }
      .logo { font-weight: 800; font-size: 1.3rem; color: ${primary}; }
      nav ul { display: flex; list-style: none; gap: 15px; }
      nav ul a { color: ${text}; font-weight: 600; text-decoration: none; font-size: 0.9rem; }
      section { max-width: 800px; margin: 0 auto; padding: 50px 20px; }
      .hero-section { text-align: center; padding: 80px 20px; }
      .hero-title { font-size: 2.8rem; font-weight: 800; background: linear-gradient(135deg, ${primary}, ${secondary}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 10px; }
      .hero-subtitle { font-size: 1.2rem; font-weight: 300; opacity: 0.8; margin-bottom: 20px; }
      .btn { display: inline-block; background: ${primary}; color: #fff; padding: 10px 24px; border-radius: 20px; font-weight: 600; text-decoration: none; font-size: 0.9rem; }
      .section-title { font-size: 1.8rem; font-weight: 800; margin-bottom: 25px; position: relative; padding-bottom: 8px; }
      .section-title::after { content: ''; position: absolute; left: 0; bottom: 0; width: 40px; height: 3px; background: ${primary}; }
      .card { background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
      .skill-tag { display: inline-block; background: rgba(0,0,0,0.04); padding: 4px 10px; border-radius: 12px; margin: 4px; font-size: 0.85rem; font-weight: 600; }
      .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; }
      .experience-item { border-left: 2px solid ${primary}; padding-left: 15px; margin-bottom: 20px; }
    `;
  }

  let sectionsHtml = '';
  
  if (enabled.includes('home')) {
    sectionsHtml += `
      <section id="home" class="hero-section">
        <h1 class="hero-title">${home.title || 'Welcome'}</h1>
        <p class="hero-subtitle">${home.subtitle || ''}</p>
        ${enabled.includes('contact') ? `<a href="#contact" class="btn">Get In Touch</a>` : ''}
      </section>
    `;
  }

  if (enabled.includes('about')) {
    const skillsHtml = (about.skills || []).map(s => `<span class="${templateId === 'creative' ? 'skill-chip' : 'skill-tag'}">${s}</span>`).join('');
    sectionsHtml += `
      <section id="about">
        <h2 class="section-title">About Me</h2>
        <div class="card">
          <p>${about.bio || 'No bio compiled yet.'}</p>
          ${skillsHtml ? `<h3 style="margin-top: 20px; margin-bottom: 10px; font-size: 1rem; font-weight: 600;">Skills</h3><div style="margin-top: 10px;">${skillsHtml}</div>` : ''}
        </div>
      </section>
    `;
  }

  if (enabled.includes('projects')) {
    const projsHtml = projects.map(p => `
      <div class="${templateId === 'minimal' ? 'project-item' : 'card project-card'}">
        <div class="project-header">
          <span class="project-title" style="font-weight: 700;">${p.title || 'Unnamed Project'}</span>
          ${p.link ? `<a href="${p.link}" target="_blank" class="project-link">Link &rarr;</a>` : ''}
        </div>
        <p style="margin-top: 8px; opacity: 0.8; font-size: 0.9rem;">${p.description || ''}</p>
      </div>
    `).join('');
    sectionsHtml += `
      <section id="projects">
        <h2 class="section-title">Projects</h2>
        <div class="${templateId === 'minimal' ? '' : 'grid'}">
          ${projsHtml || '<p>No projects listed yet.</p>'}
        </div>
      </section>
    `;
  }

  if (enabled.includes('experience')) {
    const expHtml = experience.map(e => `
      <div class="${templateId === 'minimal' ? 'experience-item' : 'experience-card'}" style="margin-bottom: 20px;">
        <div class="experience-header" style="display: flex; justify-content: space-between;">
          <span style="font-weight: 700;">${e.role} at <span style="color: ${primary};">${e.company}</span></span>
          <span style="font-size: 0.85rem; opacity: 0.75;">${e.duration}</span>
        </div>
        <p style="margin-top: 6px; opacity: 0.8; font-size: 0.9rem;">${e.description}</p>
      </div>
    `).join('');
    sectionsHtml += `
      <section id="experience">
        <h2 class="section-title">Experience</h2>
        <div>
          ${expHtml || '<p>No experience history added.</p>'}
        </div>
      </section>
    `;
  }

  if (enabled.includes('contact')) {
    sectionsHtml += `
      <section id="contact" style="border-bottom: none;">
        <h2 class="section-title">Contact</h2>
        <p>Connect with me:</p>
        <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 15px; max-width: 350px;">
          ${contact.email ? `<div class="card" style="padding: 10px 15px;">✉️ ${contact.email}</div>` : ''}
          ${contact.linkedin ? `<div class="card" style="padding: 10px 15px;">🔗 <a href="${contact.linkedin}" target="_blank">LinkedIn Profile</a></div>` : ''}
          ${contact.github ? `<div class="card" style="padding: 10px 15px;">💻 <a href="${contact.github}" target="_blank">GitHub Profile</a></div>` : ''}
        </div>
      </section>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${home.title || 'Portfolio'}</title>
      ${fontStyles}
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { ${bodyStyles} }
        a { color: ${primary}; text-decoration: none; }
        a:hover { text-decoration: underline; }
        ${customCss}
      </style>
    </head>
    <body>
      <header>
        <div class="nav-container" style="display: flex; justify-content: space-between; max-width: 800px; margin: 0 auto; padding: 15px 20px; align-items: center;">
          <div class="logo">${username.toUpperCase()}</div>
          <nav>
            <ul style="display: flex; list-style: none; gap: 15px;">
              ${enabled.map(page => `<li><a href="#${page}">${page.toUpperCase()}</a></li>`).join('')}
            </ul>
          </nav>
        </div>
      </header>
      ${sectionsHtml}
      <footer style="text-align: center; padding: 30px; font-size: 0.8rem; opacity: 0.6; border-top: 1px solid rgba(0,0,0,0.06); max-width: 800px; margin: 0 auto;">
        &copy; 2026 ${username.toUpperCase()}. Built with Academy Portfolios.
      </footer>
    </body>
    </html>
  `;
};

function GeoAttendancePanel({ user }) {
  const [tab, setTab] = React.useState(user.role === 'student' ? 'mark' : 'records');
  const [centers, setCenters] = React.useState([]);
  const [studentCenter, setStudentCenter] = React.useState(null);
  const [students, setStudents] = React.useState([]);
  const [records, setRecords] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  // Form states
  const [newCenter, setNewCenter] = React.useState({ name: '', latitude: '', longitude: '', radius_meters: 150, open_time: '09:30', close_time: '17:30', late_time: '11:00' });
  const [editingCenter, setEditingCenter] = React.useState(null);
  const [assignPayload, setAssignPayload] = React.useState({ user_id: '', center_id: '' });
  const [correctPayload, setCorrectPayload] = React.useState({ record_id: '', status: 'PRESENT', reason: '' });
  const [showCorrectModal, setShowCorrectModal] = React.useState(false);
  const [selectedUserIds, setSelectedUserIds] = React.useState([]);

  // Filter states
  const [filterDate, setFilterDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [filterCenterId, setFilterCenterId] = React.useState('');
  const [filterBatchId, setFilterBatchId] = React.useState('');

  // Geolocation states for student
  const [userCoords, setUserCoords] = React.useState(null);
  const [gpsAccuracy, setGpsAccuracy] = React.useState(null);
  const [calculatedDistance, setCalculatedDistance] = React.useState(null);
  const [fetchingLocation, setFetchingLocation] = React.useState(false);
  const [marking, setMarking] = React.useState(false);
  const [hasMarkedToday, setHasMarkedToday] = React.useState(false);

  React.useEffect(() => {
    if (user.role === 'student') {
      fetchStudentCenter();
      fetchStudentHistory();
    } else {
      fetchCenters();
      fetchRecords();
      if (['head', 'associate'].includes(user.role)) {
        fetchStudents();
      }
    }
  }, [tab, filterDate, filterCenterId, filterBatchId]);

  const fetchCenters = async () => {
    try {
      setLoading(true);
      const list = await api.geoAttendance.getCenters();
      setCenters(list);
    } catch (err) {
      setError(err.message || 'Failed to fetch centers.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentCenter = async () => {
    try {
      setLoading(true);
      const center = await api.geoAttendance.getStudentCenter();
      setStudentCenter(center);
    } catch (err) {
      // 404 is expected if not assigned
      setStudentCenter(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      // Associate lists students for their center (unassigned or assigned)
      const targetCenter = user.role === 'associate' ? user.center_id : filterCenterId;
      const list = await api.geoAttendance.getStudents(targetCenter);
      setStudents(list);
    } catch (err) {
      setError(err.message || 'Failed to fetch students.');
    }
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const centerFilter = user.role === 'associate' ? user.center_id : filterCenterId;
      const list = await api.geoAttendance.getRecords(filterDate, centerFilter, filterBatchId);
      setRecords(list);
    } catch (err) {
      setError(err.message || 'Failed to fetch logs.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentHistory = async () => {
    try {
      setLoading(true);
      const list = await api.geoAttendance.getHistory();
      setRecords(list);
      
      // Check if student checked in today
      const todayStr = new Date().toISOString().split('T')[0];
      const markedToday = list.some(r => r.date === todayStr);
      setHasMarkedToday(markedToday);
    } catch (err) {
      setError(err.message || 'Failed to fetch history.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCenter = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      await api.geoAttendance.createCenter(newCenter);
      setSuccess('Physical center configured successfully!');
      setNewCenter({ name: '', latitude: '', longitude: '', radius_meters: 150, open_time: '09:30', close_time: '17:30', late_time: '11:00' });
      fetchCenters();
    } catch (err) {
      setError(err.message || 'Failed to create center.');
    }
  };

  const handleUpdateCenter = async (e) => {
    e.preventDefault();
    if (!editingCenter) return;
    try {
      setError('');
      setSuccess('');
      await api.geoAttendance.updateCenter(editingCenter.id, editingCenter);
      setSuccess('Center updated successfully.');
      setEditingCenter(null);
      fetchCenters();
    } catch (err) {
      setError(err.message || 'Failed to update center.');
    }
  };

  const handleDeleteCenter = async (centerId) => {
    if (!window.confirm('Are you sure you want to delete this training center and clear all user mappings?')) return;
    try {
      setError('');
      setSuccess('');
      await api.geoAttendance.deleteCenter(centerId);
      setSuccess('Center deleted successfully.');
      fetchCenters();
    } catch (err) {
      setError(err.message || 'Failed to delete center.');
    }
  };

  const handleAssignCenter = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      const targetCenter = user.role === 'associate' ? user.center_id : assignPayload.center_id;
      
      if (selectedUserIds.length > 0) {
        await api.geoAttendance.assignCenterBulk({
          user_ids: selectedUserIds,
          center_id: targetCenter || null
        });
        setSuccess(`Successfully mapped ${selectedUserIds.length} users to training center!`);
        setSelectedUserIds([]);
      } else {
        await api.geoAttendance.assignCenter({
          user_id: assignPayload.user_id,
          center_id: targetCenter || null
        });
        setSuccess('Student mapped to training center successfully!');
      }
      
      setAssignPayload({ user_id: '', center_id: '' });
      fetchStudents();
    } catch (err) {
      setError(err.message || 'Failed to assign center.');
    }
  };

  const handleCorrectRecord = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      await api.geoAttendance.correctRecord(correctPayload.record_id, {
        status: correctPayload.status,
        reason: correctPayload.reason
      });
      setSuccess('Attendance log updated with manual audit trail.');
      setShowCorrectModal(false);
      setCorrectPayload({ record_id: '', status: 'PRESENT', reason: '' });
      fetchRecords();
    } catch (err) {
      setError(err.message || 'Failed to correct record.');
    }
  };

  // Haversine Distance computation helper in JS
  const calculateDistanceJS = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setFetchingLocation(true);
    setError('');
    setSuccess('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setUserCoords({ latitude, longitude });
        setGpsAccuracy(accuracy);
        setFetchingLocation(false);
        
        if (studentCenter) {
          const dist = calculateDistanceJS(
            latitude, longitude,
            studentCenter.latitude, studentCenter.longitude
          );
          setCalculatedDistance(dist);
        }
      },
      (err) => {
        setError(`Failed to retrieve your location: ${err.message}. Please verify device location permissions are enabled.`);
        setFetchingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const submitAttendance = async () => {
    if (!userCoords) return;
    try {
      setMarking(true);
      setError('');
      setSuccess('');
      await api.geoAttendance.markAttendance({
        latitude: userCoords.latitude,
        longitude: userCoords.longitude,
        gps_accuracy: gpsAccuracy
      });
      setSuccess('Your attendance has been marked successfully!');
      fetchStudentHistory();
    } catch (err) {
      setError(err.message || 'Failed to mark attendance.');
    } finally {
      setMarking(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '20px 0' }}>
      <div>
        <h2 className="title-gradient" style={{ fontSize: '1.8rem', fontWeight: '800' }}>Geo-Fenced Attendance</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Real-time GPS boundary verification for centers. Attendance open 9:30 AM to 5:30 PM.
        </p>
      </div>

      {error && <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid var(--accent-rose)', color: 'var(--accent-rose)', padding: '12px 16px', borderRadius: 'var(--border-radius-md)' }}>{error}</div>}
      {success && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid var(--accent-emerald)', color: 'var(--accent-emerald)', padding: '12px 16px', borderRadius: 'var(--border-radius-md)' }}>{success}</div>}

      {/* Tabs Row */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        {user.role === 'student' && (
          <button 
            onClick={() => setTab('mark')}
            style={{
              padding: '8px 16px',
              background: tab === 'mark' ? 'var(--bg-card)' : 'transparent',
              border: '1px solid',
              borderColor: tab === 'mark' ? 'var(--border-color-hover)' : 'transparent',
              borderRadius: 'var(--border-radius-md)',
              color: tab === 'mark' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Mark Check-In
          </button>
        )}
        {['head', 'associate', 'trainer'].includes(user.role) && (
          <button 
            onClick={() => setTab('records')}
            style={{
              padding: '8px 16px',
              background: tab === 'records' ? 'var(--bg-card)' : 'transparent',
              border: '1px solid',
              borderColor: tab === 'records' ? 'var(--border-color-hover)' : 'transparent',
              borderRadius: 'var(--border-radius-md)',
              color: tab === 'records' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Attendance Logs
          </button>
        )}
        {['head', 'associate'].includes(user.role) && (
          <button 
            onClick={() => setTab('assignments')}
            style={{
              padding: '8px 16px',
              background: tab === 'assignments' ? 'var(--bg-card)' : 'transparent',
              border: '1px solid',
              borderColor: tab === 'assignments' ? 'var(--border-color-hover)' : 'transparent',
              borderRadius: 'var(--border-radius-md)',
              color: tab === 'assignments' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Student Mappings
          </button>
        )}
        {user.role === 'head' && (
          <button 
            onClick={() => setTab('centers')}
            style={{
              padding: '8px 16px',
              background: tab === 'centers' ? 'var(--bg-card)' : 'transparent',
              border: '1px solid',
              borderColor: tab === 'centers' ? 'var(--border-color-hover)' : 'transparent',
              borderRadius: 'var(--border-radius-md)',
              color: tab === 'centers' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Manage Centers
          </button>
        )}
      </div>

      {/* 1. Student Mark Attendance View */}
      {tab === 'mark' && user.role === 'student' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Center Boundary Check</h3>
            
            {!studentCenter ? (
              <div style={{ padding: '20px', border: '1px dashed var(--accent-rose)', borderRadius: 'var(--border-radius-md)', background: 'rgba(244,63,94,0.02)', textAlign: 'center' }}>
                <p style={{ color: 'var(--accent-rose)', fontWeight: '600' }}>No physical center has been assigned to your account.</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>Please contact your Area Head or coordinator to configure your center details.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '16px' }}>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--accent-cyan)' }}>{studentCenter.name}</div>
                  <div style={{ display: 'flex', gap: '20px', marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <div>Latitude: <strong>{studentCenter.latitude}</strong></div>
                    <div>Longitude: <strong>{studentCenter.longitude}</strong></div>
                    <div>Radius: <strong>{studentCenter.radius_meters}m</strong></div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    className="btn" 
                    onClick={requestLocation} 
                    disabled={fetchingLocation || hasMarkedToday}
                    style={{ background: 'var(--accent-indigo)', borderColor: 'transparent', color: '#ffffff', padding: '10px 20px' }}
                  >
                    {fetchingLocation ? 'Locating...' : 'Get Current Location'}
                  </button>
                  
                  <button
                    className="btn"
                    onClick={submitAttendance}
                    disabled={marking || !userCoords || (calculatedDistance !== null && calculatedDistance > studentCenter.radius_meters) || hasMarkedToday}
                    style={{
                      background: !userCoords || (calculatedDistance !== null && calculatedDistance > studentCenter.radius_meters) || hasMarkedToday ? 'transparent' : 'var(--accent-emerald)',
                      borderColor: !userCoords || (calculatedDistance !== null && calculatedDistance > studentCenter.radius_meters) || hasMarkedToday ? 'var(--border-color)' : 'transparent',
                      color: !userCoords || (calculatedDistance !== null && calculatedDistance > studentCenter.radius_meters) || hasMarkedToday ? 'var(--text-muted)' : '#ffffff',
                      padding: '10px 20px'
                    }}
                  >
                    {marking ? 'Marking...' : 'Mark Attendance'}
                  </button>
                </div>

                {userCoords && (
                  <div className="glass-card" style={{ marginTop: '10px', borderColor: calculatedDistance <= studentCenter.radius_meters ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                    <div style={{ fontWeight: '700', marginBottom: '10px' }}>Your Geolocation Status:</div>
                    <ul style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '6px', listStyle: 'none' }}>
                      <li>Latitude: <strong>{userCoords.latitude}</strong></li>
                      <li>Longitude: <strong>{userCoords.longitude}</strong></li>
                      <li>GPS Accuracy: <strong>{gpsAccuracy ? `${Math.round(gpsAccuracy)} meters` : 'N/A'}</strong></li>
                      <li>Distance from Center: <strong>{calculatedDistance !== null ? `${Math.round(calculatedDistance)} meters` : 'Calculating...'}</strong></li>
                    </ul>

                    {calculatedDistance !== null && (
                      <div style={{ marginTop: '15px', padding: '12px', borderRadius: 'var(--border-radius-md)', fontWeight: '600', fontSize: '0.9rem',
                        background: calculatedDistance <= studentCenter.radius_meters ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
                        color: calculatedDistance <= studentCenter.radius_meters ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                      }}>
                        {calculatedDistance <= studentCenter.radius_meters 
                          ? '✓ You are within the attendance area. Mark Attendance button enabled.' 
                          : '✗ You are outside the attendance area. Please move within 150 meters of your center.'
                        }
                      </div>
                    )}
                  </div>
                )}

                {hasMarkedToday && (
                  <div style={{ padding: '12px', border: '1px solid var(--accent-emerald)', borderRadius: 'var(--border-radius-md)', background: 'rgba(16,185,129,0.02)', color: 'var(--accent-emerald)', fontWeight: '600', textAlign: 'center' }}>
                    ✓ You have checked in for today!
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>My Check-In History</h3>
            
            <div style={{ overflowY: 'auto', maxHeight: '400px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {records.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>No attendance history logs found.</div>
              ) : (
                records.map(r => (
                  <div key={r.id} style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex-between">
                      <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{r.date}</span>
                      <span style={{ 
                        padding: '2px 8px', 
                        borderRadius: '12px', 
                        fontSize: '0.75rem', 
                        fontWeight: 'bold',
                        background: r.status === 'PRESENT' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                        color: r.status === 'PRESENT' ? 'var(--accent-emerald)' : 'var(--accent-amber)'
                      }}>{r.status}</span>
                    </div>
                    <div style={{ marginTop: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Marked: <strong>{new Date(r.marked_at).toLocaleTimeString()}</strong></span>
                      <span>Distance: <strong>{Math.round(r.distance)}m</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Attendance Logs View (Trainer/Associate/Head) */}
      {tab === 'records' && ['head', 'associate', 'trainer'].includes(user.role) && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Select Date</label>
              <input 
                type="date" 
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px' }}
              />
            </div>
            
            {user.role === 'head' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Filter Center</label>
                <select 
                  value={filterCenterId}
                  onChange={(e) => setFilterCenterId(e.target.value)}
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px', minWidth: '150px' }}
                >
                  <option value="">All Centers</option>
                  {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Batch Slug / ID</label>
              <input 
                type="text" 
                placeholder="All Batches"
                value={filterBatchId}
                onChange={(e) => setFilterBatchId(e.target.value)}
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px' }}
              />
            </div>
            
            <button className="btn" onClick={fetchRecords} style={{ alignSelf: 'flex-end', padding: '8px 16px', background: 'transparent', borderColor: 'var(--border-color-hover)' }}>Refresh</button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px' }}>Student</th>
                  <th style={{ padding: '12px' }}>Center</th>
                  <th style={{ padding: '12px' }}>Batch</th>
                  <th style={{ padding: '12px' }}>Marked Time (IST)</th>
                  <th style={{ padding: '12px' }}>Distance</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px' }}>Verification</th>
                  {['head', 'associate'].includes(user.role) && <th style={{ padding: '12px' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No attendance records found for this date.</td>
                  </tr>
                ) : (
                  records.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '12px' }}>
                        <div>{r.student_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.student_email}</div>
                      </td>
                      <td style={{ padding: '12px' }}>{r.center_name}</td>
                      <td style={{ padding: '12px' }}>{r.batch_id || 'N/A'}</td>
                      <td style={{ padding: '12px' }}>{new Date(r.marked_at).toLocaleTimeString()}</td>
                      <td style={{ padding: '12px' }}>{Math.round(r.distance)}m</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          background: r.status === 'PRESENT' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                          color: r.status === 'PRESENT' ? 'var(--accent-emerald)' : 'var(--accent-amber)'
                        }}>{r.status}</span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontSize: '0.8rem', color: r.verification_status === 'verified' ? 'var(--accent-emerald)' : 'var(--accent-cyan)' }}>
                          {r.verification_status === 'verified' ? 'GPS Checked' : 'Manually Adjusted'}
                        </span>
                      </td>
                      {['head', 'associate'].includes(user.role) && (
                        <td style={{ padding: '12px' }}>
                          <button 
                            className="btn" 
                            style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'transparent', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}
                            onClick={() => {
                              setCorrectPayload({ record_id: r.id, status: r.status, reason: '' });
                              setShowCorrectModal(true);
                            }}
                          >
                            Correct Log
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Student Center Assignments View */}
      {tab === 'assignments' && ['head', 'associate'].includes(user.role) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Student Assignments</h3>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              {user.role === 'head' && (
                <select 
                  value={filterCenterId}
                  onChange={(e) => setFilterCenterId(e.target.value)}
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px', flex: 1 }}
                >
                  <option value="">All Centers</option>
                  {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
              <button className="btn" onClick={fetchStudents} style={{ padding: '8px 16px' }}>Filter</button>
            </div>

            <div style={{ overflowY: 'auto', maxHeight: '450px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '8px', width: '40px', textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={students.length > 0 && students.every(s => selectedUserIds.includes(s.id))}
                        onChange={() => {
                          const visibleIds = students.map(s => s.id);
                          const isAllSelected = visibleIds.every(id => selectedUserIds.includes(id));
                          if (isAllSelected) {
                            setSelectedUserIds(prev => prev.filter(id => !visibleIds.includes(id)));
                          } else {
                            setSelectedUserIds(prev => {
                              const next = [...prev];
                              visibleIds.forEach(id => {
                                if (!next.includes(id)) next.push(id);
                              });
                              return next;
                            });
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                    <th style={{ padding: '8px' }}>User Details</th>
                    <th style={{ padding: '8px' }}>Role</th>
                    <th style={{ padding: '8px' }}>Current Center ID</th>
                    <th style={{ padding: '8px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '20px', textAlign: 'center' }}>No users found.</td>
                    </tr>
                  ) : (
                    students.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.01)', background: selectedUserIds.includes(s.id) ? 'rgba(34,197,94,0.02)' : 'transparent' }}>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <input 
                            type="checkbox" 
                            checked={selectedUserIds.includes(s.id)}
                            onChange={() => {
                              setSelectedUserIds(prev => 
                                prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                              );
                            }}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ padding: '8px' }}>
                          <div><strong>{s.name}</strong></div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{s.email}</div>
                        </td>
                        <td style={{ padding: '8px', textTransform: 'capitalize' }}>{s.role}</td>
                        <td style={{ padding: '8px' }}>{s.center_id ? centers.find(c => c.id === s.center_id)?.name || s.center_id : <span style={{ color: 'var(--accent-rose)' }}>Unmapped</span>}</td>
                        <td style={{ padding: '8px' }}>
                          <button 
                            className="btn"
                            style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                            onClick={() => {
                              setAssignPayload({ user_id: s.id, center_id: s.center_id || '' });
                              setSelectedUserIds([]); // clear bulk selection if single select clicked
                            }}
                          >
                            Select
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Configure Mapping</h3>
            
            <form onSubmit={handleAssignCenter} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {selectedUserIds.length > 0 ? 'Selected Users (Bulk Assign)' : 'Selected User ID'}
                </label>
                {selectedUserIds.length > 0 ? (
                  <div style={{ 
                    background: 'rgba(16,185,129,0.05)', 
                    border: '1px dashed var(--accent-emerald)', 
                    color: 'var(--accent-emerald)', 
                    borderRadius: 'var(--border-radius-md)', 
                    padding: '12px 16px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>{selectedUserIds.length} users selected</span>
                    <button 
                      type="button" 
                      onClick={() => setSelectedUserIds([])}
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        color: 'var(--accent-rose)', 
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}
                    >
                      Clear Selection
                    </button>
                  </div>
                ) : (
                  <input 
                    type="text" 
                    value={assignPayload.user_id}
                    onChange={(e) => setAssignPayload(prev => ({ ...prev, user_id: e.target.value }))}
                    required 
                    placeholder="Paste User Object ID"
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px' }}
                  />
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Assign Center</label>
                {user.role === 'associate' ? (
                  <input 
                    type="text" 
                    value={centers.find(c => c.id === user.center_id)?.name || 'My Associate Center'} 
                    disabled 
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px', opacity: 0.7 }}
                  />
                ) : (
                  <select 
                    value={assignPayload.center_id}
                    onChange={(e) => setAssignPayload(prev => ({ ...prev, center_id: e.target.value }))}
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px' }}
                  >
                    <option value="">-- Remove center mapping --</option>
                    {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>

              <button 
                type="submit" 
                className="btn" 
                disabled={!assignPayload.user_id && selectedUserIds.length === 0}
                style={{ background: 'var(--accent-blue)', color: '#fff', borderColor: 'transparent', alignSelf: 'flex-start', padding: '8px 20px' }}
              >
                Save Assignment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. Center Geofences configuration (Head Admin Only) */}
      {tab === 'centers' && user.role === 'head' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Physical Centers</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {centers.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>No training centers configured yet.</div>
              ) : (
                centers.map(c => (
                  <div key={c.id} style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex-between">
                      <strong style={{ fontSize: '1.05rem', color: 'var(--accent-cyan)' }}>{c.name}</strong>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => setEditingCenter(c)}>Edit</button>
                        <button className="btn btn-danger" style={{ padding: '2px 8px', fontSize: '0.75rem', background: 'var(--accent-rose)', color: '#fff', borderColor: 'transparent' }} onClick={() => handleDeleteCenter(c.id)}>Delete</button>
                      </div>
                    </div>
                    <div style={{ marginTop: '10px', display: 'flex', gap: '15px', fontSize: '0.85rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                      <span>Lat: <strong>{c.latitude}</strong></span>
                      <span>Lon: <strong>{c.longitude}</strong></span>
                      <span>Boundary: <strong>{c.radius_meters}m</strong></span>
                      <span>Open: <strong>{c.open_time || '09:30'}</strong></span>
                      <span>Close: <strong>{c.close_time || '17:30'}</strong></span>
                      <span>Late: <strong>{c.late_time || '11:00'}</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>
              {editingCenter ? 'Edit Training Center' : 'Create New Center'}
            </h3>
            
            {editingCenter ? (
              <form onSubmit={handleUpdateCenter} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem' }}>Center Name</label>
                  <input 
                    type="text" 
                    value={editingCenter.name}
                    onChange={(e) => setEditingCenter(prev => ({ ...prev, name: e.target.value }))}
                    required 
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem' }}>Latitude</label>
                    <input 
                      type="number" 
                      step="0.000001"
                      value={editingCenter.latitude}
                      onChange={(e) => setEditingCenter(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                      required 
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem' }}>Longitude</label>
                    <input 
                      type="number" 
                      step="0.000001"
                      value={editingCenter.longitude}
                      onChange={(e) => setEditingCenter(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                      required 
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem' }}>Radius (Meters)</label>
                  <input 
                    type="number" 
                    value={editingCenter.radius_meters}
                    onChange={(e) => setEditingCenter(prev => ({ ...prev, radius_meters: parseFloat(e.target.value) || 150 }))}
                    required 
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem' }}>Open Time</label>
                    <input 
                      type="time" 
                      value={editingCenter.open_time || '09:30'}
                      onChange={(e) => setEditingCenter(prev => ({ ...prev, open_time: e.target.value }))}
                      required 
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem' }}>Close Time</label>
                    <input 
                      type="time" 
                      value={editingCenter.close_time || '17:30'}
                      onChange={(e) => setEditingCenter(prev => ({ ...prev, close_time: e.target.value }))}
                      required 
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem' }}>Late Time</label>
                    <input 
                      type="time" 
                      value={editingCenter.late_time || '11:00'}
                      onChange={(e) => setEditingCenter(prev => ({ ...prev, late_time: e.target.value }))}
                      required 
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn" style={{ background: 'var(--accent-emerald)', color: '#fff', borderColor: 'transparent', padding: '8px 20px' }}>Save Changes</button>
                  <button type="button" className="btn btn-secondary" style={{ padding: '8px 20px' }} onClick={() => setEditingCenter(null)}>Cancel</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCreateCenter} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem' }}>Center Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Hyderabad Center"
                    value={newCenter.name}
                    onChange={(e) => setNewCenter(prev => ({ ...prev, name: e.target.value }))}
                    required 
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem' }}>Latitude</label>
                    <input 
                      type="number" 
                      step="0.000001"
                      placeholder="17.448"
                      value={newCenter.latitude}
                      onChange={(e) => setNewCenter(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                      required 
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem' }}>Longitude</label>
                    <input 
                      type="number" 
                      step="0.000001"
                      placeholder="78.374"
                      value={newCenter.longitude}
                      onChange={(e) => setNewCenter(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                      required 
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem' }}>Geofence Radius (Meters)</label>
                  <input 
                    type="number" 
                    value={newCenter.radius_meters}
                    onChange={(e) => setNewCenter(prev => ({ ...prev, radius_meters: parseFloat(e.target.value) || 150 }))}
                    required 
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem' }}>Open Time</label>
                    <input 
                      type="time" 
                      value={newCenter.open_time}
                      onChange={(e) => setNewCenter(prev => ({ ...prev, open_time: e.target.value }))}
                      required 
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem' }}>Close Time</label>
                    <input 
                      type="time" 
                      value={newCenter.close_time}
                      onChange={(e) => setNewCenter(prev => ({ ...prev, close_time: e.target.value }))}
                      required 
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem' }}>Late Time</label>
                    <input 
                      type="time" 
                      value={newCenter.late_time}
                      onChange={(e) => setNewCenter(prev => ({ ...prev, late_time: e.target.value }))}
                      required 
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px' }}
                    />
                  </div>
                </div>
                <button type="submit" className="btn" style={{ background: 'var(--accent-blue)', color: '#fff', borderColor: 'transparent', alignSelf: 'flex-start', padding: '8px 20px' }}>
                  Create Center
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Manual correction Modal */}
      {showCorrectModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Manual Attendance Adjustment</h3>
            
            <form onSubmit={handleCorrectRecord} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Status</label>
                <select 
                  value={correctPayload.status}
                  onChange={(e) => setCorrectPayload(prev => ({ ...prev, status: e.target.value }))}
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px' }}
                >
                  <option value="PRESENT">PRESENT</option>
                  <option value="LATE">LATE</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Correction Reason (Mandatory Audit Note)</label>
                <textarea 
                  value={correctPayload.reason}
                  onChange={(e) => setCorrectPayload(prev => ({ ...prev, reason: e.target.value }))}
                  required 
                  minLength={5}
                  rows={4}
                  placeholder="Explain why this manual adjustment is being saved..."
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '8px 12px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCorrectModal(false)}>Cancel</button>
                <button type="submit" className="btn" style={{ background: 'var(--accent-blue)', color: '#fff', borderColor: 'transparent' }} disabled={correctPayload.reason.length < 5}>Apply Correction</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;



