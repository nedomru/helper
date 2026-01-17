/**
 * Genesys Module - Feature-based exports
 *
 * This module provides content script functionality for the Genesys call center system.
 * Features are organized by domain:
 * - chat: Chat customization (colors, sounds, layout)
 * - chat-content: Chat content management (remove answers, RMs)
 * - ui-enhancements: UI improvements (line status, duty messages, hide buttons)
 */

// Re-export configuration
export * from './config';

// Re-export features for external use if needed
export * from './features/chat';
export * from './features/chat-content';
export * from './features/ui-enhancements';
