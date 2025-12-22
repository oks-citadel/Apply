import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ProxyConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  protocol: 'http' | 'https' | 'socks5';
  country?: string;
  city?: string;
  isResidential?: boolean;
}

export interface ProxyHealth {
  proxy: ProxyConfig;
  lastChecked: Date;
  latencyMs: number;
  successRate: number;
  isHealthy: boolean;
  failureCount: number;
  successCount: number;
}

export interface ProxyRotationStrategy {
  type: 'round-robin' | 'random' | 'least-used' | 'fastest' | 'geo-targeted';
  targetCountry?: string;
  targetCity?: string;
  maxFailures?: number;
}

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private proxyPool: ProxyConfig[] = [];
  private proxyHealth: Map<string, ProxyHealth> = new Map();
  private currentIndex: number = 0;
  private proxyUsageCount: Map<string, number> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.initializeProxyPool();
  }

  /**
   * Initialize proxy pool from configuration
   */
  private initializeProxyPool(): void {
    // Load proxies from environment/config
    const proxyList = this.configService.get<string>('PROXY_LIST', '');

    if (proxyList) {
      // Format: protocol://user:pass@host:port,protocol://user:pass@host:port
      const proxies = proxyList.split(',').map(p => p.trim()).filter(Boolean);

      for (const proxyStr of proxies) {
        try {
          const proxy = this.parseProxyString(proxyStr);
          if (proxy) {
            this.proxyPool.push(proxy);
            this.initializeProxyHealth(proxy);
          }
        } catch (error) {
          this.logger.warn(`Failed to parse proxy: ${proxyStr}`);
        }
      }
    }

    // Load from proxy provider APIs if configured
    this.loadFromProviders();

    this.logger.log(`Initialized proxy pool with ${this.proxyPool.length} proxies`);
  }

  /**
   * Parse proxy string to config
   */
  private parseProxyString(proxyStr: string): ProxyConfig | null {
    try {
      const url = new URL(proxyStr);
      return {
        protocol: url.protocol.replace(':', '') as 'http' | 'https' | 'socks5',
        host: url.hostname,
        port: parseInt(url.port) || (url.protocol === 'https:' ? 443 : 80),
        username: url.username || undefined,
        password: url.password || undefined,
      };
    } catch {
      return null;
    }
  }

  /**
   * Load proxies from provider APIs
   */
  private async loadFromProviders(): Promise<void> {
    // BrightData/Luminati integration
    const brightDataApiKey = this.configService.get<string>('BRIGHTDATA_API_KEY');
    if (brightDataApiKey) {
      const brightDataZone = this.configService.get<string>('BRIGHTDATA_ZONE', 'residential');
      this.proxyPool.push({
        protocol: 'http',
        host: 'brd.superproxy.io',
        port: 22225,
        username: `brd-customer-${this.configService.get('BRIGHTDATA_CUSTOMER_ID')}-zone-${brightDataZone}`,
        password: brightDataApiKey,
        isResidential: brightDataZone === 'residential',
      });
    }

    // SmartProxy integration
    const smartProxyUser = this.configService.get<string>('SMARTPROXY_USER');
    const smartProxyPass = this.configService.get<string>('SMARTPROXY_PASS');
    if (smartProxyUser && smartProxyPass) {
      this.proxyPool.push({
        protocol: 'http',
        host: 'gate.smartproxy.com',
        port: 7000,
        username: smartProxyUser,
        password: smartProxyPass,
        isResidential: true,
      });
    }

    // Oxylabs integration
    const oxylabsUser = this.configService.get<string>('OXYLABS_USER');
    const oxylabsPass = this.configService.get<string>('OXYLABS_PASS');
    if (oxylabsUser && oxylabsPass) {
      this.proxyPool.push({
        protocol: 'http',
        host: 'pr.oxylabs.io',
        port: 7777,
        username: oxylabsUser,
        password: oxylabsPass,
        isResidential: true,
      });
    }
  }

  /**
   * Initialize health tracking for a proxy
   */
  private initializeProxyHealth(proxy: ProxyConfig): void {
    const key = this.getProxyKey(proxy);
    this.proxyHealth.set(key, {
      proxy,
      lastChecked: new Date(),
      latencyMs: 0,
      successRate: 1.0,
      isHealthy: true,
      failureCount: 0,
      successCount: 0,
    });
    this.proxyUsageCount.set(key, 0);
  }

  /**
   * Get unique key for proxy
   */
  private getProxyKey(proxy: ProxyConfig): string {
    return `${proxy.protocol}://${proxy.host}:${proxy.port}`;
  }

  /**
   * Get next proxy based on rotation strategy
   */
  getNextProxy(strategy: ProxyRotationStrategy = { type: 'round-robin' }): ProxyConfig | null {
    const healthyProxies = this.getHealthyProxies();

    if (healthyProxies.length === 0) {
      this.logger.warn('No healthy proxies available');
      return null;
    }

    let selectedProxy: ProxyConfig;

    switch (strategy.type) {
      case 'round-robin':
        selectedProxy = healthyProxies[this.currentIndex % healthyProxies.length];
        this.currentIndex++;
        break;

      case 'random':
        selectedProxy = healthyProxies[Math.floor(Math.random() * healthyProxies.length)];
        break;

      case 'least-used':
        selectedProxy = this.getLeastUsedProxy(healthyProxies);
        break;

      case 'fastest':
        selectedProxy = this.getFastestProxy(healthyProxies);
        break;

      case 'geo-targeted':
        selectedProxy = this.getGeoTargetedProxy(healthyProxies, strategy.targetCountry, strategy.targetCity);
        break;

      default:
        selectedProxy = healthyProxies[0];
    }

    // Increment usage count
    const key = this.getProxyKey(selectedProxy);
    this.proxyUsageCount.set(key, (this.proxyUsageCount.get(key) || 0) + 1);

    this.logger.debug(`Selected proxy: ${key} (strategy: ${strategy.type})`);
    return selectedProxy;
  }

  /**
   * Get healthy proxies
   */
  private getHealthyProxies(): ProxyConfig[] {
    return this.proxyPool.filter(proxy => {
      const health = this.proxyHealth.get(this.getProxyKey(proxy));
      return health?.isHealthy !== false;
    });
  }

  /**
   * Get least used proxy
   */
  private getLeastUsedProxy(proxies: ProxyConfig[]): ProxyConfig {
    let minUsage = Infinity;
    let leastUsed = proxies[0];

    for (const proxy of proxies) {
      const usage = this.proxyUsageCount.get(this.getProxyKey(proxy)) || 0;
      if (usage < minUsage) {
        minUsage = usage;
        leastUsed = proxy;
      }
    }

    return leastUsed;
  }

  /**
   * Get fastest proxy based on latency
   */
  private getFastestProxy(proxies: ProxyConfig[]): ProxyConfig {
    let minLatency = Infinity;
    let fastest = proxies[0];

    for (const proxy of proxies) {
      const health = this.proxyHealth.get(this.getProxyKey(proxy));
      if (health && health.latencyMs < minLatency) {
        minLatency = health.latencyMs;
        fastest = proxy;
      }
    }

    return fastest;
  }

  /**
   * Get geo-targeted proxy
   */
  private getGeoTargetedProxy(proxies: ProxyConfig[], country?: string, city?: string): ProxyConfig {
    // Filter by country/city if specified
    const geoFiltered = proxies.filter(proxy => {
      if (country && proxy.country !== country) return false;
      if (city && proxy.city !== city) return false;
      return true;
    });

    return geoFiltered.length > 0 ? geoFiltered[0] : proxies[0];
  }

  /**
   * Report proxy success
   */
  reportSuccess(proxy: ProxyConfig, latencyMs: number): void {
    const key = this.getProxyKey(proxy);
    const health = this.proxyHealth.get(key);

    if (health) {
      health.successCount++;
      health.lastChecked = new Date();
      health.latencyMs = (health.latencyMs + latencyMs) / 2; // Moving average
      health.successRate = health.successCount / (health.successCount + health.failureCount);
      health.isHealthy = true;
      health.failureCount = Math.max(0, health.failureCount - 1); // Decay failures on success
    }
  }

  /**
   * Report proxy failure
   */
  reportFailure(proxy: ProxyConfig, maxFailures: number = 5): void {
    const key = this.getProxyKey(proxy);
    const health = this.proxyHealth.get(key);

    if (health) {
      health.failureCount++;
      health.lastChecked = new Date();
      health.successRate = health.successCount / (health.successCount + health.failureCount);

      if (health.failureCount >= maxFailures) {
        health.isHealthy = false;
        this.logger.warn(`Proxy marked unhealthy: ${key} (${health.failureCount} failures)`);
      }
    }
  }

  /**
   * Get Playwright proxy configuration
   */
  getPlaywrightProxyConfig(proxy: ProxyConfig): Record<string, any> {
    const proxyUrl = proxy.username && proxy.password
      ? `${proxy.protocol}://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`
      : `${proxy.protocol}://${proxy.host}:${proxy.port}`;

    return {
      server: proxyUrl,
    };
  }

  /**
   * Add proxy to pool
   */
  addProxy(proxy: ProxyConfig): void {
    const key = this.getProxyKey(proxy);
    if (!this.proxyPool.some(p => this.getProxyKey(p) === key)) {
      this.proxyPool.push(proxy);
      this.initializeProxyHealth(proxy);
      this.logger.log(`Added proxy: ${key}`);
    }
  }

  /**
   * Remove proxy from pool
   */
  removeProxy(proxy: ProxyConfig): void {
    const key = this.getProxyKey(proxy);
    this.proxyPool = this.proxyPool.filter(p => this.getProxyKey(p) !== key);
    this.proxyHealth.delete(key);
    this.proxyUsageCount.delete(key);
    this.logger.log(`Removed proxy: ${key}`);
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    totalProxies: number;
    healthyProxies: number;
    unhealthyProxies: number;
    proxyHealth: ProxyHealth[];
  } {
    const healthyCount = this.getHealthyProxies().length;

    return {
      totalProxies: this.proxyPool.length,
      healthyProxies: healthyCount,
      unhealthyProxies: this.proxyPool.length - healthyCount,
      proxyHealth: Array.from(this.proxyHealth.values()),
    };
  }

  /**
   * Check if proxies are available
   */
  hasProxies(): boolean {
    return this.proxyPool.length > 0;
  }

  /**
   * Reset all proxy health
   */
  resetHealth(): void {
    for (const proxy of this.proxyPool) {
      this.initializeProxyHealth(proxy);
    }
    this.currentIndex = 0;
    this.logger.log('Reset all proxy health');
  }
}
