'use strict'

const ohm = require('ohm-js')
const fs = require('fs')
const assert = require('assert')

const { Scope } = require('./ast')
const { make } = require('./semantics')

// The ohm.grammar call will read in the file and parse it into a grammar object.
const grammar = ohm.grammar(fs.readFileSync('./grammar.ohm').toString())

let semantics = grammar.createSemantics()

const ASTBuilder = make(semantics).ASTBuilder

const GLOBAL = new Scope(null)

const test = (input, answer) => {
  const match = grammar.match(input)
  if (match.failed()) {
    return console.log(`FAILURE: input failed to match ${input} ${match.message}`)
  }

  const ast = ASTBuilder(match).toAST()
  const result = ast.resolve(GLOBAL)
  console.log(`result = ${result.val}`)

  assert.deepEqual(result.jsEquals(answer), true)
  console.log(`success = ${answer}`)
  console.log('-------------------------\n')
}

test("123", 123)
test("999", 999)

test("1.4e3", 1.4e3)
test("123.4e-3", 123.4e-3)

test("1.2", 1.2)
test("0.4", 0.4)
test("123.456", 123.456)
test("123234.45", 123234.45)

test("0x456", 0x456)
test("0xFF", 255)

test('0o77', 63)
test('0o23', 0o23)

test("4 + 3", 7)
test("7 - 3", 4)
test("7 * 3", 21)


// Tests to work with the new symbol syntax
test('x = 10', 10)
test('x', 10)
test('x * 2', 20)
test('x * 0x2', 20)


test('4 == 4', true)
test('4 != 4', false)
test('4 != 5', true)


test('4 < 4', false)
test('4 < 5', true)
test('4 <= 5', true)
test('4 > 4', false)
test('41 > 5', true)
test('41 >= 5', true)


test('{ 4 + 5 }', 9)

test(`{
  x=4*5
  y=x+6
  y-3
}`, 23)


// test("abc", 999)




