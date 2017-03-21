const ohm = require('ohm-js')
const fs = require('fs')
const assert = require('assert')

// The ohm.grammar call will read in the file and parse it into a grammar object.
const grammar = ohm.grammar(fs.readFileSync('./grammar.ohm').toString())

// Now we can add semantics.
var sem = grammar.createSemantics().addOperation('toJS', {
  Number: function(a) {
    return parseInt(this.sourceString,10)
  }
})
