export default function ResumesPage({ token, resumes, listResumes, uploadResume, deleteResume, loading, page, setPage, pageSize }) {
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
          <li key={r.id}>#{r.id} {r.filename} — parsed: {String(r.parsed)} <button className="link" onClick={() => deleteResume(r.id)}>delete</button></li>
        ))}
      </ul>
      <div className="row">
        <button disabled={loading || page === 0} onClick={() => setPage(Math.max(0, page - 1))}>Prev</button>
        <span>Page {page + 1}</span>
        <button disabled={loading} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}


