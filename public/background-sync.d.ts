/**
 * This file provides TypeScript declarations for the Background Sync API
 * which is still experimental and not included in standard TypeScript DOM libs.
 */

/**
 * The SyncManager interface provides methods for registering and listing sync operations.
 */
interface SyncManager {
  /**
   * Registers a sync event with the given tag
   * @param tag A unique tag to identify the sync event
   */
  register(tag: string): Promise<void>;

  /**
   * Gets all registered sync tags
   */
  getTags(): Promise<string[]>;
}

/**
 * Extends the ServiceWorkerRegistration interface to include the sync property
 */
interface ServiceWorkerRegistration {
  /**
   * The SyncManager interface for managing background sync
   */
  readonly sync: SyncManager;
}

/**
 * The SyncEvent is dispatched on the ServiceWorkerGlobalScope when a sync event occurs
 */
interface SyncEvent extends ExtendableEvent {
  /**
   * The tag of the sync event
   */
  readonly tag: string;
}

/**
 * Extend the ServiceWorkerGlobalScope to include the onsync event handler and addEventListener
 */
interface ServiceWorkerGlobalScope {
  /**
   * The event handler for the sync event
   */
  onsync: ((event: SyncEvent) => any) | null;

  /**
   * Add an event listener for 'sync' events
   */
  addEventListener(type: 'sync', listener: (event: SyncEvent) => any, options?: boolean | AddEventListenerOptions): void;

  /**
   * Default event listener overload for other event types
   */
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
}