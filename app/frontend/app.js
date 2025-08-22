let token = null;

const $ = (id) => document.getElementById(id);

function setAuthHeaders(opts = {}) {
	if (!opts.headers) opts.headers = {};
	if (token) opts.headers['Authorization'] = `Bearer ${token}`;
	return opts;
}

async function signup() {
	const payload = {
		email: $('email').value,
		password: $('password').value,
		full_name: $('full_name').value || null,
	};
	const res = await fetch('/auth/signup', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	});
	if (!res.ok) { alert('Signup failed'); return; }
	const user = await res.json();
	$('whoami').textContent = `Signed up: ${user.email}`;
}

async function login() {
	const payload = { email: $('email').value, password: $('password').value, full_name: $('full_name').value || null };
	const res = await fetch('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
	if (!res.ok) { alert('Login failed'); return; }
	const data = await res.json();
	token = data.access_token;
	const me = await fetch('/auth/me', setAuthHeaders());
	$('whoami').textContent = me.ok ? `Logged in` : 'Auth error';
}

async function createJob() {
	const skills = $('job_skills').value.split(',').map(s => s.trim()).filter(Boolean);
	const payload = { title: $('job_title').value, description: $('job_desc').value, skills };
	const res = await fetch('/jobs/', setAuthHeaders({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }));
	if (!res.ok) { alert('Create job failed'); return; }
	await listJobs();
}

async function listJobs() {
	const res = await fetch('/jobs/', setAuthHeaders());
	const items = await res.json();
	$('jobsList').innerHTML = items.map(j => `<li>#${j.id} ${j.title}</li>`).join('');
}

async function uploadResume() {
	const f = $('resume_file').files[0];
	if (!f) { alert('Pick a file'); return; }
	const form = new FormData();
	form.append('file', f);
	const res = await fetch('/resumes/', setAuthHeaders({ method: 'POST', body: form }));
	if (!res.ok) { alert('Upload failed'); return; }
	await listResumes();
}

async function listResumes() {
	const res = await fetch('/resumes/', setAuthHeaders());
	const items = await res.json();
	$('resumesList').innerHTML = items.map(r => `<li>#${r.id} ${r.filename} - parsed: ${r.parsed}</li>`).join('');
}

async function doMatch() {
	const rid = $('match_resume_id').value;
	const jid = $('match_job_id').value;
	const res = await fetch(`/matching/resume/${rid}/job/${jid}`, setAuthHeaders());
	if (!res.ok) { $('matchResult').textContent = 'Match failed'; return; }
	const data = await res.json();
	$('matchResult').textContent = `Score: ${data.score}%`;
}

$('signupBtn').onclick = signup;
$('loginBtn').onclick = login;
$('createJobBtn').onclick = createJob;
$('listJobsBtn').onclick = listJobs;
$('uploadResumeBtn').onclick = uploadResume;
$('listResumesBtn').onclick = listResumes;
$('matchBtn').onclick = doMatch;



