/**
 * Cloud Storage & Authentication Client Service
 * Coordinates with Vercel serverless / MongoDB Atlas backend.
 * Provides offline-first graceful degradation: if MongoDB or email credentials
 * are not configured, cloud options remain hidden and game uses local storage exclusively.
 */

const TOKEN_KEY = 'tower_defense_auth_token';

class CloudStorageService {
  constructor() {
    this.status = {
      checking: true,
      enabled: false,
      database: null,
      email: null,
      reason: null
    };
    this.user = null;
    this.token = this._getSavedToken();
    this.syncState = 'idle'; // 'idle' | 'syncing' | 'synced' | 'error' | 'offline'
    this.lastSynced = null;
    this.lastError = null;

    this.subscribers = new Set();
    this._syncDebounceTimer = null;
    this._pendingPayload = null;
  }

  _getSavedToken() {
    try {
      return localStorage.getItem(TOKEN_KEY) || null;
    } catch {
      return null;
    }
  }

  _setSavedToken(token) {
    this.token = token;
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch (err) {
      console.warn('Failed to save auth token:', err);
    }
  }

  subscribe(callback) {
    if (typeof callback === 'function') {
      this.subscribers.add(callback);
      // Immediately notify current state
      callback(this.getState());
      return () => this.subscribers.delete(callback);
    }
    return () => {};
  }

  _notify() {
    const snapshot = this.getState();
    this.subscribers.forEach((cb) => {
      try {
        cb(snapshot);
      } catch (err) {
        console.error('Cloud subscriber error:', err);
      }
    });
  }

  getState() {
    return {
      status: { ...this.status },
      user: this.user ? { ...this.user } : null,
      isLoggedIn: Boolean(this.user && this.token),
      syncState: this.syncState,
      lastSynced: this.lastSynced,
      lastError: this.lastError
    };
  }

  /**
   * Check whether backend cloud sync is enabled (MongoDB connected + email configured)
   * and restore existing user session if available.
   */
  async init(onLocalSavesChanged) {
    this.status.checking = true;
    this._notify();

    try {
      const res = await fetch('/api/auth/status');
      if (!res.ok) {
        throw new Error(`Status check HTTP ${res.status}`);
      }
      const data = await res.json();
      this.status = {
        checking: false,
        enabled: Boolean(data.enabled),
        database: data.database || null,
        email: data.email || null,
        reason: data.reason || null
      };

      if (!this.status.enabled) {
        this.syncState = 'offline';
        this._notify();
        return;
      }

      // If enabled, attempt token validation if previously saved
      if (this.token) {
        await this._validateSession(onLocalSavesChanged);
      } else {
        this.syncState = 'idle';
        this._notify();
      }
    } catch (err) {
      console.warn('Backend status check unavailable (running pure offline guest mode):', err.message);
      this.status = {
        checking: false,
        enabled: false,
        database: null,
        email: null,
        reason: 'Backend unavailable or network offline'
      };
      this.syncState = 'offline';
      this._notify();
    }
  }

  async _validateSession(onLocalSavesChanged) {
    try {
      this.syncState = 'syncing';
      this._notify();

      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });

      if (!res.ok) {
        // Expired or invalid token
        this._setSavedToken(null);
        this.user = null;
        this.syncState = 'idle';
        this._notify();
        return;
      }

