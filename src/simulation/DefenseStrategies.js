/**
 * Defense Strategies Module
 * Implements various security mechanisms against brute-force attacks
 */

// Defense mechanism definitions
export const DEFENSE_TYPES = {
  RATE_LIMIT: {
    id: 'rate_limit',
    name: 'Rate Limiting',
    description: 'Limits requests per IP per time window',
    icon: '⏱️',
    color: '#3b82f6',
    enabled: true,
    config: {
      maxRequests: 50,
      windowMs: 60000, // 1 minute
    },
  },
  IP_BLACKLIST: {
    id: 'ip_blacklist',
    name: 'IP Blacklisting',
    description: 'Blocks IPs after repeated violations',
    icon: '🚫',
    color: '#ef4444',
    enabled: true,
    config: {
      banThreshold: 100, // requests before ban
      banDuration: 300000, // 5 minutes
    },
  },
  CAPTCHA: {
    id: 'captcha',
    name: 'CAPTCHA Challenge',
    description: 'Requires CAPTCHA after failed attempts',
    icon: '🤖',
    color: '#22c55e',
    enabled: false,
    config: {
      triggerAfter: 3, // failed attempts
      difficulty: 'medium',
    },
  },
  ACCOUNT_LOCKOUT: {
    id: 'account_lockout',
    name: 'Account Lockout',
    description: 'Locks account after failed login attempts',
    icon: '🔒',
    color: '#f59e0b',
    enabled: false,
    config: {
      maxAttempts: 5,
      lockDuration: 900000, // 15 minutes
    },
  },
  PROGRESSIVE_DELAY: {
    id: 'progressive_delay',
    name: 'Progressive Delay',
    description: 'Increases wait time between attempts',
    icon: '⏳',
    color: '#8b5cf6',
    enabled: false,
    config: {
      baseDelay: 1000, // 1 second
      multiplier: 2,
      maxDelay: 60000, // 1 minute max
    },
  },
  GEO_BLOCKING: {
    id: 'geo_blocking',
    name: 'Geo-Blocking',
    description: 'Blocks requests from specific countries',
    icon: '🌍',
    color: '#06b6d4',
    enabled: false,
    config: {
      blockedCountries: ['RU', 'CN', 'NG'],
    },
  },
  HONEYPOT: {
    id: 'honeypot',
    name: 'Honeypot Detection',
    description: 'Trap accounts to identify attackers',
    icon: '🍯',
    color: '#fbbf24',
    enabled: false,
    config: {
      trapAccounts: ['admin2', 'administrator', 'root', 'superuser'],
    },
  },
  BEHAVIORAL: {
    id: 'behavioral',
    name: 'Behavioral Analysis',
    description: 'Detects automation patterns',
    icon: '🧠',
    color: '#ec4899',
    enabled: false,
    config: {
      minRequestInterval: 50, // ms - too fast = bot
      patternThreshold: 0.8, // similarity threshold
    },
  },
};

/**
 * Defense Strategy Manager
 */
export class DefenseStrategyManager {
  constructor() {
    // Deep clone defense configurations
    this.defenses = JSON.parse(JSON.stringify(DEFENSE_TYPES));
    
    // State tracking
    this.ipAttempts = new Map(); // IP -> { count, timestamps, blocked, unblockTime }
    this.accountAttempts = new Map(); // username -> { count, locked, unlockTime }
    this.ipDelays = new Map(); // IP -> current delay
    this.honeypotHits = new Map(); // IP -> count
    this.requestPatterns = new Map(); // IP -> { intervals: [], lastRequest }
    
    // Statistics
    this.stats = {
      rateLimitBlocks: 0,
      ipBans: 0,
      captchaChallenges: 0,
      accountLockouts: 0,
      geoBlocks: 0,
      honeypotDetections: 0,
      behavioralBlocks: 0,
    };
  }

  /**
   * Enable/disable a defense mechanism
   */
  toggleDefense(defenseId, enabled) {
    if (this.defenses[defenseId.toUpperCase()]) {
      this.defenses[defenseId.toUpperCase()].enabled = enabled;
    }
  }

  /**
   * Update defense configuration
   */
  updateConfig(defenseId, config) {
    if (this.defenses[defenseId.toUpperCase()]) {
      this.defenses[defenseId.toUpperCase()].config = {
        ...this.defenses[defenseId.toUpperCase()].config,
        ...config,
      };
    }
  }

