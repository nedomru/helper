/**
 * ARM Module - Feature-based exports
 *
 * This module provides content script functionality for the ARM (ertelecom.ru) billing system.
 * Features are organized by domain:
 * - client-card: Client card copying and sending
 * - compensation: Compensation processing
 * - network-info: IP/MAC address copying
 * - ui-enhancements: UI improvements (copy, agreement display, etc.)
 */

// Re-export configuration
export * from './config';

// Re-export features for external use if needed
export * from './features/client-card';
export * from './features/compensation';
export * from './features/network-info';
export * from './features/ui-enhancements';

// Re-export shared utilities
export * from './shared';
