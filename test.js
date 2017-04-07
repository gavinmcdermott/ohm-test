'use strict'

const ohm = require('ohm-js')
const fs = require('fs')
const assert = require('assert')

// The ohm.grammar call will read in the file and parse it into a grammar object.
const grammar = ohm.grammar(fs.readFileSync('./grammar.ohm').toString())

// Instead we delegate to the existing calc operation.

// This delegation system is a key part of Ohm’s design. You can have multiple
// semantic operations which call each other, as long as they are in the same
// set of semantics
let semantics = grammar.createSemantics()

// Now we can add semantics.

// This creates a set of semantics called sem with the operation toJS. The semantics
// are essentially a bunch of functions matching up to each rule in the grammar.
// Each function will be called when the corresponding rule in the grammar is parsed.
// The Number function above will be called when the Number rule in the grammar is
// parsed. The grammar defines what chunks are in the language. The semantics define
// what to do with chunks once they’ve been parsed.


// This class represents a number - returns itself when resolve is called
// resolution being the key concept
class MNumber {
  constructor(val) { this.val = val }
  resolve(scope) { return this }
  jsEquals(jsval) { return this.val == jsval }
}

class MSymbol {
  constructor(name) {
    this.name = name
  }
  resolve(scope) {
    console.log('=> in MSymbol', scope)
    return scope.getSymbol(this.name)
  }
}



// Now we need a place to actually sort what the symbols point to. This is called a scope.
// For now we will have only one scope called GLOBAL, but in the future we will have more.
class Scope {
  constructor() {
    console.log('=> making new Scope')
    this.storage = {}
  }
  setSymbol(sym, obj) {
    console.log('=> in Scope.set', sym, obj)
    this.storage[sym.name] = obj
    return this.storage[sym.name]
  }
  getSymbol(name) {
    console.log('=> in Scope.get', name)
    if (this.storage[name]) return this.storage[name]
    return null
  }
}

// Now we can create the Assignment operator which actually sets the symbol’s value.
class Assignment {
  constructor(sym, val) {
    this.symbol = sym
    this.val = val
  }
  resolve(scope) {
    // return scope.setSymbol(this.symbol, this.val)
    console.log('=> in assignment', scope)
    return scope.setSymbol(this.symbol, this.val.resolve(scope))
  }
}


// BinOp accepts the operation and two values to perform the operation on
// (operands). The resolve method will call resolve on the two
// operands, pull out the underlying Javascript values, then return a new MNumber
// by combining them into new values.
// Note: We could skip calling resolve on the operands because resolve() on a
// plain number just returns itself. However, I included the resolve call here
// because later on the operand might not be a number. It might be a symbol or
// function instead. Defining everything in terms of resolve keeps the code future-proof.
class BinOp {
  constructor(op, A, B) {
    this.op = op
    this.A = A
    this.B = B
  }
  resolve(scope) {
    const a = this.A.resolve(scope).val
    const b = this.B.resolve(scope).val

    if (this.op == 'add') return new MNumber(a+b)
    if (this.op == 'sub') return new MNumber(a-b)
    if (this.op == 'mul') return new MNumber(a*b)
    if (this.op == 'div') return new MNumber(a/b)
  }
}




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

  AddExpr(a) {
    console.log('recognizing add', this.sourceString)
    return a.calc()
  },

  AddExpr_plus(a,_,b) {
    console.log('doing add', this.sourceString)
    return a.calc() + b.calc()
  },

  MulExpr(a) {
    console.log('recognizing mul', this.sourceString)
    return a.calc()
  },

  MulExpr_times(a,_,b) {
    console.log('doing mul', this.sourceString)
    return a.calc() * b.calc()
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
  AddExpr_plus(a, _, b) { return new BinOp('add', a.toAST(), b.toAST()) },
  AddExpr_minus(a, _, b) { return new BinOp('sub', a.toAST(), b.toAST()) },
  MulExpr_times(a, _, b) { return new BinOp('mul', a.toAST(), b.toAST()) },
  MulExpr_divide(a, _, b) { return new BinOp('div', a.toAST(), b.toAST()) },
  PriExpr_paren(_, a, __) { return a.toAST() },

  Assign(a, _, b) {
    console.log('recognizing Assign', this.sourceString)
    let foo = new Assignment(a.toAST(), b.toAST())
    console.log(foo)
    return foo
  },
  Identifier(a, b) {
    console.log('recognizing Identifier', this.sourceString)
    let foo = new MSymbol(this.sourceString, null)
    console.log(foo)
    return foo
  },

  Number(a) { return new MNumber(a.calc()) }
})







const GLOBAL = new Scope(null)

const test = (input, answer) => {
  const match = grammar.match(input)
  if (match.failed()) {
    return console.log(`FAILURE: input failed to match ${input} ${match.message}`)
  }

  const ast = ASTBuilder(match).toAST()
  const result = ast.resolve(GLOBAL)
  console.log(`result = ${result}`)

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

test("4+3", 7)
test("7-3", 4)
test("7*3", 21)


// Tests to work with the new symbol syntax
test('x = 10', 10)
test('x', 10)
test('x * 2', 20)
test('x * 0x2', 20)


test("abc", 999)




