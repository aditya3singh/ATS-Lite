import { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import AuthPage from './pages/Auth.jsx';
import JobsPage from './pages/Jobs.jsx';
import ResumesPage from './pages/Resumes.jsx';
import MatchPage from './pages/Match.jsx';
import './App.css';

function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      void e; // ignore quota or access errors
    }
  }, [key, value]);
  return [value, setValue];
}

const api = {
  async json(path, opts = {}) {
    const res = await fetch(path, {
      headers: {
        'Content-Type': 'application/json',
        ...(opts.headers || {}),
      },
      ...opts,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }
    return res.json();
  },
  async auth(path, token, opts = {}) {
    return this.json(path, {
      ...(opts || {}),
      headers: {
        ...(opts.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [token, setToken] = usePersistentState('ats_token', '');
  const [jobs, setJobs] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [jobsPage, setJobsPage] = useState(0);
  const [resumesPage, setResumesPage] = useState(0);
  const pageSize = 10;
  const [jobTitle, setJobTitle] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [jobSkills, setJobSkills] = useState('');
  const [matchResumeId, setMatchResumeId] = useState('');
  const [matchJobId, setMatchJobId] = useState('');
  const [matchResult, setMatchResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const isAuthed = useMemo(() => Boolean(token), [token]);

  async function wrap(asyncFn) {
    setError('');
    setLoading(true);
    try {
      await asyncFn();
      setToast('Done');
    } catch (e) {
      setError(e?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function signup() {
    await api.json('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName || null }),
    });
  }

  async function login() {
    const res = await api.json('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(res.access_token);
  }

  async function createJob() {
    const skills = jobSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const job = await api.auth('/jobs/', token, {
      method: 'POST',
      body: JSON.stringify({ title: jobTitle, description: jobDesc, skills }),
    });
    setJobs((prev) => [job, ...prev]);
    setJobTitle('');
    setJobDesc('');
    setJobSkills('');
  }

  const listJobs = useCallback(async () => {
    const skip = jobsPage * pageSize;
    const js = await api.auth(`/jobs/?skip=${skip}&limit=${pageSize}`, token);
    setJobs(js);
  }, [token, jobsPage]);

  async function uploadResume(e) {
    e.preventDefault();
    const file = e.target.elements.file.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/resumes/', {
      method: 'POST',
      body: form,
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(await res.text());
    await listResumes();
    e.target.reset();
  }

  const listResumes = useCallback(async () => {
    const skip = resumesPage * pageSize;
    const rs = await api.auth(`/resumes/?skip=${skip}&limit=${pageSize}`, token);
    setResumes(rs);
  }, [token, resumesPage]);

  const updateJob = useCallback(
    async (jobId, { title, description, skills }) => {
      const skillList = (skills || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const updated = await api.auth(`/jobs/${jobId}`, token, {
        method: 'PUT',
        body: JSON.stringify({ title, description, skills: skillList }),
      });
      setJobs((prev) => prev.map((j) => (j.id === jobId ? updated : j)));
    },
    [token]
  );

  const deleteJob = useCallback(
    async (jobId) => {
      await api.auth(`/jobs/${jobId}`, token, { method: 'DELETE' });
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    },
    [token]
  );

  const deleteResume = useCallback(
    async (resumeId) => {
      await api.auth(`/resumes/${resumeId}`, token, { method: 'DELETE' });
      setResumes((prev) => prev.filter((r) => r.id !== resumeId));
    },
    [token]
  );

  async function doMatch() {
    const r = await api.auth(`/matching/resume/${matchResumeId}/job/${matchJobId}`, token);
    setMatchResult(`Score: ${r.score}%`);
  }

  useEffect(() => {
    if (isAuthed) {
      // lazy load lists on login
      listJobs().catch(() => {});
      listResumes().catch(() => {});
    } else {
      setJobs([]);
      setResumes([]);
    }
  }, [isAuthed, listJobs, listResumes]);

  return (
    <BrowserRouter basename="/ui">
      <div className="container">
        <h1>ATS-lite UI</h1>

      {error ? <div className="alert error">{error}</div> : null}
      {loading ? <div className="alert info">Working...</div> : null}
      {toast && !loading ? (
        <div className="toast" onAnimationEnd={() => setToast('')}>
          {toast}
        </div>
      ) : null}

        <nav className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <Link to="/">Home</Link>
            {isAuthed && (
              <>
                {' '}| <Link to="/jobs">Jobs</Link> | <Link to="/resumes">Resumes</Link> |{' '}
                <Link to="/match">Match</Link>
              </>
            )}
          </div>
          <div>
            {isAuthed ? (
              <button className="link" onClick={() => setToken('')}>Log out</button>
            ) : null}
          </div>
        </nav>

        <Routes>
          <Route
            path="/"
            element={
              isAuthed ? (
                <Navigate to="/jobs" replace />
              ) : (
                <AuthPage
                  loading={loading}
                  onSignup={({ email, password, fullName }) =>
                    wrap(() => api.json('/auth/signup', {
                      method: 'POST',
                      body: JSON.stringify({ email, password, full_name: fullName || null }),
                    }))
                  }
                  onLogin={({ email, password }) =>
                    wrap(async () => {
                      const res = await api.json('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
                      setToken(res.access_token);
                    })
                  }
                />
              )
            }
          />
          <Route
            path="/jobs"
            element={
              isAuthed ? (
                <JobsPage
                  token={token}
                  jobs={jobs}
                  setJobs={setJobs}
                  loading={loading}
                  createJob={({ title, description, skills }) =>
                    wrap(async () => {
                      const skillList = (skills || '').split(',').map((s) => s.trim()).filter(Boolean);
                      const job = await api.auth('/jobs/', token, { method: 'POST', body: JSON.stringify({ title, description, skills: skillList }) });
                      setJobs((prev) => [job, ...prev]);
                    })
                  }
                  listJobs={() => wrap(listJobs)}
                  updateJob={(id, payload) => wrap(() => updateJob(id, payload))}
                  deleteJob={(id) => wrap(() => deleteJob(id))}
                  page={jobsPage}
                  setPage={setJobsPage}
                  pageSize={pageSize}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/resumes"
            element={
              isAuthed ? (
                <ResumesPage
                  token={token}
                  resumes={resumes}
                  listResumes={() => wrap(listResumes)}
                  uploadResume={(e) => wrap(() => uploadResume(e))}
                  deleteResume={(id) => wrap(() => deleteResume(id))}
                  loading={loading}
                  page={resumesPage}
                  setPage={setResumesPage}
                  pageSize={pageSize}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/match"
            element={
              isAuthed ? (
                <MatchPage
                  token={token}
                  matchResumeId={matchResumeId}
                  setMatchResumeId={setMatchResumeId}
                  matchJobId={matchJobId}
                  setMatchJobId={setMatchJobId}
                  doMatch={() => wrap(doMatch)}
                  matchResult={matchResult}
                  loading={loading}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
