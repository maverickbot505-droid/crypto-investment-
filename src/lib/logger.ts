import winston from 
'
winston
'


import winston from 'winston'

const format = winston.format.combine(
  winston.format.timestamp({ format: () => new Date().toISOString() }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    return timestamp + ' [' + level.toUpperCase() + ']: ' + message + (stack ? '\\n' + stack : '')
  })
)

const transports: winston.transport[] = []


if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format,
      level: 'debug',
    })
  )
} else {
const logDir = process.env.LOG_DIR || './logs'

  transports.push(
    new winston.transports.File({
      filename: logDir + '/error-' + process.env.NODE_ENV + '.log',
      level: 'error',
      format,
    }),
    new winston.transports.File({
      filename: logDir + '/combined-' + process.env.NODE_ENV + '.log',
      level: 'info',
      format,
    })
  )
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  exitOnError: false,
  defaultMeta: { service: 'investment-platform' },
  transports,
})

export function errorLogger(message: string) {
  return (...args: unknown[]) => logger.error(message, args[0] ? { args: args } : {})
}
