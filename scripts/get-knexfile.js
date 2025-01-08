/**
 * @return - asl-schema/schema/index.js, returning SCHEMA and Knex Instance to query DB.
 *
 * asl-schema is ECMA module and not compatible with commonJs.
 * .eslintignore overrides the eslint check.
 * */
const objection = require('objection');
const Knex = require('knex');
const pg = require('pg');
const moment = require('moment');

async function getKnexFile() {
  try {
    const {test} = await import('@asl/schema/knexfile.js');

    return {
      ...test,
      client: 'pg'
    };
  } catch (error) {
    console.error('Error initializing DB:', error);
    throw error;
  }
}

// Define OIDs and corresponding parsing functions
const TIMESTAMPTZ_OID = 1184;
const TIMESTAMP_OID = 1114;
const DATE_OID = 1082;
const INT4_OID = 23;
const INT8_OID = 20;

const parseFn = val => (val === null ? null : moment(val).toISOString());
const dateParseFn = val => (val === null ? null : moment(val).format('YYYY-MM-DD'));
const intParseFn = val => (val === null ? null : parseInt(val, 10));

// Set PostgreSQL type parsers
pg.types.setTypeParser(TIMESTAMPTZ_OID, parseFn);
pg.types.setTypeParser(TIMESTAMP_OID, parseFn);
pg.types.setTypeParser(DATE_OID, dateParseFn);
pg.types.setTypeParser(INT4_OID, intParseFn);
pg.types.setTypeParser(INT8_OID, intParseFn);


// run function
getKnexFile();

module.exports = getKnexFile;