  /**
   * Process a request through all enabled defenses
   * Returns: { allowed: boolean, responses: [], delay: number }
   */
  processRequest(request) {
    const now = Date.now();
    const results = {
      allowed: true,
      responses: [],
      delay: 0,
      statusCode: 200,
      message: 'OK',
    };

    // 1. Check Geo-Blocking
    if (this.defenses.GEO_BLOCKING.enabled && request.origin) {
      const blocked = this.defenses.GEO_BLOCKING.config.blockedCountries.includes(request.origin.country);
      if (blocked) {
        results.allowed = false;
        results.statusCode = 403;
        results.message = `Blocked: Country ${request.origin.country} not allowed`;
        results.responses.push({ defense: 'geo_blocking', action: 'blocked' });
        this.stats.geoBlocks++;
        return results;
      }
    }

    // 2. Check IP Blacklist
    if (this.defenses.IP_BLACKLIST.enabled) {
      const ipData = this.ipAttempts.get(request.ip) || { count: 0, timestamps: [], blocked: false };
      
      if (ipData.blocked) {
        if (now < ipData.unblockTime) {
          results.allowed = false;
          results.statusCode = 403;
          results.message = `IP ${request.ip} is banned`;
          results.responses.push({ defense: 'ip_blacklist', action: 'blocked' });
          return results;
        } else {
          // Unblock expired ban
          ipData.blocked = false;
          ipData.count = 0;
        }
      }
    }

    // 3. Check Honeypot
    if (this.defenses.HONEYPOT.enabled && request.username) {
      const isTrap = this.defenses.HONEYPOT.config.trapAccounts.includes(request.username.toLowerCase());
      if (isTrap) {
        const hits = (this.honeypotHits.get(request.ip) || 0) + 1;
        this.honeypotHits.set(request.ip, hits);
        results.responses.push({ defense: 'honeypot', action: 'detected', hits });
        this.stats.honeypotDetections++;
        
        // Auto-ban honeypot hitters
        if (hits >= 2) {
          this.banIp(request.ip, now);
          results.allowed = false;
          results.statusCode = 403;
          results.message = 'Honeypot triggered - IP banned';
          return results;
        }
      }
    }

    // 4. Check Behavioral Analysis
    if (this.defenses.BEHAVIORAL.enabled) {
      const patterns = this.requestPatterns.get(request.ip) || { intervals: [], lastRequest: 0 };
      
      if (patterns.lastRequest > 0) {
        const interval = now - patterns.lastRequest;
        patterns.intervals.push(interval);
        
        // Keep last 20 intervals
        if (patterns.intervals.length > 20) patterns.intervals.shift();
        
        // Check for bot-like behavior (too fast or too regular)
        const avgInterval = patterns.intervals.reduce((a, b) => a + b, 0) / patterns.intervals.length;
        const isBot = avgInterval < this.defenses.BEHAVIORAL.config.minRequestInterval;
        
        if (isBot && patterns.intervals.length >= 5) {
          results.allowed = false;
          results.statusCode = 403;
          results.message = 'Bot behavior detected';
          results.responses.push({ defense: 'behavioral', action: 'blocked', avgInterval });
          this.stats.behavioralBlocks++;
          return results;
        }
      }
      
      patterns.lastRequest = now;
      this.requestPatterns.set(request.ip, patterns);
    }

    // 5. Check Rate Limiting
    if (this.defenses.RATE_LIMIT.enabled) {
      const ipData = this.ipAttempts.get(request.ip) || { count: 0, timestamps: [], blocked: false };
      const windowMs = this.defenses.RATE_LIMIT.config.windowMs;
      
      // Clean old timestamps
      ipData.timestamps = ipData.timestamps.filter(t => now - t < windowMs);
      ipData.timestamps.push(now);
      
      if (ipData.timestamps.length > this.defenses.RATE_LIMIT.config.maxRequests) {
        results.allowed = false;
        results.statusCode = 429;
        results.message = 'Rate limit exceeded';
        results.responses.push({ defense: 'rate_limit', action: 'limited' });
        this.stats.rateLimitBlocks++;
        
        // Check if should ban
        ipData.count++;
        if (this.defenses.IP_BLACKLIST.enabled && 
            ipData.count >= this.defenses.IP_BLACKLIST.config.banThreshold) {
          this.banIp(request.ip, now);
          results.responses.push({ defense: 'ip_blacklist', action: 'banned' });
        }
        
        this.ipAttempts.set(request.ip, ipData);
        return results;
      }
      
      this.ipAttempts.set(request.ip, ipData);
    }

    // 6. Check Progressive Delay
    if (this.defenses.PROGRESSIVE_DELAY.enabled) {
      const currentDelay = this.ipDelays.get(request.ip) || 0;
      if (currentDelay > 0) {
        results.delay = currentDelay;
        results.responses.push({ defense: 'progressive_delay', action: 'delayed', delay: currentDelay });
      }
    }

    // 7. Check Account Lockout (for login attempts)
    if (this.defenses.ACCOUNT_LOCKOUT.enabled && request.path === '/login' && request.username) {
      const accountData = this.accountAttempts.get(request.username) || { count: 0, locked: false };
      
      if (accountData.locked) {
        if (now < accountData.unlockTime) {
          results.allowed = false;
          results.statusCode = 423;
          results.message = `Account ${request.username} is locked`;
          results.responses.push({ defense: 'account_lockout', action: 'locked' });
          return results;
        } else {
          accountData.locked = false;
          accountData.count = 0;
        }
      }
      
      this.accountAttempts.set(request.username, accountData);
    }

    // 8. Check CAPTCHA requirement
    if (this.defenses.CAPTCHA.enabled && request.path === '/login') {
      const ipData = this.ipAttempts.get(request.ip) || { count: 0, timestamps: [], blocked: false };
      
      if (ipData.failedAttempts >= this.defenses.CAPTCHA.config.triggerAfter) {
        if (!request.captchaSolved) {
          results.allowed = false;
          results.statusCode = 428;
          results.message = 'CAPTCHA required';
          results.responses.push({ defense: 'captcha', action: 'required' });
          this.stats.captchaChallenges++;
          return results;
        }
      }
    }

    return results;
  }

