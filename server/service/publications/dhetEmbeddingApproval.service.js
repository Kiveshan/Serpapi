const { spawn } = require('child_process');
const path = require('path');

let pyProc = null;
let pyStdoutBuffer = '';
let pending = [];

const startPythonIfNeeded = () => {
  if (pyProc && !pyProc.killed) {
    return;
  }

  const scriptPath = path.join(__dirname, '../../scripts/recommend.py');

  pyProc = spawn('python', [scriptPath, '--serve'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  pyStdoutBuffer = '';
  pending = [];

  pyProc.stdout.on('data', (chunk) => {
    pyStdoutBuffer += chunk.toString('utf8');

    let idx;
    while ((idx = pyStdoutBuffer.indexOf('\n')) >= 0) {
      const line = pyStdoutBuffer.slice(0, idx).trim();
      pyStdoutBuffer = pyStdoutBuffer.slice(idx + 1);

      if (!line) continue;

      let msg;
      try {
        msg = JSON.parse(line);
      } catch (e) {
        continue;
      }

      const next = pending.shift();
      if (next) {
        next.resolve(msg);
      }
    }
  });

  pyProc.stderr.on('data', (chunk) => {
    console.error('[Python stderr]', chunk.toString('utf8'));
  });

  pyProc.on('exit', (code) => {
    console.warn(`Python DHET process exited with code ${code}`);
    pyProc = null;
    pending.forEach(p => p.reject(new Error('Python process exited')));
    pending = [];
  });
};

const sendToPython = (payload) => {
  return new Promise((resolve, reject) => {
    startPythonIfNeeded();

    const msg = JSON.stringify(payload) + '\n';
    pyProc.stdin.write(msg);

    pending.push({ resolve, reject });

    const timeout = setTimeout(() => {
      const idx = pending.findIndex(p => p.resolve === resolve);
      if (idx >= 0) pending.splice(idx, 1);
      reject(new Error('Python request timeout'));
    }, 300000);

    const originalResolve = resolve;
    resolve = (value) => {
      clearTimeout(timeout);
      originalResolve(value);
    };
  });
};

const checkDhetApproval = async (titles, venues = [], authors = [], similarityThreshold = 0.9) => {
  if (!Array.isArray(titles) || titles.length === 0) {
    return { results: [] };
  }

  const payload = {
    action: 'check_dhet_approval',
    search_texts: titles,
    venues: venues.length === titles.length ? venues : [],
    authors: authors.length === titles.length ? authors : [],
    similarity_threshold: similarityThreshold
  };

  try {
    const resp = await sendToPython(payload);
    if (resp.error) {
      throw new Error(resp.error);
    }
    return resp;
  } catch (e) {
    console.error('DHET approval service error:', e);
    return { error: e.message, results: [] };
  }
};

const preloadCache = async () => {
  try {
    const resp = await sendToPython({ action: 'load_cache' });
    console.log('DHET cache preloaded:', resp);
    return resp;
  } catch (e) {
    console.error('Failed to preload DHET cache:', e);
    return { error: e.message };
  }
};

module.exports = {
  checkDhetApproval,
  preloadCache
};
