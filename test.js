const ohm = require('ohm-js')
const fs = require('fs')
const assert = require('assert')

// The ohm.grammar call will read in the file and parse it into a grammar object.
const grammar = ohm.grammar(fs.readFileSync('./grammar.ohm').toString())

// console.log(grammar)

// Now we can add semantics.

// This creates a set of semantics called sem with the operation toJS. The semantics
// are essentially a bunch of functions matching up to each rule in the grammar.
// Each function will be called when the corresponding rule in the grammar is parsed.
// The Number function above will be called when the Number rule in the grammar is
// parsed. The grammar defines what chunks are in the language. The semantics define
// what to do with chunks once they’ve been parsed.


// The semantic actions
const sem = grammar.createSemantics().addOperation('toJS', {
  // The action for Number no longer does anything interesting.
  // It receives the child node ‘a’ and returns the result of toJS on the child.
  // In other words the Number rule simply returns whatever its child rule matched.
  // Since this is the default behavior of any rule in Ohm we can actually just
  // leave the Number action out. Ohm will do it for us
  Number(a) {
    console.log('recognizing general number', this.sourceString)
    return a.toJS()
  },

  int(a) {
    console.log('recognizing integers', this.sourceString)
    return parseInt(this.sourceString, 10)
  },

  float(a, b, c) {
    console.log('recognizing floats', this.sourceString)
    return parseFloat(this.sourceString)
  },

  hex(a, b) {
    console.log('recognizing hex', this.sourceString)
    return parseInt(this.sourceString, 16)
  }
})

const test = (input, answer) => {
  const match = grammar.match(input)
  if (match.failed()) {
    return console.log(`input failed to match ${input} ${match.message}`)
  }

  const result = sem(match).toJS()

  assert.deepEqual(result, answer)
  console.log(`success = ${result} ${answer}`)
  console.log('-------------------------\n')
}

test("123", 123)
test("999", 999)

test("1.2", 1.2)
test("0.4", 0.4)
test("123.456", 123.456)
test("123234.45", 123234.45)

test("0x456", 0x456)
test("0xFF", 255)

test("abc", 999)
