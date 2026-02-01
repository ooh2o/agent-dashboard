import { APPS, DOCK_APPS, getApp } from '../apps-registry';

describe('Apps Registry', () => {
  describe('APPS', () => {
    it('contains all required apps', () => {
      const appIds = APPS.map(app => app.id);

      expect(appIds).toContain('activity-monitor');
      expect(appIds).toContain('memory-browser');
      expect(appIds).toContain('message-center');
      expect(appIds).toContain('cost-dashboard');
      expect(appIds).toContain('agent-spawner');
      expect(appIds).toContain('file-browser');
      expect(appIds).toContain('settings');
      expect(appIds).toContain('tools-inspector');
      expect(appIds).toContain('calendar');
      expect(appIds).toContain('notifications');
      expect(appIds).toContain('terminal');
      expect(appIds).toContain('task-queue');
    });

    it('each app has required fields', () => {
      APPS.forEach(app => {
        expect(app.id).toBeDefined();
        expect(typeof app.id).toBe('string');
        expect(app.name).toBeDefined();
        expect(typeof app.name).toBe('string');
        expect(app.icon).toBeDefined();
        expect(typeof app.icon).toBe('string');
      });
    });

    it('each app has unique id', () => {
      const ids = APPS.map(app => app.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('apps have proper icons', () => {
      APPS.forEach(app => {
        // Icons should be emoji strings
        expect(app.icon.length).toBeGreaterThan(0);
      });
    });
  });

  describe('DOCK_APPS', () => {
    it('contains subset of app ids', () => {
      const allAppIds = APPS.map(app => app.id);
      DOCK_APPS.forEach(dockAppId => {
        expect(allAppIds).toContain(dockAppId);
      });
    });

    it('contains commonly used apps', () => {
      expect(DOCK_APPS).toContain('activity-monitor');
      expect(DOCK_APPS).toContain('terminal');
      expect(DOCK_APPS).toContain('settings');
    });

    it('has unique entries', () => {
      const uniqueDockApps = new Set(DOCK_APPS);
      expect(uniqueDockApps.size).toBe(DOCK_APPS.length);
    });
  });

  describe('getApp', () => {
    it('returns app by id', () => {
      const app = getApp('activity-monitor');

      expect(app).toBeDefined();
      expect(app?.id).toBe('activity-monitor');
      expect(app?.name).toBe('Activity Monitor');
    });

    it('returns undefined for unknown id', () => {
      const app = getApp('nonexistent-app');
      expect(app).toBeUndefined();
    });

    it('returns correct app for each registered app', () => {
      APPS.forEach(expectedApp => {
        const app = getApp(expectedApp.id);
        expect(app).toEqual(expectedApp);
      });
    });
  });
});
