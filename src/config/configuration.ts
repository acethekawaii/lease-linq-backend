export default () => ({
  port: parseInt(process.env.PORT!, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  printer: {
    // Shared secret the H10S printer agent presents when it connects.
    // Leave unset to disable the check (dev only).
    deviceToken: process.env.PRINTER_DEVICE_TOKEN,
    // Which device a print job targets when none is specified.
    defaultDeviceId: process.env.PRINTER_DEFAULT_DEVICE_ID || 'default',
  },
});
