'use strict'

const AST = require('./ast')

// Now we can add semantics.

// This creates a set of semantics called sem with the operation toJS. The semantics
// are essentially a bunch of functions matching up to each rule in the grammar.
// Each function will be called when the corresponding rule in the grammar is parsed.
// The Number function above will be called when the Number rule in the grammar is
// parsed. The grammar defines what chunks are in the language. The semantics define
// what to do with chunks once they’ve been parsed.

module.exports.make = (semantics) => {

  // Instead we delegate to the existing calc operation.

  // This delegation system is a key part of Ohm’s design. You can have multiple
  // semantic operations which call each other, as long as they are in the same
  // set of semantics

  // The semantic actions
  const Calculator = semantics.addOperation('calc', {
    // The action for Number no longer does anything interesting.
    // It receives the child node ‘a’ and returns the result of toJS on the child.
    // In other words the Number rule simply returns whatever its child rule matched.
    // Since this is the default behavior of any rule in Ohm we can actually just
    // leave the Number action out. Ohm will do it for us...

    // Number(a) {
    //   console.log('recognizing general number', this.sourceString)
    //   return a.calc()
    // },

    MathOp(a) {
      console.log('recognizing add', this.sourceString)
      return a.calc()
    },

    Add(a,_,b) {
      console.log('doing add', this.sourceString)
      return a.calc() + b.calc()
    },

    Sub(a,_,b) {
      console.log('doing sub', this.sourceString)
      return a.calc() - b.calc()
    },

    Mul(a,_,b) {
      console.log('doing mul', this.sourceString)
      return a.calc() * b.calc()
    },

    Div(a,_,b) {
      console.log('doing div', this.sourceString)
      return a.calc() / b.calc()
    },

    int(a) {
      console.log('recognizing integers', this.sourceString)
      return parseInt(this.sourceString, 10)
    },

    float(a, b, c, d) {
      console.log('recognizing floats', this.sourceString)
      return parseFloat(this.sourceString)
    },

    oct(a, b) {
      console.log('recognizing oct', this.sourceString)
      return parseInt(this.sourceString.substring(2), 8)
    },

    hex(a, b) {
      console.log('recognizing hex', this.sourceString)
      return parseInt(this.sourceString.substring(2), 16)
    }
  })

  const ASTBuilder = semantics.addOperation('toAST', {
    Eq(a, _, b) { return new AST.BinOp('eq', a.toAST(), b.toAST()) },
    Add(a, _, b) { return new AST.BinOp('add', a.toAST(), b.toAST()) },
    Sub(a, _, b) { return new AST.BinOp('sub', a.toAST(), b.toAST()) },
    Mul(a, _, b) { return new AST.BinOp('mul', a.toAST(), b.toAST()) },
    Div(a, _, b) { return new AST.BinOp('div', a.toAST(), b.toAST()) },
    Group(_, a, __) { return a.toAST() },

    Assign(a, _, b) {
      console.log('recognizing Assign', this.sourceString)
      let foo = new AST.Assignment(a.toAST(), b.toAST())
      console.log(foo)
      return foo
    },

    // One more slight detail, I made the identifier rule be lower case. This is a
    // very subtle change but it’s worth mentioning. Rules beginning with an upper
    // case letter are syntactic, meaning there is an implicit space* match. For
    // identifiers we don’t want that, or else you could have an identifier with
    // spaces in the middle of it, like a b c. Rules beginning with a lower case
    // letter are lexical, meaning it will match what you specify in the rule and
    // nothing else. There is no implicit whitespace stripping.
    identifier(a, b) {
      console.log('recognizing Identifier', this.sourceString)
      let foo = new AST.MSymbol(this.sourceString, null)
      console.log(foo)
      return foo
    },

    Number(a) { return new AST.MNumber(a.calc()) }
  })

  return {
    Calculator,
    ASTBuilder
  }
}
