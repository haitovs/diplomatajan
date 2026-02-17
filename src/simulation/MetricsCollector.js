/**
 * Metrics Collector
 * Collects and aggregates security metrics over time
 */

export class MetricsCollector {
  constructor(options = {}) {
    this.options = {
      historySize: 60, // 60 data points
      sampleInterval: 1000, // 1 second
      ...options,
    };
    
    // Current snapshot
    this.current = {
      timestamp: Date.now(),
      rps: 0,
      blockedPerSecond: 0,
      failedAuthPerSecond: 0,
      successRate: 100,
      blockRate: 0,
      avgResponseTime: 15,
    };
    
    // Historical data
    this.history = {
      timestamps: [],
      rps: [],
      blocked: [],
      failed: [],
      successRate: [],
    };
    
    // Aggregates
    this.aggregates = {
      totalRequests: 0,
      totalBlocked: 0,
      totalFailed: 0,
      totalSuccess: 0,
      peakRps: 0,
      attackTime: 0,
      defenseEffectiveness: 0,
    };
    
    // Last sample values (for calculating per-second rates)
    this.lastSample = {
      totalRequests: 0,
      totalBlocked: 0,
      totalFailed: 0,
      timestamp: Date.now(),
    };
  }

  /**
   * Update metrics from simulation state
   */
  update(state) {
    const now = Date.now();
    const elapsed = (now - this.lastSample.timestamp) / 1000; // seconds
    
    if (elapsed < 0.1) return; // Skip if too fast
    
    // Calculate per-second rates
    const reqDiff = state.stats.totalRequests - this.lastSample.totalRequests;
    const blockedDiff = state.stats.blockedRequests - this.lastSample.totalBlocked;
    const failedDiff = state.stats.failedAuth - this.lastSample.totalFailed;
    
    this.current = {
      timestamp: now,
      rps: Math.round(reqDiff / elapsed),
      blockedPerSecond: Math.round(blockedDiff / elapsed),
      failedAuthPerSecond: Math.round(failedDiff / elapsed),
      successRate: state.stats.totalRequests > 0 
        ? Math.round((state.stats.successfulRequests / state.stats.totalRequests) * 100) 
        : 100,
      blockRate: state.stats.totalRequests > 0
        ? Math.round((state.stats.blockedRequests / state.stats.totalRequests) * 100)
        : 0,
      avgResponseTime: 15 + Math.random() * 10, // Simulated
    };
    
    // Update history
    this.addToHistory();
    
    // Update aggregates
    this.aggregates.totalRequests = state.stats.totalRequests;
    this.aggregates.totalBlocked = state.stats.blockedRequests;
    this.aggregates.totalFailed = state.stats.failedAuth;
    this.aggregates.totalSuccess = state.stats.successfulRequests;
    this.aggregates.peakRps = Math.max(this.aggregates.peakRps, this.current.rps);
    this.aggregates.attackTime = state.stats.attackDuration || 0;
    
    // Calculate defense effectiveness
    if (state.config.isUnderAttack && state.stats.totalRequests > 0) {
      const attackRequests = state.stats.totalRequests - state.stats.successfulRequests;
      if (attackRequests > 0) {
        this.aggregates.defenseEffectiveness = Math.round(
          (state.stats.blockedRequests / attackRequests) * 100
        );
      }
    }
    
    // Update last sample
    this.lastSample = {
      totalRequests: state.stats.totalRequests,
      totalBlocked: state.stats.blockedRequests,
      totalFailed: state.stats.failedAuth,
      timestamp: now,
    };
  }

  /**
   * Add current data to history
   */
  addToHistory() {
    this.history.timestamps.push(this.current.timestamp);
    this.history.rps.push(this.current.rps);
    this.history.blocked.push(this.current.blockedPerSecond);
    this.history.failed.push(this.current.failedAuthPerSecond);
    this.history.successRate.push(this.current.successRate);
    
    // Trim to max size
    while (this.history.timestamps.length > this.options.historySize) {
      this.history.timestamps.shift();
      this.history.rps.shift();
      this.history.blocked.shift();
      this.history.failed.shift();
      this.history.successRate.shift();
    }
  }

  /**
   * Get chart-ready data
   */
  getChartData() {
    return {
      labels: this.history.timestamps.map(t => {
        const d = new Date(t);
        return `${d.getMinutes()}:${d.getSeconds().toString().padStart(2, '0')}`;
      }),
      datasets: {
        rps: [...this.history.rps],
        blocked: [...this.history.blocked],
        failed: [...this.history.failed],
        successRate: [...this.history.successRate],
      },
    };
  }

  /**
   * Get current metrics
   */
  getCurrent() {
    return { ...this.current };
  }

  /**
   * Get aggregates
   */
  getAggregates() {
    return { ...this.aggregates };
  }

  /**
   * Calculate threat level (0-100)
   */
  getThreatLevel() {
    const rpsWeight = Math.min(this.current.rps / 100, 1) * 30;
    const blockedWeight = Math.min(this.current.blockedPerSecond / 50, 1) * 30;
    const failedWeight = Math.min(this.current.failedAuthPerSecond / 20, 1) * 40;
    
    return Math.round(rpsWeight + blockedWeight + failedWeight);
  }

  /**
   * Get threat level label
   */
  getThreatLabel() {
    const level = this.getThreatLevel();
    if (level >= 80) return { label: 'CRITICAL', color: '#ef4444' };
    if (level >= 60) return { label: 'HIGH', color: '#f97316' };
    if (level >= 40) return { label: 'MEDIUM', color: '#eab308' };
    if (level >= 20) return { label: 'LOW', color: '#22c55e' };
    return { label: 'MINIMAL', color: '#6366f1' };
  }

  /**
   * Reset metrics
   */
  reset() {
    this.current = {
      timestamp: Date.now(),
      rps: 0,
      blockedPerSecond: 0,
      failedAuthPerSecond: 0,
      successRate: 100,
      blockRate: 0,
      avgResponseTime: 15,
    };
    
    this.history = {
      timestamps: [],
      rps: [],
      blocked: [],
      failed: [],
      successRate: [],
    };
    
    this.aggregates = {
      totalRequests: 0,
      totalBlocked: 0,
      totalFailed: 0,
      totalSuccess: 0,
      peakRps: 0,
      attackTime: 0,
      defenseEffectiveness: 0,
    };
    
    this.lastSample = {
      totalRequests: 0,
      totalBlocked: 0,
      totalFailed: 0,
      timestamp: Date.now(),
    };
  }
}
