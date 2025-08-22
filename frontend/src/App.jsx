import { useCallback, useEffect, useMemo, useState } from 'react';
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
  const [jobTitle, setJobTitle] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [jobSkills, setJobSkills] = useState('');
  const [matchResumeId, setMatchResumeId] = useState('');
  const [matchJobId, setMatchJobId] = useState('');
  const [matchResult, setMatchResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isAuthed = useMemo(() => Boolean(token), [token]);

  async function wrap(asyncFn) {
    setError('');
    setLoading(true);
    try {
      await asyncFn();
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
    const js = await api.auth('/jobs/', token);
    setJobs(js);
  }, [token]);

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
    const rs = await api.auth('/resumes/', token);
    setResumes(rs);
  }, [token]);

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
    <div className="container">
      <h1>ATS-lite UI</h1>

      {error ? <div className="alert error">{error}</div> : null}
      {loading ? <div className="alert info">Working...</div> : null}

      <div className="card">
        <h2>Auth</h2>
        <div className="row">
          <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            placeholder="full name (optional)"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div className="row">
          <button disabled={loading} onClick={() => wrap(signup)}>
            Sign up
          </button>
          <button disabled={loading} onClick={() => wrap(login)}>
            Log in
          </button>
          <span className={`status ${isAuthed ? 'ok' : 'warn'}`}>
            {isAuthed ? 'Authenticated' : 'Not logged in'}
          </span>
          {isAuthed ? (
            <button
              className="link"
              onClick={() => {
                setToken('');
              }}
            >
              Log out
            </button>
          ) : null}
        </div>
      </div>

      <div className="card">
        <h2>Jobs</h2>
        <div className="row">
          <input
            placeholder="title"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
          />
        </div>
        <div className="row">
          <textarea
            placeholder="description"
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
          />
        </div>
        <div className="row">
          <input
            placeholder="skills (comma)"
            value={jobSkills}
            onChange={(e) => setJobSkills(e.target.value)}
          />
        </div>
        <div className="row">
          <button disabled={!isAuthed || loading || !jobTitle} onClick={() => wrap(createJob)}>
            Create Job
          </button>
          <button disabled={!isAuthed || loading} onClick={() => wrap(listJobs)}>
            Refresh Jobs
          </button>
        </div>
        <ul className="list">
          {jobs.map((j) => (
            <li key={j.id}>
              #{j.id} {j.title}
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2>Resumes</h2>
        <form className="row" onSubmit={(e) => wrap(() => uploadResume(e))}>
          <input type="file" name="file" />
          <button disabled={!isAuthed || loading} type="submit">
            Upload
          </button>
          <button disabled={!isAuthed || loading} type="button" onClick={() => wrap(listResumes)}>
            Refresh
          </button>
        </form>
        <ul className="list">
          {resumes.map((r) => (
            <li key={r.id}>
              #{r.id} {r.filename} — parsed: {String(r.parsed)}
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2>Match</h2>
        <div className="row">
          <input
            placeholder="resume id"
            value={matchResumeId}
            onChange={(e) => setMatchResumeId(e.target.value)}
          />
          <input
            placeholder="job id"
            value={matchJobId}
            onChange={(e) => setMatchJobId(e.target.value)}
          />
          <button disabled={!isAuthed || loading} onClick={() => wrap(doMatch)}>
            Score
          </button>
        </div>
        <div className="result">{matchResult}</div>
      </div>
    </div>
  );
}
