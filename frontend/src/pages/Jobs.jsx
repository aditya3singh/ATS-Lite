export default function JobsPage({ token, jobs, setJobs, createJob, listJobs, loading }) {
  return (
    <div className="card">
      <h2>Jobs</h2>
      <JobForm onCreate={createJob} loading={loading} />
      <div className="row">
        <button disabled={!token || loading} onClick={listJobs}>Refresh Jobs</button>
      </div>
      <ul className="list">
        {jobs.map((j) => (
          <li key={j.id}>#{j.id} {j.title}</li>
        ))}
      </ul>
    </div>
  );
}

function JobForm({ onCreate, loading }) {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [skills, setSkills] = React.useState('');

  return (
    <>
      <div className="row">
        <input placeholder="title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="row">
        <textarea placeholder="description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="row">
        <input placeholder="skills (comma)" value={skills} onChange={(e) => setSkills(e.target.value)} />
      </div>
      <div className="row">
        <button disabled={loading || !title} onClick={() => onCreate({ title, description, skills })}>Create Job</button>
      </div>
    </>
  );
}


