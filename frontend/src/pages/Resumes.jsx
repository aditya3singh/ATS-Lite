export default function ResumesPage({ token, resumes, listResumes, uploadResume, loading }) {
  return (
    <div className="card">
      <h2>Resumes</h2>
      <form className="row" onSubmit={(e) => uploadResume(e)}>
        <input type="file" name="file" />
        <button disabled={!token || loading} type="submit">Upload</button>
        <button disabled={!token || loading} type="button" onClick={listResumes}>Refresh</button>
      </form>
      <ul className="list">
        {resumes.map((r) => (
          <li key={r.id}>#{r.id} {r.filename} — parsed: {String(r.parsed)}</li>
        ))}
      </ul>
    </div>
  );
}


