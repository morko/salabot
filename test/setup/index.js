/**
 * Setup for each test
 */
require('dotenv').config()
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);