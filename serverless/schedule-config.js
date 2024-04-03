module.exports = async ({ resolveVariable }) => {
  // Default schedule
  const schedules = [
    {
      schedule: {
        description: 'Run at 00:00 am (UTC) every day',
        rate: 'cron(0 0 * * ? *)',
      },
    },
  ];

  // Optional schedule depending on environment variable
  const SCHEDULE_HOURLY_ENABLED = await resolveVariable('env:SCHEDULE_HOURLY_ENABLED, null');
  if (SCHEDULE_HOURLY_ENABLED) {
    schedules.push({
      schedule: {
        description: 'Run every hour (UTC)',
        rate: 'cron(0 * * * ? *)',
      },
    });
  }

  // Resolver may return any JSON value (null, boolean, string, number, array or plain object)
  return {
    schedules,
  };
};
