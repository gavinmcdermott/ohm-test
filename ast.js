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

    if (this.op == 'add') return new MNumber(a + b)
    if (this.op == 'sub') return new MNumber(a - b)
    if (this.op == 'mul') return new MNumber(a * b)
    if (this.op == 'div') return new MNumber(a / b)
    if (this.op == 'eq') return new MNumber(a == b)
  }
}



module.exports = {
  MNumber,
  MSymbol,
  BinOp,
  Assignment,
  Scope,
}
