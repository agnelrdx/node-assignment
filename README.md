# Backend Programming Challenge

- [Background](#background)
- [Endpoints](#endpoints)
  - [`POST /events/clear`](#post-eventsclear)
  - [`POST /events`](#post-events)
  - [`GET /events`](#get-events)
  - [`GET /events/summary`](#get-eventssummary)
- [Database Setup](#database-setup)
- [Building the Application](#building-the-application)
- [Validating the Application](#validating-the-application)

## Background

Imagine a backend server for a chat room. The server will store a record of
events and will aggregate the event history at various levels for reporting
purposes. We don't have (or want) a UI for this server, so our implementation
will be API-only, responding to HTTP requests.

Please make sure that your application persists data across restarts. The
purpose of this challenge is to get an idea of how you think about, and execute
on, solving a problem. We are interested in seeing well-crafted, well-factored
code. This project should be completed using Node and Express. Out of respect
for your time, we don’t expect you to spend more than 4 hours on this exercise.

In this challenge we aren’t worried about edge cases that would cause errors.  
For instance, you can assume that all data posted to `/events` is in the correct
format. You can assume that any event posted is a valid event for that time. In
a real server, having an exit event before an enter event might be a problem,
but we aren’t worried about things like that for this challenge.

However, if any endpoint encounters an error (e.g. a missing input field) the
application should fail gracefully. Any unsuccessful request should return a
non-200 HTTP response code with `Content-Type: application/json` and a body of
`{"status": "error"}`.

## Endpoints

This repository contains a basic template to use for building out the
application. While the [tests](./app.spec.js) provide some specific details
about the expected inputs and outputs for each route, what follows is a high
level description of each:

### `POST /events/clear`

This should clear out all data in the database and will be used to ensure a
consistent start state for the automated tests that run against this
application.

Example response:

```
HTTP/1.1 200 OK
Content-Type: application/json

{"status": "ok"}
```

### `POST /events`

This should allow the creation of events that occurred at a specific time for 4
separate event types:

#### Event: `enter`

```json
{
  "date": "1985-10-26T09:00:00Z",
  "user": "Doc",
  "type": "enter"
}
```

#### Event: `comment`

```json
{
  "date": "1985-10-26T09:01:00Z",
  "user": "Doc",
  "type": "comment",
  "message": "I love plutonium!"
}
```

#### Event: `highfive`

```json
{
  "date": "1985-10-26T09:02:00Z",
  "user": "Marty",
  "type": "highfive",
  "otheruser": "Doc"
}
```

#### Event: `leave`

```json
{
  "date": "1985-10-26T09:03:00Z",
  "user": "Doc",
  "type": "leave"
}
```

All successful requests should respond with a `200` status and the following
body:

```
HTTP/1.1 200 OK
Content-Type: application/json

{"status": "ok"}
```

### `GET /events`

This should return a list of all events, ordered ascending by event date. Allows
optional parameters of `to` and `from` to limit the results.

Example Request:

```
GET /events?from=1985-10-01T00:00:00Z&to=1985-10-31T23:59:59Z
```

Example response:

```
HTTP/1.1 200 OK
Content-Type: application/json

{
  events: [
    {
      "date": "1985-10-26T09:00:00Z",
      "user": "Doc",
      "type": "enter"
    },
    // ...
  ]
}
```

### `GET /events/summary`

This returns a count of each type of event that occurred during the specified
timeframe. Accepts the parameters `to`, `from`, and `by` to control the scoping
of results and how they are aggregated. The `by` parameter accepts the values
`minute`, `hour`, or `day` to control the scope of the aggregation timestamp.

Example request:

```
GET /events/summary?from=1985-10-01T00:00:00Z&to=1985-10-31T23:59:59Z&by=day
```

Example response:

```
HTTP/1.1 200 OK
Content-Type: application/json

{
  events: [
    {
      "date": "1985-10-26T00:00:00Z",
      "enters": 1,
      "leaves": 1,
      "comments": 1,
      "highfives": 1
    }
  ]
}
```

The aggregation specified in the `by` parameter determines the date format that
is used:

- `day` - `YYYY-MM-DDT00:00:00Z`
- `hour` - `YYYY-MM-DDTHH:00:00Z`
- `minute` - `YYYY-MM-DDTHH:MM:00Z`

## Setup

The application template relies on SQLite, which is installed by default on OSX
machines. If you need to install from Homebrew, you can run:

```
brew install sqlite
```

Dependencies can be installed with `yarn`:

```
yarn
```

## Database Setup

We provide a single file (`schema.sql`) for managing your database schema. It
includes information and links to documentation to allow you to quickly get
started creating your database structure. After adding your table definitions,
you can use the `db:migrate` script:

```
yarn db:migrate
```

If you need to start over, you can run the `db:drop` script:

```
yarn db:drop
```

## Building the Application

A single entry point (`app.ts`) is provided for you with access to an
initialized database connection. More information on how to use the
promise-based sqlite library can be found on the project's [Github page][2].

You can add HTTP endpoints in the appropriate place inside the main `init()`
function. Running the app can be done using the `start` script:

```
yarn start
```

## Validating the Application

Based on the specs above, we have provided an initial set of tests that you can
run to verify correctness of your application. By default, tests with an
implementation are skipped until you're ready to enable them. There is also a
collection of potential tests to write as well.

To run the tests:

```
yarn test
```

While writing tests isn't necessary for this exercise, they are provided as a
convenience if that helps to aid in development. Feel free to build on these as
you see fit.

[1]: https://sqlite.org/index.html
[2]: https://github.com/kriasoft/node-sqlite#readme
