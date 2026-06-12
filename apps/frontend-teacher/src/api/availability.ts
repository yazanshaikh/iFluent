import client from './client';

export interface AvailabilitySlot {
  id?:         number;
  day_of_week: number;   // 0 = Sunday … 6 = Saturday
  day_name?:   string;
  start_time:  string;   // "HH:MM"
  end_time:    string;   // "HH:MM"
  is_active?:  boolean;
}

export type NewSlot = Pick<AvailabilitySlot, 'day_of_week' | 'start_time' | 'end_time'>;

export const availabilityApi = {
  /** Teacher's own weekly availability */
  list: () =>
    client.get<{ availability: AvailabilitySlot[] }>('/teacher/availability')
      .then((r) => r.data.availability),

  /** Replace the whole weekly schedule at once */
  save: (slots: NewSlot[]) =>
    client.post<{ availability: AvailabilitySlot[] }>('/teacher/availability/bulk', { slots })
      .then((r) => r.data.availability),
};