  /**
   * Record failed login attempt
   */
  recordFailedAttempt(request) {
    const now = Date.now();
    
    // Update IP attempts
    const ipData = this.ipAttempts.get(request.ip) || { count: 0, timestamps: [], blocked: false, failedAttempts: 0 };
    ipData.failedAttempts = (ipData.failedAttempts || 0) + 1;
    this.ipAttempts.set(request.ip, ipData);
    
    // Update account attempts
    if (request.username) {
      const accountData = this.accountAttempts.get(request.username) || { count: 0, locked: false };
      accountData.count++;
      
      if (this.defenses.ACCOUNT_LOCKOUT.enabled && 
          accountData.count >= this.defenses.ACCOUNT_LOCKOUT.config.maxAttempts) {
        accountData.locked = true;
        accountData.unlockTime = now + this.defenses.ACCOUNT_LOCKOUT.config.lockDuration;
        this.stats.accountLockouts++;
      }
      
      this.accountAttempts.set(request.username, accountData);
    }
    
    // Update progressive delay
    if (this.defenses.PROGRESSIVE_DELAY.enabled) {
      const currentDelay = this.ipDelays.get(request.ip) || this.defenses.PROGRESSIVE_DELAY.config.baseDelay;
      const newDelay = Math.min(
        currentDelay * this.defenses.PROGRESSIVE_DELAY.config.multiplier,
        this.defenses.PROGRESSIVE_DELAY.config.maxDelay
      );
      this.ipDelays.set(request.ip, newDelay);
    }
  }

  /**
   * Ban an IP
   */
  banIp(ip, now) {
    const ipData = this.ipAttempts.get(ip) || { count: 0, timestamps: [], blocked: false };
    ipData.blocked = true;
    ipData.unblockTime = now + this.defenses.IP_BLACKLIST.config.banDuration;
    this.ipAttempts.set(ip, ipData);
    this.stats.ipBans++;
  }

  /**
   * Get blocked IPs
   */
  getBlockedIps() {
    const blocked = [];
    const now = Date.now();
    
    this.ipAttempts.forEach((data, ip) => {
      if (data.blocked && now < data.unblockTime) {
        blocked.push({
          ip,
          unblockTime: data.unblockTime,
          remainingMs: data.unblockTime - now,
        });
      }
    });
    
    return blocked;
  }

  /**
   * Get locked accounts
   */
  getLockedAccounts() {
    const locked = [];
    const now = Date.now();
    
    this.accountAttempts.forEach((data, username) => {
      if (data.locked && now < data.unlockTime) {
        locked.push({
          username,
          unlockTime: data.unlockTime,
          remainingMs: data.unlockTime - now,
        });
      }
    });
    
    return locked;
  }

  /**
   * Get defense statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Get all defense configurations
   */
  getDefenses() {
    return this.defenses;
  }

  /**
   * Reset all state
   */
  reset() {
    this.ipAttempts.clear();
    this.accountAttempts.clear();
    this.ipDelays.clear();
    this.honeypotHits.clear();
    this.requestPatterns.clear();
    this.stats = {
      rateLimitBlocks: 0,
      ipBans: 0,
      captchaChallenges: 0,
      accountLockouts: 0,
      geoBlocks: 0,
      honeypotDetections: 0,
      behavioralBlocks: 0,
    };
  }
}
