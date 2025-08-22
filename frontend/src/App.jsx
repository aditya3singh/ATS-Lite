import { useEffect, useState } from 'react'
import './App.css'

const api = {
  async json(path, opts = {}) {
    const res = await fetch(path, { headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) }, ...opts })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async auth(path, token, opts = {}) {
    return this.json(path, { ...(opts || {}), headers: { ...(opts.headers || {}), Authorization: `Bearer ${token}` } })
  },
}

export default function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [token, setToken] = useState('')
  const [jobs, setJobs] = useState([])
  const [resumes, setResumes] = useState([])
  const [jobTitle, setJobTitle] = useState('')
  const [jobDesc, setJobDesc] = useState('')
  const [jobSkills, setJobSkills] = useState('')
  const [matchResumeId, setMatchResumeId] = useState('')
  const [matchJobId, setMatchJobId] = useState('')
  const [matchResult, setMatchResult] = useState('')

  async function signup() {
    await api.json('/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, full_name: fullName || null }) })
  }
  async function login() {
    const res = await api.json('/auth/login', { method: 'POST', body: JSON.stringify({ email, password, full_name: fullName || null }) })
    setToken(res.access_token)
  }
  async function createJob() {
    const skills = jobSkills.split(',').map(s => s.trim()).filter(Boolean)
    const job = await api.auth('/jobs/', token, { method: 'POST', body: JSON.stringify({ title: jobTitle, description: jobDesc, skills }) })
    setJobs([job, ...jobs])
  }
  async function listJobs() {
    const js = await api.auth('/jobs/', token)
    setJobs(js)
  }
  async function uploadResume(e) {
    e.preventDefault()
    const file = e.target.elements.file.files[0]
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/resumes/', { method: 'POST', body: form, headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) throw new Error(await res.text())
    await listResumes()
    e.target.reset()
  }
  async function listResumes() {
    const rs = await api.auth('/resumes/', token)
    setResumes(rs)
  }
  async function doMatch() {
    const r = await api.auth(`/matching/resume/${matchResumeId}/job/${matchJobId}`, token)
    setMatchResult(`Score: ${r.score}%`)
  }

  return (
    <div className="container">
      <h1>ATS-lite UI</h1>
      <div className="card">
        <h2>Auth</h2>
        <div className="row"><input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} /><input type="password" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} /><input placeholder="full name (optional)" value={fullName} onChange={e=>setFullName(e.target.value)} /></div>
        <div className="row"><button onClick={signup}>Sign up</button><button onClick={login}>Log in</button><span>{token ? 'Authenticated' : 'Not logged in'}</span></div>
      </div>

      <div className="card">
        <h2>Jobs</h2>
        <div className="row"><input placeholder="title" value={jobTitle} onChange={e=>setJobTitle(e.target.value)} /></div>
        <div className="row"><textarea placeholder="description" value={jobDesc} onChange={e=>setJobDesc(e.target.value)} /></div>
        <div className="row"><input placeholder="skills (comma)" value={jobSkills} onChange={e=>setJobSkills(e.target.value)} /></div>
        <div className="row"><button onClick={createJob} disabled={!token}>Create Job</button><button onClick={listJobs} disabled={!token}>List Jobs</button></div>
        <ul>{jobs.map(j=> <li key={j.id}>#{j.id} {j.title}</li>)}</ul>
      </div>

      <div className="card">
        <h2>Resumes</h2>
        <form className="row" onSubmit={uploadResume}><input type="file" name="file" /><button disabled={!token} type="submit">Upload</button><button disabled={!token} type="button" onClick={listResumes}>List</button></form>
        <ul>{resumes.map(r=> <li key={r.id}>#{r.id} {r.filename} parsed: {String(r.parsed)}</li>)}</ul>
      </div>

      <div className="card">
        <h2>Match</h2>
        <div className="row"><input placeholder="resume id" value={matchResumeId} onChange={e=>setMatchResumeId(e.target.value)} /><input placeholder="job id" value={matchJobId} onChange={e=>setMatchJobId(e.target.value)} /><button disabled={!token} onClick={doMatch}>Score</button></div>
        <div>{matchResult}</div>
      </div>
    </div>
  )
}
