import * as Sentry from '@sentry/react-native';
import config from '../config/environment';

/**
 * Sentry Crash Reporting Service
 *
 * Initializes and provides crash reporting functionality
 * Only enabled in production builds
 */
class SentryService {
  private isInitialized = false;

  /**
   * Initialize Sentry
   * Call this once at app startup
   */
  initialize(): void {
    if (this.isInitialized) {
      console.log('Sentry already initialized');
      return;
    }

    // Only initialize if we have a DSN and we're not in development
    if (!config.SENTRY_DSN) {
      console.log('Sentry DSN not configured, skipping initialization');
      return;
    }

    if (__DEV__ && config.DEBUG) {
      console.log('Sentry disabled in development mode');
      return;
    }

    try {
      Sentry.init({
        dsn: config.SENTRY_DSN,
        environment: config.ENVIRONMENT,

        // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
        // We recommend adjusting this value in production
        tracesSampleRate: config.ENVIRONMENT === 'production' ? 0.2 : 1.0,

        // Enable automatic session tracking
        enableAutoSessionTracking: true,

        // Session timeout (30 minutes)
        sessionTrackingIntervalMillis: 30000,

        // Enable native crash reporting
        enableNative: true,

        // Enable auto breadcrumbs
        enableNativeCrashHandling: true,
        enableAutoPerformanceTracing: true,

        // Integrations
        integrations: [
          new Sentry.ReactNativeTracing({
            // Pass instrumentation to be used as `routingInstrumentation`
            routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
            tracingOrigins: ['localhost', config.API_BASE_URL, /^\//],
          }),
        ],

        // Filter out sensitive information
        beforeSend(event, hint) {
          // Don't send events in development
          if (__DEV__) {
            return null;
          }

          // Filter sensitive data from breadcrumbs
          if (event.breadcrumbs) {
            event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
              if (breadcrumb.data) {
                // Remove auth tokens from breadcrumbs
                if (breadcrumb.data.Authorization) {
                  breadcrumb.data.Authorization = '[Filtered]';
                }
                if (breadcrumb.data.authToken) {
                  breadcrumb.data.authToken = '[Filtered]';
                }
                if (breadcrumb.data.password) {
                  breadcrumb.data.password = '[Filtered]';
                }
              }
              return breadcrumb;
            });
          }

          return event;
        },
      });

      this.isInitialized = true;
      console.log('✅ Sentry initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
    }
  }

  /**
   * Capture an exception manually
   */
  captureException(error: Error, context?: Record<string, any>): void {
    if (!this.isInitialized || __DEV__) {
      console.error('Error (not sent to Sentry in dev):', error, context);
      return;
    }

    Sentry.captureException(error, {
      extra: context,
    });
  }

  /**
   * Capture a message manually
   */
  captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
    if (!this.isInitialized || __DEV__) {
      console.log(`[${level}] ${message}`);
      return;
    }

    Sentry.captureMessage(message, level);
  }

  /**
   * Set user context for error tracking
   */
  setUser(user: { id: string; email?: string; username?: string } | null): void {
    if (!this.isInitialized || __DEV__) {
      return;
    }

    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.username || user.email,
      });
    } else {
      Sentry.setUser(null);
    }
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: Sentry.SeverityLevel;
    data?: Record<string, any>;
  }): void {
    if (!this.isInitialized || __DEV__) {
      console.log('Breadcrumb:', breadcrumb);
      return;
    }

    Sentry.addBreadcrumb(breadcrumb);
  }

  /**
   * Set custom context
   */
  setContext(key: string, context: Record<string, any>): void {
    if (!this.isInitialized || __DEV__) {
      return;
    }

    Sentry.setContext(key, context);
  }

  /**
   * Set tag for filtering
   */
  setTag(key: string, value: string): void {
    if (!this.isInitialized || __DEV__) {
      return;
    }

    Sentry.setTag(key, value);
  }

  /**
   * Check if Sentry is initialized
   */
  isEnabled(): boolean {
    return this.isInitialized && !__DEV__;
  }
}

export default new SentryService();
