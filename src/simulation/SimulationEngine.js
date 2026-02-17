
export const REQUEST_TYPES = {
  NORMAL: 'NORMAL',
  ATTACK: 'ATTACK'
};

export const RESPONSE_CODES = {
  200: 'OK',
  401: 'Unauthorized',
  403: 'Forbidden',
  429: 'Too Many Requests'
};

export class SimulationEngine {
  constructor() {
    this.logs = [];
    this.stats = {
      totalRequests: 0,
      blockedRequests: 0,
      successfulRequests: 0,
      failedAuth: 0,
      activeConnections: 0,
      rps: 0
    };
    this.config = {
      isUnderAttack: false,
      attackIntensity: 5, // 1-10
      firewallEnabled: true,
      rateLimit: 50, // requests per window
      rateLimitWindow: 1000, // ms
      blacklist: new Set(),
      autoBan: true
    };
    this.ipHistory = {}; // Map of IP -> { timestamps: [] }
    this.subscribers = [];
    this.intervalId = null;
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notify() {
    this.subscribers.forEach(cb => cb({
      logs: this.logs.slice(-50), // Send last 50 logs
      stats: this.stats,
      config: this.config
    }));
  }

  start() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.tick(), 100); // Tick every 100ms
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  toggleAttack(enable) {
    this.config.isUnderAttack = enable;
  }

  setAttackIntensity(intensity) {
    this.config.attackIntensity = intensity;
  }

  toggleFirewall(enable) {
    this.config.firewallEnabled = enable;
  }

  tick() {
    // Generate traffic
    const now = Date.now();
    const newRequests = [];

    // 1. Normal Traffic (random low volume)
    if (Math.random() > 0.7) {
      newRequests.push(this.generateRequest(REQUEST_TYPES.NORMAL));
    }

    // 2. Attack Traffic
    if (this.config.isUnderAttack) {
      const attackVolume = Math.floor(Math.random() * this.config.attackIntensity * 2) + 1;
      for (let i = 0; i < attackVolume; i++) {
        newRequests.push(this.generateRequest(REQUEST_TYPES.ATTACK));
      }
    }

    // Process requests
    newRequests.forEach(req => this.processRequest(req, now));

    // Update RPS
    this.stats.rps = newRequests.length * 10; // since we tick every 100ms, approx

    this.notify();
  }

  generateRequest(type) {
    const isAttack = type === REQUEST_TYPES.ATTACK;
    // Attackers use a small pool of IPs, Normal users use many
    const ip = isAttack 
      ? `192.168.1.${100 + Math.floor(Math.random() * 5)}` // 5 attacker IPs
      : `10.0.0.${Math.floor(Math.random() * 255)}`;
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      ip,
      type,
      path: isAttack ? '/login' : ['/home', '/about', '/contact', '/login'][Math.floor(Math.random() * 4)],
      method: 'POST',
      timestamp: Date.now()
    };
  }

  processRequest(req, now) {
    this.stats.totalRequests++;

    // 1. Check Blacklist
    if (this.config.firewallEnabled && this.config.blacklist.has(req.ip)) {
      this.logRequest(req, 403, 'Blocked by Firewall (Blacklist)');
      this.stats.blockedRequests++;
      return;
    }

    // 2. Rate Limiting
    if (this.config.firewallEnabled) {
      if (!this.ipHistory[req.ip]) {
        this.ipHistory[req.ip] = [];
      }
      // Clean old timestamps
      this.ipHistory[req.ip] = this.ipHistory[req.ip].filter(t => now - t < this.config.rateLimitWindow);
      
      if (this.ipHistory[req.ip].length >= this.config.rateLimit) {
        this.logRequest(req, 429, 'Rate Limit Exceeded');
        this.stats.blockedRequests++;
        
        if (this.config.autoBan) {
           this.config.blacklist.add(req.ip);
           // Add a system log for banning
           this.logs.push({
             id: 'sys-' + Date.now(),
             timestamp: now,
             type: 'SYSTEM',
             message: `IP ${req.ip} banned due to rate limiting.`
           });
        }
        return;
      }
      this.ipHistory[req.ip].push(now);
    }

    // 3. Handle Logic
    if (req.path === '/login') {
      // Simulate brute force check
      // In this mock, we assume all attack requests fail auth, normal ones might succeed
      if (req.type === REQUEST_TYPES.ATTACK) {
        this.logRequest(req, 401, 'Invalid Credentials');
        this.stats.failedAuth++;
      } else {
        // Random success for normal users
        const success = Math.random() > 0.1;
        this.logRequest(req, success ? 200 : 401, success ? 'Login Success' : 'Invalid Credentials');
        if (success) this.stats.successfulRequests++;
        else this.stats.failedAuth++;
      }
    } else {
      this.logRequest(req, 200, 'OK');
      this.stats.successfulRequests++;
    }
  }

  logRequest(req, status, message) {
    this.logs.push({
      ...req,
      status,
      message
    });
    // Keep log size manageable
    if (this.logs.length > 200) {
      this.logs.shift();
    }
  }
}
