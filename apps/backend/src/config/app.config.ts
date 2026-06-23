export default () => ({
    port: parseInt(process.env.PORT || '3001', 10),
  
    database: {
      url: process.env.DATABASE_URL,
    },
  
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN,
    },
  
    flaky: {
      latency: Number(process.env.FLAKY_LATENCY_MS || 0),
      failureRate: Number(process.env.FLAKY_FAILURE_RATE || 0),
    },
  });