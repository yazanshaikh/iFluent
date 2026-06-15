import client from './client';

export interface MaintenanceState {
  maintenance: boolean;
  message:     string | null;
}

export const maintenanceApi = {
  /** Admin: read current maintenance state. */
  get: () =>
    client.get<MaintenanceState>('/admin/maintenance').then((r) => r.data),

  /** Admin: turn the mobile apps maintenance screen on/off. */
  set: (enabled: boolean, message?: string) =>
    client
      .post<MaintenanceState>('/admin/maintenance', { enabled, message })
      .then((r) => r.data),
};
