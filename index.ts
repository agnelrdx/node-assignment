import path from 'path'

import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

import { init } from './app'

const filename = path.resolve(__dirname, 'development.sqlite3')

open({ filename, driver: sqlite3.Database }).then(db => {
  const app = init(db)

  app.listen(3000, () => console.log('listening on port 3000'))
})
