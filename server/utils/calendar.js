const ics = require('ics');

/**
 * Generate an .ics calendar string
 * @param {Object} details 
 * @param {string} details.title - Event title
 * @param {string} details.description - Event description
 * @param {Date} details.start - Start date
 * @param {number} details.duration - Duration in minutes
 * @param {string} details.location - Location or Meeting Link
 * @returns {Promise<string>} The .ics formatted string
 */
const generateICS = (details) => {
  return new Promise((resolve, reject) => {
    const { title, description, start, duration, location } = details;
    const startDate = new Date(start);

    const event = {
      start: [
        startDate.getFullYear(),
        startDate.getMonth() + 1,
        startDate.getDate(),
        startDate.getHours(),
        startDate.getMinutes(),
      ],
      duration: { minutes: duration || 60 },
      title: title,
      description: description,
      location: location || 'Online/TBD',
      status: 'CONFIRMED',
      busyStatus: 'BUSY',
      organizer: { name: 'TalentBridge', email: 'no-reply@talentbridge.com' },
      alarms: [
        { action: 'display', description: 'Reminder', trigger: { hours: 24, minutes: 0, before: true } },
        { action: 'display', description: 'Reminder', trigger: { minutes: 30, before: true } },
      ],
    };

    ics.createEvent(event, (error, value) => {
      if (error) {
        reject(error);
      }
      resolve(value);
    });
  });
};

module.exports = { generateICS };
