/**
 * Enhanced Simulation Engine v2
 * Integrates advanced attack patterns and defense strategies
 */

import { ATTACK_TYPES, AttackPatternGenerator } from './AttackPatterns.js';
import { DEFENSE_TYPES, DefenseStrategyManager } from './DefenseStrategies.js';

export const REQUEST_TYPES = {
  NORMAL: 'NORMAL',
  ATTACK: 'ATTACK',
};

export const RESPONSE_CODES = {
  200: 'OK',
  401: 'Unauthorized',
  403: 'Forbidden',
  423: 'Locked',
  428: 'Precondition Required',
  429: 'Too Many Requests',
};

export const ANALYTICS_WINDOW_MS = 90_000;
const UI_LOG_WINDOW_SIZE = 220;
const MAX_LOGS_BUFFER = 4000;
const MAX_ATTACK_TELEMETRY_EVENTS = 45_000;

/**
 * Enhanced Simulation Engine
 */
export class SimulationEngineV2 {
  constructor() {
    // Core modules
    this.attackGenerator = new AttackPatternGenerator();
    this.defenseManager = new DefenseStrategyManager();
    
    // Logs
    this.logs = [];
    this.maxLogs = MAX_LOGS_BUFFER;
    this.attackTelemetry = [];
    this.attackTelemetryWindowMs = ANALYTICS_WINDOW_MS;
    this.maxAttackTelemetryEvents = MAX_ATTACK_TELEMETRY_EVENTS;
    this.attackTelemetryDirty = true;
    this.lastAttackTelemetrySnapshotAt = 0;
    this.lastAttackTelemetrySnapshot = {
      generatedAt: Date.now(),
      windowMs: ANALYTICS_WINDOW_MS,
      totalRequests: 0,
      availableAttackTypes: [],
      origins: [],
    };
    
    // Statistics
    this.stats = {
      totalRequests: 0,
      blockedRequests: 0,
      successfulRequests: 0,
      failedAuth: 0,
      successfulLogins: 0,
      activeConnections: 0,
      rps: 0,
      avgResponseTime: 15,
      peakRps: 0,
      attackDuration: 0,
    };
    
    // Configuration
    this.config = {
      isUnderAttack: false,
      attackIntensity: 5,
      attackType: ATTACK_TYPES.DICTIONARY.id,
      normalTrafficRate: 0.3, // 30% chance per tick
    };
    
    // State
    this.subscribers = [];
    this.intervalId = null;
    this.tickInterval = 100; // ms
    this.attackStartTime = null;
    this.lastTickRequests = 0;
    
    // Alerts
    this.alerts = [];
    this.maxAlerts = 50;
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all subscribers
   */
  notify() {
    const attackTelemetry = this.getAttackTelemetrySnapshot();
    const state = {
      logs: this.logs.slice(-UI_LOG_WINDOW_SIZE),
      attackTelemetry,
      stats: this.getStats(),
      config: this.getConfig(),
      defenses: this.defenseManager.getDefenses(),
      defenseStats: this.defenseManager.getStats(),
      blockedIps: this.defenseManager.getBlockedIps(),
      lockedAccounts: this.defenseManager.getLockedAccounts(),
      alerts: this.alerts.slice(-10),
      attackType: this.attackGenerator.getAttackType(),
    };
    
    this.subscribers.forEach(cb => cb(state));
  }

  /**
   * Start simulation
   */
  start() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.tick(), this.tickInterval);
  }

  /**
   * Stop simulation
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Toggle attack mode
   */
  toggleAttack(enable) {
    this.config.isUnderAttack = enable;
    
    if (enable) {
      this.attackStartTime = Date.now();
      this.addAlert('critical', 'Attack Detected', `${this.attackGenerator.getAttackType().name} attack initiated`);
    } else {
      if (this.attackStartTime) {
        this.stats.attackDuration += Date.now() - this.attackStartTime;
      }
      this.attackStartTime = null;
      this.addAlert('info', 'Attack Stopped', 'Brute-force attack has ceased');
    }
  }

  /**
   * Set attack intensity (1-20)
   */
  setAttackIntensity(intensity) {
    this.config.attackIntensity = Math.max(1, Math.min(20, intensity));
  }

  /**
   * Set attack type
   */
  setAttackType(typeId) {
    this.config.attackType = typeId;
    this.attackGenerator.setAttackType(typeId);
    
    if (this.config.isUnderAttack) {
      const type = this.attackGenerator.getAttackType();
      this.addAlert('warning', 'Attack Pattern Changed', `Now using ${type.name}`);
    }
  }

  /**
   * Toggle a defense mechanism
   */
  toggleDefense(defenseId, enabled) {
    this.defenseManager.toggleDefense(defenseId, enabled);
    
    const defense = DEFENSE_TYPES[defenseId.toUpperCase()];
    if (defense) {
      this.addAlert(
        enabled ? 'success' : 'warning',
        `${defense.name} ${enabled ? 'Enabled' : 'Disabled'}`,
        defense.description
      );
    }
  }

  /**
   * Update defense configuration
   */
  updateDefenseConfig(defenseId, config) {
    this.defenseManager.updateConfig(defenseId, config);
  }

  /**
   * Main simulation tick
   */
  tick() {
    const requests = [];
    
    // 1. Generate normal traffic
    if (Math.random() < this.config.normalTrafficRate) {
      requests.push(this.generateNormalRequest());
    }
    
    // 2. Generate attack traffic
    if (this.config.isUnderAttack) {
      const attackRequests = this.attackGenerator.generateRequest(this.config.attackIntensity);
      requests.push(...attackRequests);
    }
    
    // 3. Process all requests
    requests.forEach(req => this.processRequest(req));
    
    // 4. Update stats
    this.lastTickRequests = requests.length;
    this.stats.rps = Math.round(requests.length * (1000 / this.tickInterval));
    
    if (this.stats.rps > this.stats.peakRps) {
      this.stats.peakRps = this.stats.rps;
    }
    
    // Update attack duration
    if (this.config.isUnderAttack && this.attackStartTime) {
      this.stats.attackDuration = Date.now() - this.attackStartTime;
    }

    this.trimAttackTelemetry(Date.now());
    
    // 5. Notify subscribers
    this.notify();
  }

  /**
   * Generate a normal (non-attack) request
   */
  generateNormalRequest() {
    const paths = ['/home', '/about', '/contact', '/products', '/login', '/api/data'];
    const methods = ['GET', 'GET', 'GET', 'POST'];
    
    return {
      id: this.generateId(),
      type: REQUEST_TYPES.NORMAL,
      ip: `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      origin: { country: 'US', name: 'USA' },
      path: paths[Math.floor(Math.random() * paths.length)],
      method: methods[Math.floor(Math.random() * methods.length)],
      timestamp: Date.now(),
      username: null,
      password: null,
    };
  }

  /**
   * Process a single request
   */
  processRequest(request) {
    this.stats.totalRequests++;
    
    // Apply defense mechanisms
    const defenseResult = this.defenseManager.processRequest(request);
    
    if (!defenseResult.allowed) {
      this.stats.blockedRequests++;
      this.logRequest(request, defenseResult.statusCode, defenseResult.message, defenseResult.responses);
      return;
    }
    
    // Apply delay if any
    if (defenseResult.delay > 0) {
      // In real app, we'd delay response; here we just note it
      request.delayed = defenseResult.delay;
    }
    
    // Process login attempts
    if (request.path === '/login') {
      this.processLoginAttempt(request, defenseResult);
    } else {
      // Normal request succeeds
      this.stats.successfulRequests++;
      this.logRequest(request, 200, 'OK', defenseResult.responses);
    }
  }

  /**
   * Process login attempt
   */
  processLoginAttempt(request, defenseResult) {
    // Determine if login succeeds
    let success = false;
    
    if (request.type === REQUEST_TYPES.ATTACK) {
      // Attack requests use willSucceed from generator
      success = request.willSucceed || false;
    } else {
      // Normal users have 90% success rate
      success = Math.random() > 0.1;
    }
    
    if (success) {
      this.stats.successfulLogins++;
      this.stats.successfulRequests++;
      this.logRequest(request, 200, 'Login successful', defenseResult.responses);
      
      // Reset failed attempts on success
      if (request.username) {
        // Could reset account lockout here
      }
    } else {
      this.stats.failedAuth++;
      this.logRequest(request, 401, 'Invalid credentials', defenseResult.responses);
      
      // Record failed attempt for defense tracking
      this.defenseManager.recordFailedAttempt(request);
      
      // Check if this triggered any new blocks
      const blockedIps = this.defenseManager.getBlockedIps();
      if (blockedIps.some(b => b.ip === request.ip && Date.now() - b.unblockTime + this.defenseManager.defenses.IP_BLACKLIST.config.banDuration < 1000)) {
        this.addAlert('success', 'IP Banned', `${request.ip} has been blocked`);
      }
    }
  }

  /**
   * Log a request
   */
  logRequest(request, status, message, defenseResponses = []) {
    const logEntry = {
      id: request.id,
      timestamp: request.timestamp,
      type: request.type,
      attackType: request.attackType || null,
      ip: request.ip,
      origin: request.origin,
      method: request.method,
      path: request.path,
      username: request.username,
      status,
      message,
      defenseResponses,
      delayed: request.delayed || 0,
    };
    
    this.logs.push(logEntry);
    
    // Trim logs
    while (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    if (request.type === REQUEST_TYPES.ATTACK) {
      this.attackTelemetry.push({
        timestamp: request.timestamp,
        attackType: request.attackType || this.config.attackType,
        status,
        origin: request.origin
          ? {
            country: request.origin.country || null,
            name: request.origin.name || null,
            lat: Number.isFinite(request.origin.lat) ? request.origin.lat : null,
            lon: Number.isFinite(request.origin.lon) ? request.origin.lon : null,
          }
          : null,
      });
      this.attackTelemetryDirty = true;
    }
  }

  getOutcome(status) {
    if ([403, 423, 428, 429].includes(status)) return 'blocked';
    if (status === 401) return 'failed';
    if (status === 200) return 'success';
    return 'other';
  }

  trimAttackTelemetry(referenceTimestamp = Date.now()) {
    if (this.attackTelemetry.length === 0) return;

    const cutoff = referenceTimestamp - this.attackTelemetryWindowMs;
    let firstInWindowIndex = 0;
    while (
      firstInWindowIndex < this.attackTelemetry.length &&
      this.attackTelemetry[firstInWindowIndex].timestamp < cutoff
    ) {
      firstInWindowIndex += 1;
    }

    if (firstInWindowIndex > 0) {
      this.attackTelemetry = this.attackTelemetry.slice(firstInWindowIndex);
      this.attackTelemetryDirty = true;
    }

    if (this.attackTelemetry.length > this.maxAttackTelemetryEvents) {
      this.attackTelemetry = this.attackTelemetry.slice(-this.maxAttackTelemetryEvents);
      this.attackTelemetryDirty = true;
    }
  }

  getAttackTelemetrySnapshot() {
    const now = Date.now();
    if (!this.attackTelemetryDirty && now - this.lastAttackTelemetrySnapshotAt < 1000) {
      return this.lastAttackTelemetrySnapshot;
    }

    const originMap = new Map();
    const attackTypeSet = new Set();

    this.attackTelemetry.forEach((entry) => {
      const typeId = entry.attackType || this.config.attackType || 'unknown';
      const outcome = this.getOutcome(entry.status);
      const origin = entry.origin || {};
      const country = origin.country || 'US';
      const key = country;

      attackTypeSet.add(typeId);

      if (!originMap.has(key)) {
        originMap.set(key, {
          country,
          name: origin.name || country,
          lat: Number.isFinite(origin.lat) ? origin.lat : null,
          lon: Number.isFinite(origin.lon) ? origin.lon : null,
          total: 0,
          outcomes: {
            blocked: 0,
            failed: 0,
            success: 0,
            other: 0,
          },
          byType: {},
        });
      }

      const current = originMap.get(key);
      current.total += 1;
      current.outcomes[outcome] += 1;

      if (origin.name) current.name = origin.name;
      if (Number.isFinite(origin.lat)) current.lat = origin.lat;
      if (Number.isFinite(origin.lon)) current.lon = origin.lon;

      if (!current.byType[typeId]) {
        current.byType[typeId] = {
          total: 0,
          outcomes: {
            blocked: 0,
            failed: 0,
            success: 0,
            other: 0,
          },
        };
      }

      current.byType[typeId].total += 1;
      current.byType[typeId].outcomes[outcome] += 1;
    });

    const snapshot = {
      generatedAt: now,
      windowMs: this.attackTelemetryWindowMs,
      totalRequests: this.attackTelemetry.length,
      availableAttackTypes: [...attackTypeSet],
      origins: [...originMap.values()].sort((a, b) => b.total - a.total),
    };

    this.lastAttackTelemetrySnapshotAt = now;
    this.lastAttackTelemetrySnapshot = snapshot;
    this.attackTelemetryDirty = false;
    return snapshot;
  }

  /**
   * Add an alert
   */
  addAlert(severity, title, message) {
    this.alerts.push({
      id: this.generateId(),
      timestamp: Date.now(),
      severity,
      title,
      message,
    });
    
    while (this.alerts.length > this.maxAlerts) {
      this.alerts.shift();
    }
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get current stats
   */
  getStats() {
    return {
      ...this.stats,
      blockedIpCount: this.defenseManager.getBlockedIps().length,
      lockedAccountCount: this.defenseManager.getLockedAccounts().length,
    };
  }

  /**
   * Get current config
   */
  getConfig() {
    return {
      ...this.config,
      attackTypeName: this.attackGenerator.getAttackType().name,
    };
  }

  /**
   * Reset simulation
   */
  reset() {
    this.logs = [];
    this.attackTelemetry = [];
    this.attackTelemetryDirty = true;
    this.alerts = [];
    this.stats = {
      totalRequests: 0,
      blockedRequests: 0,
      successfulRequests: 0,
      failedAuth: 0,
      successfulLogins: 0,
      activeConnections: 0,
      rps: 0,
      avgResponseTime: 15,
      peakRps: 0,
      attackDuration: 0,
    };
    this.config.isUnderAttack = false;
    this.attackStartTime = null;
    this.attackGenerator.reset();
    this.defenseManager.reset();
    
    this.addAlert('info', 'Simulation Reset', 'All statistics and state have been cleared');
  }
}

// Re-export types
export { ATTACK_TYPES } from './AttackPatterns.js';
export { DEFENSE_TYPES } from './DefenseStrategies.js';

