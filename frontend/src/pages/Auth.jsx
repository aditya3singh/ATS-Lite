import { useState } from 'react';

export default function AuthPage({ onSignup, onLogin, loading }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  return (
    <div className="card">
      <h2>Authenticate to continue</h2>
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
        <button disabled={loading} onClick={() => onSignup({ email, password, fullName })}>
          Sign up
        </button>
        <button disabled={loading} onClick={() => onLogin({ email, password })}>
          Log in
        </button>
      </div>
    </div>
  );
}


