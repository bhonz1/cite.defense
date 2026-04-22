// Time slot configuration for the appointment system
export interface TimeSlotConfig {
  start: string;
  end: string;
  code: string;
  display: string;
}

export const TIME_SLOTS: TimeSlotConfig[] = [
  {
    start: '08:00',
    end: '10:00',
    code: 'T01',
    display: '8:00 AM - 10:00 AM'
  },
  {
    start: '10:00',
    end: '12:00',
    code: 'T02',
    display: '10:00 AM - 12:00 PM'
  },
  {
    start: '13:00',
    end: '15:00',
    code: 'T03',
    display: '1:00 PM - 3:00 PM'
  },
  {
    start: '15:00',
    end: '17:00',
    code: 'T04',
    display: '3:00 PM - 5:00 PM'
  }
];

// Helper functions for time slot operations
export const getTimeSlotByCode = (code: string): TimeSlotConfig | undefined => {
  return TIME_SLOTS.find(slot => slot.code === code);
};

export const getTimeSlotByStart = (start: string): TimeSlotConfig | undefined => {
  return TIME_SLOTS.find(slot => slot.start === start);
};

export const getTimeSlotByHour = (hour: number): TimeSlotConfig | undefined => {
  return TIME_SLOTS.find(slot => parseInt(slot.start.split(':')[0]) === hour);
};

export const getAllTimeSlots = (): TimeSlotConfig[] => {
  return TIME_SLOTS;
};

// Convert to API format
export const toApiFormat = () => {
  return TIME_SLOTS.map(slot => ({
    hour: parseInt(slot.start.split(':')[0]),
    time: slot.start,
    endTime: slot.end,
    code: slot.code,
    display: slot.display,
    time_desc: slot.display.replace('8:00 AM', '08:00 AM').replace('10:00 AM', '10:00 AM').replace('1:00 PM', '01:00 PM').replace('3:00 PM', '03:00 PM')
  }));
};
