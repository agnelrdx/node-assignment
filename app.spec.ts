import path from 'path'

import { Express } from 'express'
import request from 'supertest'
import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'

import { init } from './app'

const getBody = (body: any) =>
  body.events.map((v: any) => ({
    date: v.date,
    user: v.user,
    type: v.type,
    message: v.message
  }))

describe('Chat server', () => {
  let db: Database
  let app: Express

  beforeAll(async () => {
    const filename = path.resolve(__dirname, 'development.sqlite3')

    db = await open({ filename, driver: sqlite3.Database })
    app = init(db)
  })

  afterAll(async () => await db.close())

  describe('POST /events/clear', () => {
    it('clears all events', async () => {
      const { body, headers, status } = await request(app).post('/events/clear')

      expect(body).toEqual({ status: 'ok' })
      expect(headers['content-type']).toMatch('application/json')
      expect(status).toEqual(200)
    })
  })

  describe('with a clean database between runs', () => {
    beforeEach(async () => {
      await request(app).post('/events/clear')
    })

    describe('POST /events', () => {
      it('returns a non-200 status when there are missing fields in the request body', async () => {
        const { body, headers, status } = await request(app).post('/events')

        expect(body).toEqual({ status: 'error' })
        expect(headers['content-type']).toMatch('application/json')
        expect(status).toBe(422)
      })

      it('successfully records an `enter` event', async () => {
        const { body, headers, status } = await request(app).post('/events').send({
          date: '1985-10-26T09:00:00Z',
          user: 'Doc',
          type: 'enter'
        })

        expect(body).toEqual({ status: 'ok' })
        expect(headers['content-type']).toMatch('application/json')
        expect(status).toBe(200)
      })

      it('successfully records a `comment` event', async () => {
        const { body, headers, status } = await request(app).post('/events').send({
          date: '1985-10-26T09:01:00Z',
          user: 'Doc',
          type: 'comment',
          message: 'I love plutonium!'
        })

        expect(body).toEqual({ status: 'ok' })
        expect(headers['content-type']).toMatch('application/json')
        expect(status).toBe(200)
      })

      it('successfully records a `highfive` event', async () => {
        const { body, headers, status } = await request(app).post('/events').send({
          date: '1985-10-26T09:02:00Z',
          user: 'Marty',
          type: 'highfive',
          otheruser: 'Doc'
        })

        expect(body).toEqual({ status: 'ok' })
        expect(headers['content-type']).toMatch('application/json')
        expect(status).toBe(200)
      })

      it('successfully records a `leave` event', async () => {
        const { body, headers, status } = await request(app).post('/events').send({
          date: '1985-10-26T09:03:00Z',
          user: 'Doc',
          type: 'leave'
        })

        expect(body).toEqual({ status: 'ok' })
        expect(headers['content-type']).toMatch('application/json')
        expect(status).toBe(200)
      })
    })

    describe('GET /events', () => {
      beforeEach(async () => {
        const events = [
          {
            date: '2015-10-26T09:01:00Z',
            user: 'Doc',
            type: 'comment',
            message: "Roads? Where we're going we don't need roads."
          },
          {
            date: '1985-10-26T09:01:00Z',
            user: 'Doc',
            type: 'comment',
            message: 'I love plutonium'
          },
          {
            date: '1955-11-05T09:01:00Z',
            user: 'Doc',
            type: 'comment',
            message: 'The flux capacitor!'
          }
        ]

        for (const event of events) {
          await request(app).post('/events').send(event)
        }
      })

      it('returns a list of all recorded events in ascending order', async () => {
        const { body, headers, status } = await request(app).get('/events')
        const bodyModified = getBody(body) // Since data returned has few additional keys
        expect({ events: bodyModified }).toEqual({
          events: [
            {
              date: '1955-11-05T09:01:00Z',
              user: 'Doc',
              type: 'comment',
              message: 'The flux capacitor!'
            },
            {
              date: '1985-10-26T09:01:00Z',
              user: 'Doc',
              type: 'comment',
              message: 'I love plutonium'
            },
            {
              date: '2015-10-26T09:01:00Z',
              user: 'Doc',
              type: 'comment',
              message: "Roads? Where we're going we don't need roads."
            }
          ]
        })

        expect(headers['content-type']).toMatch('application/json')
        expect(status).toEqual(200)
      })

      it('can filter the list with events that happen after a certain date', async () => {
        const { body, headers, status } = await request(app).get('/events?from=1985-10-26T00:00:00Z')
        const bodyModified = getBody(body)
        expect({ events: bodyModified }).toEqual({
          events: [
            {
              date: '1985-10-26T09:01:00Z',
              user: 'Doc',
              type: 'comment',
              message: 'I love plutonium'
            },
            {
              date: '2015-10-26T09:01:00Z',
              user: 'Doc',
              type: 'comment',
              message: "Roads? Where we're going we don't need roads."
            }
          ]
        })

        expect(headers['content-type']).toMatch('application/json')
        expect(status).toEqual(200)
      })

      it('can filter the list with events that happen before a certain date', async () => {
        const { body, headers, status } = await request(app).get('/events?to=1985-10-02T23:59:59Z')
        const bodyModified = getBody(body)
        expect({ events: bodyModified }).toEqual({
          events: [
            {
              date: '1955-11-05T09:01:00Z',
              user: 'Doc',
              type: 'comment',
              message: 'The flux capacitor!'
            }
          ]
        })

        expect(headers['content-type']).toMatch('application/json')
        expect(status).toEqual(200)
      })

      it('can filter the list with events that happen between two dates', async () => {
        const { body, headers, status } = await request(app).get(
          '/events?from=1985-10-01T00:00:00Z&to=1985-10-27T23:59:59Z'
        )
        const bodyModified = getBody(body)
        expect({ events: bodyModified }).toEqual({
          events: [
            {
              date: '1985-10-26T09:01:00Z',
              user: 'Doc',
              type: 'comment',
              message: 'I love plutonium'
            }
          ]
        })

        expect(headers['content-type']).toMatch('application/json')
        expect(status).toEqual(200)
      })

      it('responds with a non-200 status when given an invalid date string', async () => {
        const { body, headers, status } = await request(app).get('/events?from=agnel&to=joseph')

        expect(body).toEqual({ status: 'error' })
        expect(headers['content-type']).toMatch('application/json')
        expect(status).toBe(422)
      })
    })

    describe('GET /events/summary', () => {
      beforeEach(async () => {
        const events = [
          {
            date: '1955-11-05T09:01:00Z',
            user: 'Doc',
            type: 'comment',
            message: 'The flux capacitor!'
          }
        ]

        for (const event of events) {
          await request(app).post('/events').send(event)
        }
      })

      it('responds with a non-200 response when not given a time frame or aggregation', async () => {
        const { body, headers, status } = await request(app).get('/events/summary')

        expect(body).toEqual({ status: 'error' })
        expect(status).toBe(422)
      })

      it('returns a list of events rolled up for a `day` time frame', async () => {
        const { body, headers, status } = await request(app).get('/events/summary').query({
          from: '1955-11-01T00:00:00Z',
          to: '1955-11-30T23:59:59Z',
          by: 'day'
        })
        expect(body).toEqual({
          events: [
            {
              date: '1955-11-05T00:00:00Z',
              enters: 0,
              leaves: 0,
              comments: 1,
              highfives: 0
            }
          ]
        })

        expect(headers['content-type']).toMatch('application/json')
        expect(status).toBe(200)
      })

      it('returns a list of events rolled up for a `minute` time frame', async () => {
        const { body, headers, status } = await request(app).get('/events/summary').query({
          from: '1955-11-01T00:00:00Z',
          to: '1955-11-30T23:59:59Z',
          by: 'minute'
        })
        expect(body).toEqual({
          events: [
            {
              date: '1955-11-05T09:01:00Z',
              enters: 0,
              leaves: 0,
              comments: 1,
              highfives: 0
            }
          ]
        })

        expect(headers['content-type']).toMatch('application/json')
        expect(status).toBe(200)
      })

      it('returns a list of events rolled up for a `hour` time frame', async () => {
        const { body, headers, status } = await request(app).get('/events/summary').query({
          from: '1955-11-01T00:00:00Z',
          to: '1955-11-30T23:59:59Z',
          by: 'hour'
        })
        expect(body).toEqual({
          events: [
            {
              date: '1955-11-05T09:00:00Z',
              enters: 0,
              leaves: 0,
              comments: 1,
              highfives: 0
            }
          ]
        })

        expect(headers['content-type']).toMatch('application/json')
        expect(status).toBe(200)
      })
    })
  })
})
