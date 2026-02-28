/**
 * Attack Patterns Module
 * Defines various brute-force attack strategies and their behaviors
 */

// Attack type definitions
export const ATTACK_TYPES = {
  DICTIONARY: {
    id: 'dictionary',
    name: 'Dictionary Attack',
    description: 'Uses common passwords from a wordlist',
    icon: '📖',
    color: '#ef4444',
    avgRps: 15,
    ipSpread: 1, // Single IP
    successRate: 0.02, // 2% chance of success
  },
  CREDENTIAL_STUFFING: {
    id: 'credential_stuffing',
    name: 'Credential Stuffing',
    description: 'Uses leaked username:password pairs',
    icon: '🔓',
    color: '#f97316',
    avgRps: 25,
    ipSpread: 3, // Few IPs
    successRate: 0.08, // Higher success with real credentials
  },
  PASSWORD_SPRAY: {
    id: 'password_spray',
    name: 'Password Spraying',
    description: 'One password against many usernames',
    icon: '🌧️',
    color: '#eab308',
    avgRps: 5, // Slow to avoid detection
    ipSpread: 1,
    successRate: 0.01,
  },
  DISTRIBUTED: {
    id: 'distributed',
    name: 'Distributed Attack',
    description: 'Botnet attack with rotating IPs',
    icon: '🌐',
    color: '#8b5cf6',
    avgRps: 50,
    ipSpread: 20, // Many IPs
    successRate: 0.03,
  },
  REVERSE_BRUTE: {
    id: 'reverse_brute',
    name: 'Reverse Brute Force',
    description: 'Fixed password, enumerate usernames',
    icon: '🔄',
    color: '#ec4899',
    avgRps: 10,
    ipSpread: 2,
    successRate: 0.005,
  },
};

// Common password wordlist (simplified)
const COMMON_PASSWORDS = [
  'password', '123456', '12345678', 'qwerty', 'abc123',
  'password1', 'admin', 'letmein', 'welcome', 'monkey',
  '1234567890', 'login', 'master', 'hello', 'freedom',
  'shadow', 'sunshine', 'princess', 'dragon', 'passw0rd',
];

// Common usernames
const COMMON_USERNAMES = [
  'admin', 'user', 'root', 'administrator', 'test',
  'guest', 'info', 'support', 'contact', 'webmaster',
  'john', 'david', 'robert', 'michael', 'william',
];

// Geo-locations for attack origins (simulated)
const ATTACK_ORIGINS = [
  { country: 'RU', name: 'Russia', lat: 55.75, lon: 37.62 },
  { country: 'CN', name: 'China', lat: 39.90, lon: 116.40 },
  { country: 'BR', name: 'Brazil', lat: -23.55, lon: -46.63 },
  { country: 'IN', name: 'India', lat: 28.61, lon: 77.23 },
  { country: 'NG', name: 'Nigeria', lat: 6.45, lon: 3.39 },
  { country: 'US', name: 'USA', lat: 40.71, lon: -74.01 },
  { country: 'IR', name: 'Iran', lat: 35.69, lon: 51.39 },
  { country: 'PK', name: 'Pakistan', lat: 24.86, lon: 67.01 },
];

/**
 * Attack Pattern Generator
 */
export class AttackPatternGenerator {
  constructor() {
    this.currentType = ATTACK_TYPES.DICTIONARY;
    this.usernameIndex = 0;
    this.passwordIndex = 0;
    this.botnetIps = this.generateBotnetIps(50);
  }

  /**
   * Set attack type
   */
  setAttackType(typeId) {
    this.currentType = Object.values(ATTACK_TYPES).find(t => t.id === typeId) 
      || ATTACK_TYPES.DICTIONARY;
    this.usernameIndex = 0;
    this.passwordIndex = 0;
  }

  /**
   * Get current attack type
   */
  getAttackType() {
    return this.currentType;
  }

  /**
   * Generate botnet IPs
   */
  generateBotnetIps(count) {
    const ips = [];
    for (let i = 0; i < count; i++) {
      const origin = ATTACK_ORIGINS[Math.floor(Math.random() * ATTACK_ORIGINS.length)];
      ips.push({
        ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        origin,
      });
    }
    return ips;
  }

  /**
   * Generate attack request based on current type
   */
  generateRequest(intensity = 5) {
    const type = this.currentType;
    const requests = [];
    
    // Calculate number of requests based on intensity and attack type
    const count = Math.floor((Math.random() * intensity * type.avgRps / 10) + 1);
    
    for (let i = 0; i < count; i++) {
      requests.push(this.createRequest(type));
    }
    
    return requests;
  }

  /**
   * Create a single attack request
   */
  createRequest(type) {
    let username, password, ip, origin;
    
    switch (type.id) {
      case 'dictionary': {
        username = COMMON_USERNAMES[Math.floor(Math.random() * COMMON_USERNAMES.length)];
        password = COMMON_PASSWORDS[this.passwordIndex % COMMON_PASSWORDS.length];
        this.passwordIndex++;
        ip = `192.168.1.${100 + Math.floor(Math.random() * type.ipSpread)}`;
        origin = ATTACK_ORIGINS[0];
        break;
      }
        
      case 'credential_stuffing': {
        // Simulated leaked credentials
        username = `user${Math.floor(Math.random() * 10000)}@example.com`;
        password = `pass${Math.floor(Math.random() * 1000)}`;
        const botIdx = Math.floor(Math.random() * type.ipSpread);
        ip = this.botnetIps[botIdx].ip;
        origin = this.botnetIps[botIdx].origin;
        break;
      }
        
      case 'password_spray': {
        username = COMMON_USERNAMES[this.usernameIndex % COMMON_USERNAMES.length];
        this.usernameIndex++;
        password = 'Password123!'; // Single password
        ip = `192.168.1.${100 + Math.floor(Math.random() * type.ipSpread)}`;
        origin = ATTACK_ORIGINS[2];
        break;
      }
        
      case 'distributed': {
        username = COMMON_USERNAMES[Math.floor(Math.random() * COMMON_USERNAMES.length)];
        password = COMMON_PASSWORDS[Math.floor(Math.random() * COMMON_PASSWORDS.length)];
        const botnetIdx = Math.floor(Math.random() * Math.min(type.ipSpread, this.botnetIps.length));
        ip = this.botnetIps[botnetIdx].ip;
        origin = this.botnetIps[botnetIdx].origin;
        break;
      }
        
      case 'reverse_brute': {
        username = `user${this.usernameIndex}`;
        this.usernameIndex++;
        password = 'Summer2024!'; // Fixed password
        ip = `192.168.1.${100 + Math.floor(Math.random() * type.ipSpread)}`;
        origin = ATTACK_ORIGINS[3];
        break;
      }
        
      default: {
        username = 'admin';
        password = 'password';
        ip = '192.168.1.100';
        origin = ATTACK_ORIGINS[0];
      }
    }
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      type: 'ATTACK',
      attackType: type.id,
      ip,
      origin,
      username,
      password: password.substring(0, 3) + '***', // Masked
      path: '/login',
      method: 'POST',
      timestamp: Date.now(),
      willSucceed: Math.random() < type.successRate,
    };
  }

  /**
   * Get attack statistics
   */
  getStats() {
    return {
      type: this.currentType,
      requestsGenerated: this.passwordIndex + this.usernameIndex,
    };
  }

  /**
   * Reset attack state
   */
  reset() {
    this.usernameIndex = 0;
    this.passwordIndex = 0;
    this.botnetIps = this.generateBotnetIps(50);
  }
}

export { ATTACK_ORIGINS, COMMON_PASSWORDS, COMMON_USERNAMES };

