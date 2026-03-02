/**
 * Target Login Server
 * A real login page that responds to authentication attempts.
 * Runs on port 10011.
 */
import express from 'express';

const app = express();
const PORT = 10011;

// Valid credentials (hardcoded demo account)
const VALID_USERNAME = 'demo@bastion.local';
const VALID_PASSWORD = 'Secure2024!';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// GET / — HTML login form
app.get('/', (_req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bastion Corp &mdash; Login</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
           background: #0f172a; color: #e2e8f0; display: flex; align-items: center;
           justify-content: center; min-height: 100vh; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px;
            padding: 2.5rem; width: 100%; max-width: 400px; }
    h1 { font-size: 1.5rem; margin-bottom: .25rem; }
    .sub { color: #94a3b8; font-size: .875rem; margin-bottom: 1.5rem; }
    label { display: block; font-size: .875rem; color: #94a3b8; margin-bottom: .25rem; }
    input { width: 100%; padding: .625rem .75rem; border: 1px solid #475569;
            border-radius: 8px; background: #0f172a; color: #e2e8f0; font-size: .875rem;
            margin-bottom: 1rem; outline: none; }
    input:focus { border-color: #38bdf8; }
    button { width: 100%; padding: .625rem; background: #2563eb; color: #fff;
             border: none; border-radius: 8px; font-size: .875rem; cursor: pointer; }
    button:hover { background: #1d4ed8; }
    .msg { margin-top: 1rem; padding: .5rem .75rem; border-radius: 6px; font-size: .8rem; }
    .msg.err { background: #7f1d1d; color: #fca5a5; }
    .msg.ok  { background: #14532d; color: #86efac; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Bastion Corp</h1>
    <p class="sub">Employee Portal &mdash; Sign In</p>
    <form id="f" action="/login" method="POST">
      <label for="username">Email</label>
      <input id="username" name="username" type="text" placeholder="you@bastion.local" autocomplete="username" />
      <label for="password">Password</label>
      <input id="password" name="password" type="password" placeholder="Password" autocomplete="current-password" />
      <button type="submit">Sign In</button>
    </form>
    <div id="msg"></div>
  </div>
  <script>
    document.getElementById('f').addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = JSON.stringify({
        username: document.getElementById('username').value,
        password: document.getElementById('password').value,
      });
      const res = await fetch('/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body
      });
      const data = await res.json();
      const el = document.getElementById('msg');
      el.className = 'msg ' + (res.ok ? 'ok' : 'err');
      el.textContent = data.message;
    });
  </script>
</body>
</html>`);
});

// POST /login — JSON authentication endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Missing credentials' });
  }

  if (username === VALID_USERNAME && password === VALID_PASSWORD) {
    return res.status(200).json({ success: true, message: 'Login successful' });
  }

  return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'target-login', port: PORT });
});

app.listen(PORT, () => {
  console.log(`[Target] Login server running on http://localhost:${PORT}`);
  console.log(`[Target] Valid account: ${VALID_USERNAME} / ${VALID_PASSWORD}`);
});
