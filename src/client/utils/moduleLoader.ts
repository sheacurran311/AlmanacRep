import { env } from './setupEnv';
import { preloadSharedDependencies, sharedDependencies } from './sharedDependencies';

interface RemoteModule {
  url: string;
  scope: string;
  module: string;
}

interface ModuleRegistry {
  [key: string]: RemoteModule;
}

class ModuleLoader {
  private registry: ModuleRegistry = {};
  private initialized: boolean = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    await preloadSharedDependencies();
    this.initialized = true;
  }

  registerRemote(name: string, config: RemoteModule): void {
    this.registry[name] = config;
  }

  async loadRemote(name: string): Promise<any> {
    if (!this.initialized) {
      await this.init();
    }

    const remote = this.registry[name];
    if (!remote) {
      throw new Error(`Remote module "${name}" not found in registry`);
    }

    try {
      const container = await this.loadRemoteContainer(remote);
      const factory = await container.get(remote.module);
      return factory();
    } catch (error) {
      console.error(`Failed to load remote module "${name}":`, error);
      throw error;
    }
  }

  private async loadRemoteContainer(remote: RemoteModule): Promise<any> {
    // @ts-ignore
    if (window[remote.scope]) {
      // @ts-ignore
      return window[remote.scope];
    }

    const scriptId = `remote_${remote.scope}`;
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = remote.url;
      script.crossOrigin = '';
      
      const loadPromise = new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = (e) => reject(new Error(`Failed to load remote module script: ${e}`));
      });

      document.head.appendChild(script);
      await loadPromise;
    }

    // @ts-ignore
    const container = window[remote.scope];
    if (!container) {
      throw new Error(`Remote container ${remote.scope} not found after loading script`);
    }

    await container.init(sharedDependencies);
    return container;
  }
}

export const moduleLoader = new ModuleLoader();

// Register remote modules based on environment
if (env.features.multitenant) {
  moduleLoader.registerRemote('tenant-ui', {
    url: `${env.api.baseUrl}/remotes/tenant-ui/remoteEntry.js`,
    scope: 'tenant_ui',
    module: './TenantModule'
  });

  moduleLoader.registerRemote('analytics-dashboard', {
    url: `${env.api.baseUrl}/remotes/analytics/remoteEntry.js`,
    scope: 'analytics_dashboard',
    module: './DashboardModule'
  });
}
