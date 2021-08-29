import { Database } from 'sqlite'
import express, { Express, Request } from 'express'

const getQuery = (from: string | undefined, to: string | undefined): string => {
  if (from && to) {
    /* simple date validation since adding additional package is overkill */
    if (!/^T|Z/i.test(from) || !/^T|Z/i.test(to)) throw new Error()
    return `SELECT * FROM events WHERE date BETWEEN "${(from as string).split('T')[0]}" AND "${
      (to as string).split('T')[0]
    }"`
  }
  if (from && !to) {
    if (!/^T|Z/i.test(from)) throw new Error()
    return `SELECT * FROM events WHERE date > "${(from as string).split('T')[0]}"`
  }
  if (!from && to) {
    if (!/^T|Z/i.test(to)) throw new Error()
    return `SELECT * FROM events WHERE date < "${(to as string).split('T')[0]}"`
  }
  return `SELECT * FROM events`
}

const getDate = (type: string, date: string) => {
  if (type === 'day') return `${date.split('T')[0]}T00:00:00Z`
  if (type === 'hour') return `${date.split(':')[0]}:00:00Z`
  return date
}

const init = (db: Database): Express => {
  const app = express()
  app.use(express.json())

  app.post('/events/clear', async (req, resp) => {
    await db.exec(`DELETE FROM events`)
    resp.status(200).json({ status: 'ok' })
  })

  app.post('/events', async (req, resp) => {
    try {
      const body = Array.isArray(req.body) ? req.body : [req.body] // Bulk insert for dev purpose
      const promises = body.map(content => {
        const { type, user, otheruser: otherUser, message, date } = content
        return db.run(`INSERT INTO events(type, user, otherUser, message, date) VALUES(?, ?, ?, ?, ?)`, [
          type,
          user,
          otherUser,
          message,
          date || new Date().toISOString()
        ])
      })
      await Promise.all(promises)
      resp.status(200).json({ status: 'ok' })
    } catch (error) {
      console.log(error)
      resp.status(422).json({ status: 'error' })
    }
  })

  app.get('/events', async (req: Request, resp) => {
    try {
      const { from, to } = req.query
      const query = getQuery(from as string | undefined, to as string | undefined)
      const events = await db.all(query)
      resp.status(200).json({ events: events.sort((a, b) => (new Date(a.date) as any) - (new Date(b.date) as any)) })
    } catch (error) {
      console.log(error)
      resp.status(422).json({ status: 'error' })
    }
  })

  app.get('/events/summary', async (req, resp) => {
    try {
      const { from, to, by } = req.query
      if (!from || !to) throw new Error()
      const query = getQuery(from as string | undefined, to as string | undefined)
      const events = await db.all(query)
      const eventSummary = events.reduce((acc, event) => {
        let summary = {}
        const date = getDate(by as string, event.date)
        if (acc[date]) {
          acc[date] = {
            date: date,
            enters: /enter/.test(event.type) ? acc[date].enters + 1 : acc[date].enters, // Regex for case safety
            leaves: /leave/.test(event.type) ? acc[date].leaves + 1 : acc[date].leaves,
            comments: /comment/.test(event.type) ? acc[date].comments + 1 : acc[date].comments,
            highfives: /highfive/.test(event.type) ? acc[date].highfives + 1 : acc[date].highfives
          }
        } else {
          summary = {
            [date]: {
              date: date,
              enters: /enter/.test(event.type) ? 1 : 0,
              leaves: /leave/.test(event.type) ? 1 : 0,
              comments: /comment/.test(event.type) ? 1 : 0,
              highfives: /highfive/.test(event.type) ? 1 : 0
            }
          }
        }
        return { ...acc, ...summary }
      }, {})
      resp.status(200).json({ events: Object.keys(eventSummary).map(v => eventSummary[v]) })
    } catch (error) {
      console.log(error)
      resp.status(422).json({ status: 'error' })
    }
  })

  return app
}

export { init }