      const data = await res.json();
      if (data.authenticated && data.user) {
        this.user = data.user;
        this.syncState = 'synced';
        this.lastSynced = Date.now();
        this._notify();

        // Perform initial bidirectional sync with cloud
        await this.syncWithCloud(onLocalSavesChanged);
      } else {
        this._setSavedToken(null);
        this.user = null;
        this.syncState = 'idle';
        this._notify();
      }
    } catch (err) {
      console.warn('Session check failed:', err.message);
      this.syncState = 'error';
      this.lastError = 'Session verification failed';
      this._notify();
    }
  }

  /**
   * Request a 6-digit email OTP authorization code.
   */
  async sendTacticalCode(email) {
    if (!this.status.enabled) {
      throw new Error('Cloud persistence is not enabled on this deployment.');
    }

    const res = await fetch('/api/auth/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Failed to dispatch authorization code.');
    }

    return data;
  }

  /**
   * Verify the 6-digit OTP code, authenticate, and sync cloud saves.
   */
  async verifyTacticalCode(email, code, onLocalSavesChanged) {
    const res = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Verification failed.');
    }

    this._setSavedToken(data.token);
    this.user = data.user;
    this.syncState = 'synced';
    this.lastSynced = Date.now();
    this.lastError = null;
    this._notify();

    // Perform bidirectional sync: if user has cloud saves, merge them with local
    await this.syncWithCloud(onLocalSavesChanged, data.cloudSaves, data.activeSlot);

    return {
      user: this.user,
      cloudSaves: data.cloudSaves
    };
  }

  /**
   * Sign out the active user session.
   * Keeps current local storage saves intact so gameplay is never interrupted.
   */
  signOut() {
    this._setSavedToken(null);
    this.user = null;
    this.syncState = 'idle';
    this.lastSynced = null;
    this.lastError = null;
    this._notify();
  }

  /**
   * Queue a cloud sync with debouncing (1000ms) so rapid in-game actions
   * don't flood the serverless endpoints.
   */
  queueSync(saves, activeSlot) {
    if (!this.status.enabled || !this.user || !this.token) {
      return;
    }

    this._pendingPayload = { saves, activeSlot };
    this.syncState = 'syncing';
    this._notify();

    clearTimeout(this._syncDebounceTimer);
    this._syncDebounceTimer = setTimeout(() => {
      this._flushPendingSync();
    }, 1200);
  }

  async _flushPendingSync() {
    if (!this._pendingPayload || !this.token) return;
    const payload = this._pendingPayload;
    this._pendingPayload = null;

    try {
      const res = await fetch('/api/saves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Sync failed with HTTP ${res.status}`);
      }

      this.syncState = 'synced';
      this.lastSynced = Date.now();
      this.lastError = null;
      this._notify();
    } catch (err) {
      console.warn('Cloud sync error:', err.message);
      this.syncState = 'error';
      this.lastError = err.message;
      this._notify();
    }
  }

  /**
   * Merge local saves with cloud saves and push the unified state.
   */
  async syncWithCloud(onLocalSavesChanged, preloadedCloudSaves = null, preloadedActiveSlot = null) {
    if (!this.status.enabled || !this.user || !this.token) {
      return;
    }

    try {
      this.syncState = 'syncing';
      this._notify();

      let cloudSaves = preloadedCloudSaves;
      let cloudActiveSlot = preloadedActiveSlot;

      if (!cloudSaves) {
        const res = await fetch('/api/saves', {
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          cloudSaves = data.saves;
          cloudActiveSlot = data.activeSlot;
        }
      }

      // Read current local saves
      let localSaves = [null, null, null];
      try {
        const raw = localStorage.getItem('tower_defense_saves_v2');
        if (raw) localSaves = JSON.parse(raw) || [null, null, null];
      } catch {
        localSaves = [null, null, null];
      }

      let localActiveSlot = 0;
      try {
        const rawSlot = localStorage.getItem('tower_defense_active_slot_v2');
        if (rawSlot !== null) localActiveSlot = parseInt(rawSlot, 10) || 0;
      } catch {
        localActiveSlot = 0;
      }

      // Merge strategy: per slot, take whichever has newer lastSaved timestamp
      let changed = false;
      const mergedSaves = [null, null, null];

      for (let i = 0; i < 3; i++) {
        const local = localSaves[i];
        const cloud = Array.isArray(cloudSaves) ? cloudSaves[i] : null;

        if (local && !cloud) {
          mergedSaves[i] = local;
          changed = true; // Needs to be uploaded to cloud
        } else if (!local && cloud) {
          mergedSaves[i] = cloud;
          changed = true; // Needs to be saved locally
        } else if (local && cloud) {
          const localTime = local.lastSaved || local.createdAt || 0;
          const cloudTime = cloud.lastSaved || cloud.createdAt || 0;
          if (localTime >= cloudTime) {
            mergedSaves[i] = local;
            if (localTime > cloudTime) changed = true;
          } else {
            mergedSaves[i] = cloud;
            changed = true;
          }
        } else {
          mergedSaves[i] = null;
        }
      }

      // Update local storage with merged saves
      localStorage.setItem('tower_defense_saves_v2', JSON.stringify(mergedSaves));
      if (typeof cloudActiveSlot === 'number' && !localSaves[localActiveSlot] && mergedSaves[cloudActiveSlot]) {
        localStorage.setItem('tower_defense_active_slot_v2', String(cloudActiveSlot));
      }

      // Always push unified merged state to cloud
      await fetch('/api/saves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`
        },
        body: JSON.stringify({
          saves: mergedSaves,
          activeSlot: localActiveSlot
        })
      });

      this.syncState = 'synced';
      this.lastSynced = Date.now();
      this.lastError = null;
      this._notify();

      if (typeof onLocalSavesChanged === 'function') {
        onLocalSavesChanged(mergedSaves);
      }
    } catch (err) {
      console.warn('Sync with cloud failed:', err.message);
      this.syncState = 'error';
      this.lastError = err.message;
      this._notify();
    }
  }
}

export const cloudStorage = new CloudStorageService();
