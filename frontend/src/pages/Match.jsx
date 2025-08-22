export default function MatchPage({ token, matchResumeId, setMatchResumeId, matchJobId, setMatchJobId, doMatch, matchResult, loading }) {
  return (
    <div className="card">
      <h2>Match</h2>
      <div className="row">
        <input placeholder="resume id" value={matchResumeId} onChange={(e) => setMatchResumeId(e.target.value)} />
        <input placeholder="job id" value={matchJobId} onChange={(e) => setMatchJobId(e.target.value)} />
        <button disabled={!token || loading} onClick={doMatch}>Score</button>
      </div>
      <div className="result">{matchResult}</div>
    </div>
  );
}


