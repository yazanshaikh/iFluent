import client from './client';

export interface MaintenanceStatus {
  maintenance: boolean;
  message:     string;
}

export const maintenanceApi = {
  /** Lightweight public check — does NOT require auth. */
  status: () =>
    client
      .get<MaintenanceStatus>('/maintenance')
      .then((r) => r.data),
};
