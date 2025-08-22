import React from 'react';

export default function JobsPage({ token, jobs, setJobs, createJob, listJobs, loading, updateJob, deleteJob, page, setPage, pageSize }) {
  return (
    <div className="card">
      <h2>Jobs</h2>
      <JobForm onCreate={createJob} loading={loading} />
      <div className="row">
        <button disabled={!token || loading} onClick={listJobs}>Refresh Jobs</button>
      </div>
      <ul className="list">
        {jobs.map((j) => (
          <JobRow key={j.id} job={j} onUpdate={updateJob} onDelete={deleteJob} />
        ))}
      </ul>
      <Pagination page={page} setPage={setPage} pageSize={pageSize} disabled={loading} />
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

function JobRow({ job, onUpdate, onDelete }) {
  const [editing, setEditing] = React.useState(false);
  const [title, setTitle] = React.useState(job.title);
  const [description, setDescription] = React.useState(job.description);
  const [skills, setSkills] = React.useState((job.skills || []).join(', '));

  return (
    <li>
      {!editing ? (
        <>
          #{job.id} {job.title}
          <button className="link" onClick={() => setEditing(true)}>edit</button>
          <button className="link" onClick={() => onDelete(job.id)}>delete</button>
        </>
      ) : (
        <div className="row">
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
          <input value={skills} onChange={(e) => setSkills(e.target.value)} />
          <button className="link" onClick={() => setEditing(false)}>cancel</button>
          <button className="link" onClick={() => onUpdate(job.id, { title, description, skills })}>save</button>
        </div>
      )}
    </li>
  );
}

function Pagination({ page, setPage, pageSize, disabled }) {
  const prev = () => setPage(Math.max(0, page - 1));
  const next = () => setPage(page + 1);
  return (
    <div className="row">
      <button disabled={disabled || page === 0} onClick={prev}>Prev</button>
      <span>Page {page + 1}</span>
      <button disabled={disabled} onClick={next}>Next</button>
    </div>
  );
}


